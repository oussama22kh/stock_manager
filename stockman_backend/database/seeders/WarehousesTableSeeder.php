<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class WarehousesTableSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('warehouses')->insert([
            ['name' => 'Zone A', 'location' => null, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Zone B', 'location' => null, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Zone C', 'location' => null, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
