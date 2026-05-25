<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmplacementController;
use App\Http\Controllers\ProduitController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/emplacements', [EmplacementController::class, 'index']);
    Route::get('/warehouses/{warehouseId}/emplacements', [EmplacementController::class, 'byWarehouse']);
    Route::get('/produits', [ProduitController::class, 'index']);
    Route::get('/produits/code/{code}', [ProduitController::class, 'findByCode']);
    Route::patch('/produits/{id}/emplacement', [ProduitController::class, 'assignEmplacement']);
    Route::get('/stats', [AdminController::class, 'stats']);

    Route::prefix('admin')->group(function () {
        Route::get('/users', [AdminController::class, 'users']);
        Route::post('/users', [AdminController::class, 'storeUser']);
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::delete('/users/{id}', [AdminController::class, 'destroyUser']);

        Route::get('/products', [AdminController::class, 'products']);
        Route::post('/products', [AdminController::class, 'storeProduct']);
        Route::put('/products/{id}', [AdminController::class, 'updateProduct']);
        Route::delete('/products/{id}', [AdminController::class, 'destroyProduct']);

        Route::get('/emplacements', [AdminController::class, 'emplacements']);
        Route::post('/emplacements', [AdminController::class, 'storeEmplacement']);
        Route::put('/emplacements/{id}', [AdminController::class, 'updateEmplacement']);
        Route::delete('/emplacements/{id}', [AdminController::class, 'destroyEmplacement']);

        Route::get('/warehouses', [AdminController::class, 'warehouses']);
        Route::post('/warehouses', [AdminController::class, 'storeWarehouse']);
        Route::put('/warehouses/{id}', [AdminController::class, 'updateWarehouse']);
        Route::delete('/warehouses/{id}', [AdminController::class, 'destroyWarehouse']);

        Route::post('/products/import', [AdminController::class, 'importProducts']);
        Route::get('/products/export', [AdminController::class, 'exportProducts']);
        Route::post('/emplacements/import', [AdminController::class, 'importEmplacements']);
        Route::get('/emplacements/export', [AdminController::class, 'exportEmplacements']);
    });
});
