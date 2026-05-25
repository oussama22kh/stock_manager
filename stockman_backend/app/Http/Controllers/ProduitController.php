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

        $produits = $query->with('emplacements', 'emplacements.warehouse')->get()->map(function ($product) {
            $first = $product->emplacements->first();

            return [
                'id' => $product->id,
                'nom_produit' => $product->name,
                'code_produit' => $product->barcode,
                'emplacement_id' => $first?->id,
                'emplacement_nom' => $first?->name,
                'warehouse_id' => $first?->warehouse?->id,
                'warehouse_nom' => $first?->warehouse?->name,
            ];
        });

        return response()->json($produits);
    }

    public function findByCode($code)
    {
        $product = Product::with('emplacements', 'emplacements.warehouse')->where('barcode', $code)->first();

        if (! $product) {
            return response()->json(['message' => 'Produit non trouvé'], 404);
        }

        $first = $product->emplacements->first();

        return response()->json([
            'id' => $product->id,
            'nom_produit' => $product->name,
            'code_produit' => $product->barcode,
            'emplacement_id' => $first?->id,
            'emplacement_nom' => $first?->name,
            'warehouse_id' => $first?->warehouse?->id,
            'warehouse_nom' => $first?->warehouse?->name,
        ]);
    }

    public function assignEmplacement(Request $request, $id)
    {
        $request->validate([
            'emplacement_id' => 'required|integer|exists:emplacements,id',
        ]);

        $product = Product::findOrFail($id);

        WarehouseProduct::updateOrCreate(
            ['product_id' => $product->id],
            [
                'emplacement_id' => $request->emplacement_id,
                'assigned_by' => $request->user()->id,
                'assigned_at' => now(),
            ]
        );

        $product->load('emplacements', 'emplacements.warehouse');
        $first = $product->emplacements->first();

        return response()->json([
            'id' => $product->id,
            'nom_produit' => $product->name,
            'code_produit' => $product->barcode,
            'emplacement_id' => $first?->id,
            'emplacement_nom' => $first?->name,
            'warehouse_id' => $first?->warehouse?->id,
            'warehouse_nom' => $first?->warehouse?->name,
        ]);
    }
}
