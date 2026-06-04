<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DbStatusController;
use App\Http\Controllers\EmplacementController;
use App\Http\Controllers\ProduitController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
Route::get('/db-status', [DbStatusController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/emplacements', [EmplacementController::class, 'index']);
    Route::get('/warehouses/{warehouseId}/emplacements', [EmplacementController::class, 'byWarehouse']);
    Route::get('/produits', [ProduitController::class, 'index']);
    Route::get('/produits/code/{code}', [ProduitController::class, 'findByCode']);
    Route::patch('/produits/{id}/emplacement', [ProduitController::class, 'assignEmplacement']);
    Route::get('/produits/{id}/movements', [ProduitController::class, 'movements']);
    Route::get('/emplacements/{id}/products', [ProduitController::class, 'productsByEmplacement']);
    Route::get('/stats', [AdminController::class, 'stats']);

    Route::prefix('admin')->group(function () {
        Route::get('/users', [AdminController::class, 'users']);
        Route::post('/users', [AdminController::class, 'storeUser']);
        Route::delete('/users/bulk', [AdminController::class, 'destroyUsersBulk']);
        Route::patch('/users/bulk', [AdminController::class, 'bulkUpdateUsers']);
        Route::post('/users/import', [AdminController::class, 'importUsers']);
        Route::get('/users/export', [AdminController::class, 'exportUsers']);
        Route::get('/users/{id}/warehouses', [AdminController::class, 'getUserWarehouses']);
        Route::put('/users/{id}/warehouses', [AdminController::class, 'setUserWarehouses']);
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::delete('/users/{id}', [AdminController::class, 'destroyUser']);

        Route::get('/products', [AdminController::class, 'products']);
        Route::post('/products', [AdminController::class, 'storeProduct']);
        Route::delete('/products/bulk', [AdminController::class, 'destroyProductsBulk']);
        Route::patch('/products/bulk', [AdminController::class, 'bulkUpdateProducts']);
        Route::post('/products/import', [AdminController::class, 'importProducts']);
        Route::get('/products/export', [AdminController::class, 'exportProducts']);
        Route::put('/products/{id}', [AdminController::class, 'updateProduct']);
        Route::delete('/products/{id}', [AdminController::class, 'destroyProduct']);

        Route::get('/warehouses', [AdminController::class, 'warehouses']);
        Route::post('/warehouses', [AdminController::class, 'storeWarehouse']);
        Route::delete('/warehouses/bulk', [AdminController::class, 'destroyWarehousesBulk']);
        Route::patch('/warehouses/bulk', [AdminController::class, 'bulkUpdateWarehouses']);
        Route::post('/warehouses/import', [AdminController::class, 'importWarehouses']);
        Route::get('/warehouses/export', [AdminController::class, 'exportWarehouses']);
        Route::put('/warehouses/{id}', [AdminController::class, 'updateWarehouse']);
        Route::delete('/warehouses/{id}', [AdminController::class, 'destroyWarehouse']);

        Route::get('/emplacements', [AdminController::class, 'emplacements']);
        Route::post('/emplacements', [AdminController::class, 'storeEmplacement']);
        Route::delete('/emplacements/bulk', [AdminController::class, 'destroyEmplacementsBulk']);
        Route::patch('/emplacements/bulk', [AdminController::class, 'bulkUpdateEmplacements']);
        Route::post('/emplacements/import', [AdminController::class, 'importEmplacements']);
        Route::get('/emplacements/export', [AdminController::class, 'exportEmplacements']);
        Route::put('/emplacements/{id}', [AdminController::class, 'updateEmplacement']);
        Route::delete('/emplacements/{id}', [AdminController::class, 'destroyEmplacement']);
    });
});
