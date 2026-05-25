<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductsTableSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('products')->insert([
            ['name' => 'Boulons M6', 'barcode' => '111111', 'description' => null, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Écrous M6', 'barcode' => '222222', 'description' => null, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Rondelles M6', 'barcode' => '333333', 'description' => null, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Vis M8', 'barcode' => '444444', 'description' => null, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Colliers de serrage', 'barcode' => '555555', 'description' => null, 'created_at' => now(), 'updated_at' => now()],
        ]);

        $emplacementA1 = DB::table('emplacements')->where('name', 'Allée 1 - Étagère A')->first();

        if ($emplacementA1) {
            DB::table('warehouse_products')->insert([
                [
                    'emplacement_id' => $emplacementA1->id,
                    'product_id' => 1,
                    'assigned_by' => 1,
                    'assigned_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'emplacement_id' => $emplacementA1->id,
                    'product_id' => 2,
                    'assigned_by' => 1,
                    'assigned_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }
    }
}
