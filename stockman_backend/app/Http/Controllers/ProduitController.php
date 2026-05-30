<?php

namespace App\Http\Controllers;

use App\Models\Emplacement;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\WarehouseProduct;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProduitController extends Controller
{
    public function index(Request $request): JsonResponse
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
                'description' => $product->description,
                'emplacement_id' => $first?->id,
                'emplacement_nom' => $first?->name,
                'warehouse_id' => $first?->warehouse?->id,
                'warehouse_nom' => $first?->warehouse?->name,
            ];
        });

        return response()->json($produits);
    }

    public function findByCode($code): JsonResponse
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
            'description' => $product->description,
            'emplacement_id' => $first?->id,
            'emplacement_nom' => $first?->name,
            'warehouse_id' => $first?->warehouse?->id,
            'warehouse_nom' => $first?->warehouse?->name,
        ]);
    }

    public function assignEmplacement(Request $request, $id): JsonResponse
    {
        $request->validate([
            'emplacement_id' => 'required|integer|exists:emplacements,id',
        ]);

        $product = Product::findOrFail($id);
        $targetEmplacement = Emplacement::with('warehouse')->findOrFail($request->emplacement_id);

        $existing = WarehouseProduct::where('product_id', $product->id)->first();
        $previousEmplacement = null;

        if ($existing && $existing->emplacement_id === $targetEmplacement->id) {
            $existing->load('emplacement.warehouse');

            return response()->json([
                'id' => $product->id,
                'nom_produit' => $product->name,
                'code_produit' => $product->barcode,
                'description' => $product->description,
                'emplacement_id' => $existing->emplacement_id,
                'emplacement_nom' => $existing->emplacement->name,
                'warehouse_id' => $existing->emplacement->warehouse?->id,
                'warehouse_nom' => $existing->emplacement->warehouse?->name,
                'already_assigned' => true,
            ]);
        }

        if ($existing) {
            $previousEmplacement = Emplacement::with('warehouse')->find($existing->emplacement_id);
            $existing->delete();
        }

        WarehouseProduct::create([
            'product_id' => $product->id,
            'emplacement_id' => $targetEmplacement->id,
            'assigned_by' => $request->user()->id,
            'assigned_at' => now(),
        ]);

        StockMovement::create([
            'product_id' => $product->id,
            'from_emplacement_id' => $previousEmplacement?->id,
            'to_emplacement_id' => $targetEmplacement->id,
            'moved_by' => $request->user()->id,
            'moved_at' => now(),
        ]);

        $response = [
            'id' => $product->id,
            'nom_produit' => $product->name,
            'code_produit' => $product->barcode,
            'description' => $product->description,
            'emplacement_id' => $targetEmplacement->id,
            'emplacement_nom' => $targetEmplacement->name,
            'warehouse_id' => $targetEmplacement->warehouse->id,
            'warehouse_nom' => $targetEmplacement->warehouse->name,
            'assigned_by_name' => $request->user()->name,
            'assigned_at' => now()->toIso8601String(),
        ];

        if ($previousEmplacement) {
            $response['was_moved'] = true;
            $response['previous_emplacement_nom'] = $previousEmplacement->name;
            $response['previous_warehouse_nom'] = $previousEmplacement->warehouse?->name;
        }

        return response()->json($response);
    }

    public function productsByEmplacement($emplacementId): JsonResponse
    {
        $warehouseProducts = WarehouseProduct::with([
            'product',
            'product.emplacements.warehouse',
            'assignedBy',
        ])
            ->where('emplacement_id', $emplacementId)
            ->get();

        $result = $warehouseProducts->map(function ($wp) {
            $product = $wp->product;

            return [
                'id' => $product->id,
                'nom_produit' => $product->name,
                'code_produit' => $product->barcode,
                'description' => $product->description,
                'emplacement_id' => $wp->emplacement_id,
                'assigned_by_name' => $wp->assignedBy?->name,
                'assigned_at' => $wp->assigned_at?->toIso8601String(),
            ];
        });

        return response()->json($result);
    }

    public function movements($id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $movements = $product->movements()
            ->with(['fromEmplacement.warehouse', 'toEmplacement.warehouse', 'movedByUser'])
            ->get()
            ->map(function ($m) {
                return [
                    'id' => $m->id,
                    'from_emplacement' => $m->fromEmplacement ? [
                        'id' => $m->fromEmplacement->id,
                        'name' => $m->fromEmplacement->name,
                        'warehouse' => $m->fromEmplacement->warehouse?->name,
                    ] : null,
                    'to_emplacement' => [
                        'id' => $m->toEmplacement->id,
                        'name' => $m->toEmplacement->name,
                        'warehouse' => $m->toEmplacement->warehouse?->name,
                    ],
                    'moved_by' => $m->movedByUser?->name,
                    'moved_at' => $m->moved_at->toIso8601String(),
                ];
            });

        return response()->json($movements);
    }
}
