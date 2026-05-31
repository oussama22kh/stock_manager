<?php

namespace App\Http\Controllers;

use App\Models\Emplacement;
use App\Models\Warehouse;

class EmplacementController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        if ($user->role === 'agent') {
            $warehouses = $user->warehouses()->with(['emplacements' => function ($q) {
                $q->withCount('products');
            }])->get();
        } else {
            $warehouses = Warehouse::with(['emplacements' => function ($q) {
                $q->withCount('products');
            }])->get();
        }

        return response()->json($warehouses);
    }

    public function byWarehouse($warehouseId)
    {
        $user = auth()->user();

        if ($user->role === 'agent') {
            $hasAccess = $user->warehouses()->where('warehouse_id', $warehouseId)->exists();
            if (! $hasAccess) {
                return response()->json(['message' => 'Accès non autorisé'], 403);
            }
        }

        $emplacements = Emplacement::where('warehouse_id', $warehouseId)
            ->withCount('products')
            ->get();

        return response()->json($emplacements);
    }
}
