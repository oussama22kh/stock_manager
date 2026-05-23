<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        User::factory()->create([
            'name' => 'Agent 1',
            'email' => 'agent1@stockman.app',
            'username' => 'agent1',
            'role' => 'agent',
        ]);

        $this->call([
            WarehousesTableSeeder::class,
            ProductsTableSeeder::class,
        ]);
    }
}
