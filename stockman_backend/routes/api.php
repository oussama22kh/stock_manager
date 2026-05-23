<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmplacementController;
use App\Http\Controllers\ProduitController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/emplacements', [EmplacementController::class, 'index']);
    Route::get('/produits', [ProduitController::class, 'index']);
    Route::get('/produits/code/{code}', [ProduitController::class, 'findByCode']);
    Route::patch('/produits/{id}/emplacement', [ProduitController::class, 'assignEmplacement']);
});
