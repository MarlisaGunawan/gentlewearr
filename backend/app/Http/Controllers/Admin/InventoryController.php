<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductVariant;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class InventoryController extends Controller
{
    /**
     * GET /api/admin/inventory?filter=low|out&search= — every variant with its stock,
     * plus the latest stock movements across the shop.
     */
    public function index(Request $request)
    {
        $variants = ProductVariant::with('product:id,sku,name,image', 'color:id,name,hex,image')
            ->when($request->query('filter') === 'low', fn ($q) => $q->whereColumn('stock', '<=', 'min_stock'))
            ->when($request->query('filter') === 'out', fn ($q) => $q->where('stock', 0))
            ->when($request->query('search'), fn ($q, $s) => $q->where(fn ($q) => $q
                ->where('sku', 'like', "%{$s}%")->orWhereHas('product', fn ($q) => $q->where('name', 'like', "%{$s}%"))))
            ->orderBy('product_id')->orderBy('id')
            ->get()
            ->map(fn ($v) => [
                'id' => $v->id,
                'sku' => $v->sku,
                'product_sku' => $v->product->sku,
                'name' => Str::before($v->product->name, ' — '),
                'color' => $v->color->name,
                'hex' => $v->color->hex,
                'image' => $v->color->image ?? $v->product->image,
                'size' => $v->size,
                'stock' => $v->stock,
                'min_stock' => $v->min_stock,
            ]);

        return response()->json([
            'data' => $variants,
            'summary' => [
                'units' => (int) ProductVariant::sum('stock'),
                'variants' => ProductVariant::count(),
                'low' => ProductVariant::whereColumn('stock', '<=', 'min_stock')->where('stock', '>', 0)->count(),
                'out' => ProductVariant::where('stock', 0)->count(),
            ],
            'movements' => StockMovement::with('variant:id,sku')
                ->latest()->limit(15)->get()
                ->map(fn ($m) => [
                    'sku' => $m->variant?->sku,
                    'change' => $m->change,
                    'stock_after' => $m->stock_after,
                    'reason' => $m->reason,
                    'note' => $m->note,
                    'created_at' => $m->created_at,
                ]),
        ]);
    }
}
