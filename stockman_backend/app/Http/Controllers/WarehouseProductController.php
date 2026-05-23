<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\WarehouseProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WarehouseProductController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'warehouse_id' => 'required|integer|exists:warehouses,id',
            'barcode' => 'required|string',
        ]);

        $product = Product::where('barcode', $request->barcode)->first();
        if (! $product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        $exists = DB::table('warehouse_products')
            ->where('warehouse_id', $request->warehouse_id)
            ->where('product_id', $product->id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Product already assigned to this warehouse'], 409);
        }

        $wp = WarehouseProduct::create([
            'warehouse_id' => $request->warehouse_id,
            'product_id' => $product->id,
            'assigned_by' => $request->user()->id ?? null,
            'assigned_at' => now(),
        ]);

        return response()->json(['message' => 'Assigned', 'data' => $wp], 201);
    }
}
