<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DumpSqliteToJson extends Command
{
    protected $signature = 'db:dump-sqlite-to-json
                            {--source= : Path to the SQLite database file}
                            {--output= : Path for the JSON dump file (default: /tmp/dump.json)}';

    protected $description = 'Dump all SQLite tables to a JSON file for safe transfer to PostgreSQL';

    public function handle(): int
    {
        $source = $this->option('source') ?: config('database.connections.sqlite.database');
        $output = $this->option('output') ?: '/tmp/dump.json';

        if (! file_exists($source)) {
            $this->error("SQLite database not found: {$source}");

            return self::FAILURE;
        }

        $handle = @fopen($source, 'rb');
        if (! $handle) {
            $this->error("Cannot open: {$source}");

            return self::FAILURE;
        }
        $header = fread($handle, 16);
        fclose($handle);

        if (! str_starts_with($header, 'SQLite format 3')) {
            $this->error("Not a valid SQLite database: {$source}");

            return self::FAILURE;
        }

        config(['database.connections.sqlite_dump' => [
            'driver' => 'sqlite',
            'database' => $source,
            'foreign_key_constraints' => false,
        ]]);

        $db = DB::connection('sqlite_dump');

        $tables = collect($db->select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"))
            ->pluck('name')
            ->toArray();

        $dump = [];
        foreach ($tables as $table) {
            $rows = $db->table($table)->get()->toArray();
            if (! empty($rows)) {
                $dump[$table] = array_map(fn ($row) => (array) $row, $rows);
            }
        }

        file_put_contents($output, json_encode($dump, JSON_UNESCAPED_UNICODE));
        $size = round(filesize($output) / 1024, 1);
        $this->info('Dumped '.count($dump)." tables ({$size} KB) to {$output}");

        return self::SUCCESS;
    }
}
