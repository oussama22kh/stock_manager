<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private function loginAsAgent(): string
    {
        $resp = $this->postJson('/api/login', [
            'login' => 'agent1',
            'password' => 'password',
        ]);

        return $resp->json('token');
    }

    private function loginAsAdmin(): string
    {
        $resp = $this->postJson('/api/login', [
            'login' => 'admin',
            'password' => 'password',
        ]);

        return $resp->json('token');
    }

    public function test_product_lookup_and_assignment()
    {
        $this->artisan('migrate');
        $this->seed();

        $headers = ['Authorization' => 'Bearer '.$this->loginAsAgent()];

        $resp = $this->getJson('/api/produits/code/111111', $headers);
        $resp->assertStatus(200);
        $this->assertEquals('Boulons M6', $resp->json('nom_produit'));

        $assign = $this->patchJson('/api/produits/1/emplacement', [
            'emplacement_id' => 1,
        ], $headers);
        $assign->assertStatus(200);
        $this->assertEquals('Allée 1 - Étagère A', $assign->json('emplacement_nom'));
        $this->assertTrue($assign->json('already_assigned'));

        $verify = $this->getJson('/api/produits/code/111111', $headers);
        $verify->assertStatus(200);
        $this->assertEquals('Allée 1 - Étagère A', $verify->json('emplacement_nom'));
    }

    public function test_search_word_prefix_match()
    {
        $this->artisan('migrate');
        $this->seed();

        $headers = ['Authorization' => 'Bearer '.$this->loginAsAgent()];

        $resp = $this->getJson('/api/produits?search=boul', $headers);
        $resp->assertStatus(200);
        $resp->assertJsonFragment(['nom_produit' => 'Boulons M6']);

        $resp = $this->getJson('/api/produits?search=vis', $headers);
        $resp->assertStatus(200);
        $resp->assertJsonFragment(['nom_produit' => 'Vis M8']);
    }

    public function test_search_multi_word_prefix()
    {
        $this->artisan('migrate');
        $this->seed();

        $headers = ['Authorization' => 'Bearer '.$this->loginAsAgent()];

        $resp = $this->getJson('/api/produits?search=boul+m6', $headers);
        $resp->assertStatus(200);
        $resp->assertJsonFragment(['nom_produit' => 'Boulons M6']);

        $resp = $this->getJson('/api/produits?search=col+ser', $headers);
        $resp->assertStatus(200);
        $resp->assertJsonFragment(['nom_produit' => 'Colliers de serrage']);
    }

    public function test_search_barcode_fallback()
    {
        $this->artisan('migrate');
        $this->seed();

        $headers = ['Authorization' => 'Bearer '.$this->loginAsAgent()];

        $resp = $this->getJson('/api/produits?search=222', $headers);
        $resp->assertStatus(200);
        $resp->assertJsonFragment(['code_produit' => '222222']);

        $resp = $this->getJson('/api/produits?search=444444', $headers);
        $resp->assertStatus(200);
        $resp->assertJsonFragment(['code_produit' => '444444']);
    }

    public function test_search_empty_returns_all()
    {
        $this->artisan('migrate');
        $this->seed();

        $headers = ['Authorization' => 'Bearer '.$this->loginAsAgent()];

        $resp = $this->getJson('/api/produits', $headers);
        $resp->assertStatus(200);
        $this->assertCount(5, $resp->json());
    }

    public function test_admin_search_word_prefix()
    {
        $this->artisan('migrate');
        $this->seed();

        $headers = ['Authorization' => 'Bearer '.$this->loginAsAdmin()];

        $resp = $this->getJson('/api/admin/products?search=boul', $headers);
        $resp->assertStatus(200);
        $resp->assertJsonFragment(['name' => 'Boulons M6']);
    }

    public function test_admin_bulk_delete_by_search()
    {
        $this->artisan('migrate');
        $this->seed();

        $headers = ['Authorization' => 'Bearer '.$this->loginAsAdmin()];

        $resp = $this->deleteJson('/api/admin/products/bulk', [
            'all_matching' => true,
            'search' => 'vis',
        ], $headers);

        $resp->assertStatus(200);
        $this->assertEquals(1, $resp->json('deleted'));

        $remaining = $this->getJson('/api/admin/products', $headers);
        $this->assertEquals(4, $remaining->json('total'));
    }
}
