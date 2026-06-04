<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MigrateSqliteToPostgres extends Command
{
    protected $signature = 'db:migrate-sqlite-to-pgsql
                            {--source= : Path to the SQLite database file}
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

        $sqlitePath = $this->option('source') ?: config('database.connections.sqlite.database');

        if (! file_exists($sqlitePath)) {
            $this->error("SQLite database not found at: {$sqlitePath}");

            return self::FAILURE;
        }

        $this->line("  Source: {$sqlitePath}");

        config(['database.connections.'.self::SQLITE_CONN => [
            'driver' => 'sqlite',
            'database' => $sqlitePath,
            'foreign_key_constraints' => false,
        ]]);

        $tables = $this->getMigratableTables();

        if ($this->option('fresh')) {
            $this->line('  Truncating PostgreSQL tables...');
            $this->disableForeignKeys();
            foreach (array_reverse($tables) as $table) {
                DB::connection(self::PGSQL_CONN)->table($table)->truncate();
            }
            $this->enableForeignKeys();
        }

        $totalRows = 0;
        foreach ($tables as $table) {
            try {
                if (! $this->option('fresh') && DB::connection(self::PGSQL_CONN)->table($table)->count() > 0) {
                    $this->line("  <fg=gray>{$table}: already has data (skipped)</>");

                    continue;
                }

                $rows = DB::connection(self::SQLITE_CONN)->table($table)->get();
                $count = $rows->count();
                if ($count === 0) {
                    $this->line("  <fg=gray>{$table}: 0 rows (skipped)</>");

                    continue;
                }

                $rowsArray = $rows->map(fn ($row) => (array) $row)->toArray();
                $this->disableForeignKeys();

                foreach (array_chunk($rowsArray, 500) as $chunk) {
                    DB::connection(self::PGSQL_CONN)->table($table)->insert($chunk);
                }

                $this->enableForeignKeys();
                $this->resetSequence($table);

                $this->line("  <fg=green>{$table}: {$count} rows</>");
                $totalRows += $count;
            } catch (\Exception $e) {
                $this->warn("  <fg=yellow>{$table}: failed — {$e->getMessage()}</>");
            }
        }

        $this->info("Migration complete. {$totalRows} total rows migrated.");

        return self::SUCCESS;
    }

    private function getMigratableTables(): array
    {
        $allTables = collect(Schema::connection(self::SQLITE_CONN)->getTableListing())
            ->reject(fn ($t) => $t === 'migrations')
            ->map(fn ($t) => str_replace('main.', '', $t))
            ->unique()
            ->values()
            ->toArray();

        $ordered = [];

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

        foreach ($priority as $table) {
            if (in_array($table, $allTables, true)) {
                $ordered[] = $table;
            }
        }

        foreach ($allTables as $table) {
            if (! in_array($table, $ordered, true)) {
                $ordered[] = $table;
            }
        }

        return $ordered;
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
        if (! Schema::connection(self::PGSQL_CONN)->hasColumn($table, 'id')) {
            return;
        }

        DB::connection(self::PGSQL_CONN)->statement(
            "SELECT setval(pg_get_serial_sequence(?, 'id'), COALESCE((SELECT MAX(id) FROM \"{$table}\"), 1))",
            [$table]
        );
    }
}
