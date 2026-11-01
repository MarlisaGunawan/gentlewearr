<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\Api;
use App\Http\Middleware\VerifyN8nToken;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public shop API (used by the React storefront)
|--------------------------------------------------------------------------
*/
Route::get('/products', [Api\CatalogController::class, 'index']);
Route::get('/content', [Api\CatalogController::class, 'content']);

Route::get('/regions/provinces', [Api\RegionController::class, 'provinces']);
Route::get('/regions/provinces/{province}/cities', [Api\RegionController::class, 'cities']);

Route::post('/checkout', [Api\CheckoutController::class, 'store'])->middleware('throttle:20,1');
Route::get('/orders/{order:code}', [Api\OrderController::class, 'show']);
Route::post('/orders/{order:code}/mock-pay', [Api\OrderController::class, 'mockPay'])->middleware('throttle:20,1');

// Payment gateway webhook (Midtrans → us).
Route::post('/midtrans/notification', Api\MidtransWebhookController::class);

// Called by n8n workflows.
Route::middleware(VerifyN8nToken::class)->prefix('n8n')->group(function () {
    Route::get('/daily-summary', [Api\N8nController::class, 'dailySummary']);
});

/*
|--------------------------------------------------------------------------
| Admin / backoffice API (CMS + ERP), bearer token from /admin/login
|--------------------------------------------------------------------------
*/
Route::prefix('admin')->group(function () {
    Route::post('/login', [Admin\AuthController::class, 'login'])->middleware('throttle:10,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [Admin\AuthController::class, 'me']);
        Route::put('/me/password', [Admin\AuthController::class, 'password']);
        Route::post('/logout', [Admin\AuthController::class, 'logout']);

        Route::get('/dashboard', Admin\DashboardController::class);

        Route::apiResource('products', Admin\ProductController::class)->scoped(['product' => 'sku']);
        Route::put('/variants/{variant}', [Admin\VariantController::class, 'update']);
        Route::get('/variants/{variant}/movements', [Admin\VariantController::class, 'movements']);

        Route::get('/inventory', [Admin\InventoryController::class, 'index']);
        Route::get('/payments', [Admin\SalesController::class, 'payments']);
        Route::get('/customers', [Admin\SalesController::class, 'customers']);

        Route::get('/orders', [Admin\OrderController::class, 'index']);
        Route::get('/orders/{order:code}', [Admin\OrderController::class, 'show']);
        Route::put('/orders/{order:code}', [Admin\OrderController::class, 'update']);

        Route::get('/content', [Admin\ContentController::class, 'show']);
        Route::put('/content', [Admin\ContentController::class, 'update']);
        Route::post('/media', [Admin\MediaController::class, 'store']);
    });
});
