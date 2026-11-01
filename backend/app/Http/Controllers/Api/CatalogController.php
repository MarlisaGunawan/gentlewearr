<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Category;
use App\Models\Product;
use App\Models\Setting;

class CatalogController extends Controller
{
    /**
     * GET /api/products — every active product with colours and stock per variant.
     */
    public function index()
    {
        $products = Product::with(['category', 'colors.variants'])
            ->where('is_active', true)
            ->orderBy('sort')
            ->get();

        return response()->json([
            'categories' => Category::orderBy('sort')->get(['slug', 'name', 'title', 'description']),
            'products' => ProductResource::collection($products),
        ]);
    }

    /**
     * GET /api/content — CMS content for the landing page.
     */
    public function content()
    {
        return response()->json(Setting::allAsArray());
    }
}
