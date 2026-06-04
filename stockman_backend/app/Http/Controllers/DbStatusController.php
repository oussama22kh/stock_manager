<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DbStatusController extends Controller
{
    private const TABLES = [
        'users',
        'warehouses',
        'products',
        'emplacements',
        'warehouse_products',
        'stock_movements',
        'user_warehouse',
        'personal_access_tokens',
        'sessions',
    ];

    public function index(): JsonResponse
    {
        $counts = [];

        foreach (self::TABLES as $table) {
            $counts[$table] = Schema::hasTable($table)
                ? DB::table($table)->count()
                : 0;
        }

        return response()->json($counts);
    }
}
