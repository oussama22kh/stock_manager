<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\WarehouseProduct;
use Illuminate\Http\Request;

class ProduitController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query();

        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        $produits = $query->with('warehouses')->get()->map(function ($product) {
            return [
                'id' => $product->id,
                'nom_produit' => $product->name,
                'code_produit' => $product->barcode,
                'emplacement_id' => $product->warehouses->first()?->id,
                'emplacement_nom' => $product->warehouses->first()?->name,
            ];
        });

        return response()->json($produits);
    }

    public function findByCode($code)
    {
        $product = Product::with('warehouses')->where('barcode', $code)->first();

        if (! $product) {
            return response()->json(['message' => 'Produit non trouvé'], 404);
        }

        return response()->json([
            'id' => $product->id,
            'nom_produit' => $product->name,
            'code_produit' => $product->barcode,
            'emplacement_id' => $product->warehouses->first()?->id,
            'emplacement_nom' => $product->warehouses->first()?->name,
        ]);
    }

    public function assignEmplacement(Request $request, $id)
    {
        $request->validate([
            'emplacement_id' => 'required|integer|exists:warehouses,id',
        ]);

        $product = Product::findOrFail($id);

        WarehouseProduct::updateOrCreate(
            ['product_id' => $product->id],
            [
                'warehouse_id' => $request->emplacement_id,
                'assigned_by' => $request->user()->id,
                'assigned_at' => now(),
            ]
        );

        $product->load('warehouses');

        return response()->json([
            'id' => $product->id,
            'nom_produit' => $product->name,
            'code_produit' => $product->barcode,
            'emplacement_id' => $product->warehouses->first()?->id,
            'emplacement_nom' => $product->warehouses->first()?->name,
        ]);
    }
}
