<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductsTableSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('products')->insert([
            ['name' => 'Produit 1', 'barcode' => '111111', 'description' => null, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Produit 2', 'barcode' => '222222', 'description' => null, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Produit 3', 'barcode' => '333333', 'description' => null, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
