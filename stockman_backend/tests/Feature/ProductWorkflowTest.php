<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_lookup_and_assignment()
    {
        $this->artisan('migrate');
        $this->seed();

        $login = $this->postJson('/api/login', [
            'login' => 'agent1',
            'password' => 'password',
        ]);
        $token = $login->json('token');

        $headers = ['Authorization' => "Bearer {$token}"];

        $resp = $this->getJson('/api/produits/code/111111', $headers);
        $resp->assertStatus(200);
        $this->assertEquals('Produit 1', $resp->json('nom_produit'));

        $assign = $this->patchJson('/api/produits/1/emplacement', [
            'emplacement_id' => 1,
        ], $headers);
        $assign->assertStatus(200);
        $this->assertEquals('Zone A', $assign->json('emplacement_nom'));

        $verify = $this->getJson('/api/produits/code/111111', $headers);
        $verify->assertStatus(200);
        $this->assertEquals('Zone A', $verify->json('emplacement_nom'));
    }
}
