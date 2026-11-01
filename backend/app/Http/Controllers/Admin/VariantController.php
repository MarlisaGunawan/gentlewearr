<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductVariant;
use Illuminate\Http\Request;

class VariantController extends Controller
{
    /**
     * PUT /api/admin/variants/{id} — set stock (after a count or a delivery) and the low-stock level.
     * The difference is logged as a stock movement.
     */
    public function update(Request $request, ProductVariant $variant)
    {
        $data = $request->validate([
            'stock' => ['required', 'integer', 'min:0', 'max:100000'],
            'min_stock' => ['required', 'integer', 'min:0', 'max:1000'],
            'reason' => ['nullable', 'in:adjustment,restock'],
            'note' => ['nullable', 'string', 'max:120'],
        ]);

        $variant->min_stock = $data['min_stock'];
        $change = $data['stock'] - $variant->stock;

        if ($change !== 0) {
            $variant->adjustStock($change, $data['reason'] ?? ($change > 0 ? 'restock' : 'adjustment'), note: $data['note'] ?? null);
        } else {
            $variant->save();
        }

        return response()->json($variant->only(['id', 'size', 'sku', 'stock', 'min_stock']));
    }

    /**
     * GET /api/admin/variants/{id}/movements — stock history.
     */
    public function movements(ProductVariant $variant)
    {
        return response()->json($variant->movements()->limit(50)->get(['change', 'stock_after', 'reason', 'note', 'order_id', 'created_at']));
    }
}
