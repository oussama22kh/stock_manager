<?php

namespace Database\Seeders;

use App\Models\Emplacement;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;

class WarehousesTableSeeder extends Seeder
{
    public function run(): void
    {
        $warehouseA = Warehouse::create(['name' => 'Entrepôt A', 'location' => 'Bâtiment principal']);
        $warehouseB = Warehouse::create(['name' => 'Entrepôt B', 'location' => 'Bâtiment secondaire']);

        Emplacement::insert([
            ['warehouse_id' => $warehouseA->id, 'name' => 'Allée 1 - Étagère A', 'location' => null, 'created_at' => now(), 'updated_at' => now()],
            ['warehouse_id' => $warehouseA->id, 'name' => 'Allée 1 - Étagère B', 'location' => null, 'created_at' => now(), 'updated_at' => now()],
            ['warehouse_id' => $warehouseA->id, 'name' => 'Allée 2 - Étagère A', 'location' => null, 'created_at' => now(), 'updated_at' => now()],
            ['warehouse_id' => $warehouseB->id, 'name' => 'Zone de stockage 1', 'location' => null, 'created_at' => now(), 'updated_at' => now()],
            ['warehouse_id' => $warehouseB->id, 'name' => 'Zone de stockage 2', 'location' => null, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
