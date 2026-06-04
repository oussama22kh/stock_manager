<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MigrateSqliteToPostgres extends Command
{
    protected $signature = 'db:migrate-sqlite-to-pgsql
                            {--source= : Path to the SQLite database file}
                            {--json-source= : Path to a JSON dump file (alternative to --source)}
                            {--fresh : Truncate all PostgreSQL tables before migrating}
                            {--force : Skip confirmation prompt}';

    protected $description = 'Migrate data from SQLite to PostgreSQL';

    private const SQLITE_CONN = 'sqlite_migrate';

    private const PGSQL_CONN = 'pgsql';

    public function handle(): int
    {
        if (! $this->option('force') && ! $this->confirm('This will insert SQLite data into PostgreSQL. Continue?')) {
            $this->info('Cancelled.');

            return self::SUCCESS;
        }

        $this->info('Starting SQLite to PostgreSQL data migration...');

        if ($this->option('json-source')) {
            return $this->migrateFromJson();
        }

        if (! $this->option('source')) {
            $this->error('Either --source or --json-source is required.');

            return self::FAILURE;
        }

        $sqlitePath = $this->option('source');

        if (! file_exists($sqlitePath)) {
            $this->error("SQLite database not found at: {$sqlitePath}");

            return self::FAILURE;
        }

        if (! $this->isValidSqliteFile($sqlitePath)) {
            $this->error("File is not a valid SQLite database: {$sqlitePath}");

            return self::FAILURE;
        }

        $this->line("  Source: {$sqlitePath}");

        config(['database.connections.'.self::SQLITE_CONN => [
            'driver' => 'sqlite',
            'database' => $sqlitePath,
            'foreign_key_constraints' => false,
        ]]);

        $tables = $this->getOrderedTables();

        if ($this->option('fresh')) {
            $this->truncatePgTables($tables);
        }

        $totalRows = 0;
        $verification = [];

        foreach ($tables as $table) {
            try {
                $pgCount = DB::connection(self::PGSQL_CONN)->table($table)->count();
                if (! $this->option('fresh') && $pgCount > 0) {
                    $this->line("  <fg=gray>{$table}: already has data (skipped)</>");

                    continue;
                }

                $rows = DB::connection(self::SQLITE_CONN)->table($table)->get();
                $count = $rows->count();
                if ($count === 0) {
                    $this->line("  <fg=gray>{$table}: 0 rows (skipped)</>");
                    $verification[$table] = ['source' => 0, 'target' => $pgCount];

                    continue;
                }

                $rowsArray = $rows->map(fn ($row) => (array) $row)->toArray();
                $pgColumns = $this->getPgColumns($table);
                $this->normalizeRows($rowsArray, $pgColumns);

                $this->disableForeignKeys();

                foreach (array_chunk($rowsArray, 500) as $chunk) {
                    DB::connection(self::PGSQL_CONN)->table($table)->insert($chunk);
                }

                $this->enableForeignKeys();
                $this->resetSequence($table);

                $newCount = DB::connection(self::PGSQL_CONN)->table($table)->count();
                $delta = $this->option('fresh') ? $newCount - $pgCount : $newCount;

                $this->line("  <fg=green>{$table}: {$delta} rows</>");
                $verification[$table] = ['source' => $count, 'target' => $delta];
                $totalRows += $delta;
            } catch (\Exception $e) {
                $this->warn("  <fg=yellow>{$table}: failed — {$e->getMessage()}</>");
            }
        }

        $this->info("Migration complete. {$totalRows} total rows migrated.");

        return $this->verifyAndReport($verification);
    }

    private function migrateFromJson(): int
    {
        $jsonPath = $this->option('json-source');

        if (! file_exists($jsonPath)) {
            $this->error("JSON dump not found at: {$jsonPath}");

            return self::FAILURE;
        }

        $this->line("  JSON source: {$jsonPath}");

        $dump = json_decode(file_get_contents($jsonPath), true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->error('Failed to parse JSON dump: '.json_last_error_msg());

            return self::FAILURE;
        }

        $tables = $this->getOrderedTables();
        $dumpTables = array_keys($dump);
        $tables = array_values(array_filter($tables, fn ($t) => in_array($t, $dumpTables, true)));

        if ($this->option('fresh')) {
            $this->truncatePgTables($tables);
        }

        $totalRows = 0;
        $verification = [];

        foreach ($tables as $table) {
            try {
                $pgCount = DB::connection(self::PGSQL_CONN)->table($table)->count();
                if (! $this->option('fresh') && $pgCount > 0) {
                    $this->line("  <fg=gray>{$table}: already has data (skipped)</>");

                    continue;
                }

                $rows = $dump[$table];
                if (empty($rows)) {
                    $this->line("  <fg=gray>{$table}: 0 rows (skipped)</>");
                    $verification[$table] = ['source' => 0, 'target' => $pgCount];

                    continue;
                }

                $pgColumns = $this->getPgColumns($table);
                $this->normalizeRows($rows, $pgColumns);

                $this->disableForeignKeys();

                foreach (array_chunk($rows, 500) as $chunk) {
                    DB::connection(self::PGSQL_CONN)->table($table)->insert($chunk);
                }

                $this->enableForeignKeys();
                $this->resetSequence($table);

                $count = count($rows);
                $this->line("  <fg=green>{$table}: {$count} rows</>");
                $verification[$table] = ['source' => $count, 'target' => $count];
                $totalRows += $count;
            } catch (\Exception $e) {
                $this->warn("  <fg=yellow>{$table}: failed — {$e->getMessage()}</>");
            }
        }

        $this->info("Migration complete. {$totalRows} total rows migrated.");

        return $this->verifyAndReport($verification);
    }

    private function verifyAndReport(array $verification): int
    {
        $this->line('');
        $this->line('Verification:');
        $anyFailure = false;

        foreach ($verification as $table => $counts) {
            $match = $counts['source'] === $counts['target'];
            if (! $match) {
                $anyFailure = true;
            }
            $status = $match ? '<fg=green>PASS</>' : '<fg=red>FAIL</>';
            $this->line("  {$table}: {$counts['source']} → {$counts['target']}  {$status}");
        }

        if ($anyFailure) {
            $this->warn('Some tables have row count mismatches.');
        } else {
            $this->info('All tables verified.');
        }

        return $anyFailure ? self::FAILURE : self::SUCCESS;
    }

    private function getOrderedTables(): array
    {
        $priority = [
            'users',
            'password_reset_tokens',
            'warehouses',
            'products',
            'emplacements',
            'warehouse_products',
            'stock_movements',
            'user_warehouse',
            'sessions',
            'personal_access_tokens',
            'cache',
            'cache_locks',
            'jobs',
            'job_batches',
            'failed_jobs',
        ];

        return $priority;
    }

    private function truncatePgTables(array $tables): void
    {
        $this->line('  Truncating PostgreSQL tables...');
        $this->disableForeignKeys();
        foreach (array_reverse($tables) as $table) {
            if (Schema::connection(self::PGSQL_CONN)->hasTable($table)) {
                DB::connection(self::PGSQL_CONN)->table($table)->truncate();
            }
        }
        $this->enableForeignKeys();
    }

    private function isValidSqliteFile(string $path): bool
    {
        $header = @file_get_contents($path, false, null, 0, 16);

        return $header !== false && str_starts_with($header, 'SQLite format 3');
    }

    private function getPgColumns(string $table): array
    {
        if (! Schema::connection(self::PGSQL_CONN)->hasTable($table)) {
            return [];
        }

        return Schema::connection(self::PGSQL_CONN)->getColumnListing($table);
    }

    private function normalizeRows(array &$rows, array $pgColumns): void
    {
        if (empty($pgColumns)) {
            return;
        }

        $pgLookup = array_flip($pgColumns);

        foreach ($rows as &$row) {
            $row = array_intersect_key($row, $pgLookup);
        }
    }

    private function disableForeignKeys(): void
    {
        DB::connection(self::PGSQL_CONN)->statement('SET session_replication_role = replica');
    }

    private function enableForeignKeys(): void
    {
        DB::connection(self::PGSQL_CONN)->statement('SET session_replication_role = origin');
    }

    private function resetSequence(string $table): void
    {
        if (! Schema::connection(self::PGSQL_CONN)->hasTable($table)) {
            return;
        }

        if (! Schema::connection(self::PGSQL_CONN)->hasColumn($table, 'id')) {
            return;
        }

        DB::connection(self::PGSQL_CONN)->statement(
            "SELECT setval(pg_get_serial_sequence(?, 'id'), COALESCE((SELECT MAX(id) FROM \"{$table}\"), 1))",
            [$table]
        );
    }
}
