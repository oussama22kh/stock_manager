<?php

namespace App\Http\Controllers;

use App\Models\Warehouse;

class EmplacementController extends Controller
{
    public function index()
    {
        return response()->json(Warehouse::all());
    }
}
