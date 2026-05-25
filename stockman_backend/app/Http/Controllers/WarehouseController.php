<?php

namespace App\Http\Controllers;

use App\Models\Warehouse;

class WarehouseController extends Controller
{
    public function index()
    {
        return response()->json(
            Warehouse::withCount('products')->get()
        );
    }

    public function products($id)
    {
        $warehouse = Warehouse::with('products')->find($id);
        if (! $warehouse) {
            return response()->json(['message' => 'Warehouse not found'], 404);
        }

        return response()->json($warehouse->products);
    }
}
