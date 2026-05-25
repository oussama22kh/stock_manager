<?php

namespace App\Http\Controllers;

use App\Models\Emplacement;
use App\Models\Warehouse;

class EmplacementController extends Controller
{
    public function index()
    {
        $warehouses = Warehouse::with(['emplacements' => function ($q) {
            $q->withCount('products');
        }])->get();

        return response()->json($warehouses);
    }

    public function byWarehouse($warehouseId)
    {
        $emplacements = Emplacement::where('warehouse_id', $warehouseId)
            ->withCount('products')
            ->get();

        return response()->json($emplacements);
    }
}
