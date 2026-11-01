<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Endpoints called BY n8n (protected with the X-N8N-Token header).
 */
class N8nController extends Controller
{
    /**
     * GET /api/n8n/daily-summary?date=2026-11-01 — numbers for the nightly sales recap.
     */
    public function dailySummary(Request $request)
    {
        $day = Carbon::parse($request->query('date', today()->toDateString()));
        $paid = Order::whereNotNull('paid_at')->whereBetween('paid_at', [$day->copy()->startOfDay(), $day->copy()->endOfDay()]);

        $topProducts = OrderItem::query()
            ->whereIn('order_id', (clone $paid)->select('id'))
            ->selectRaw('name, SUM(qty) as qty, SUM(qty * price) as revenue')
            ->groupBy('name')
            ->orderByDesc('qty')
            ->limit(3)
            ->get();

        $revenue = (clone $paid)->sum('total');

        return response()->json([
            'date' => $day->toDateString(),
            'orders' => (clone $paid)->count(),
            'revenue' => (int) $revenue,
            'revenue_label' => 'Rp '.number_format($revenue, 0, ',', '.'),
            'items_sold' => (int) OrderItem::whereIn('order_id', (clone $paid)->select('id'))->sum('qty'),
            'waiting_payment' => Order::whereIn('status', ['waiting_payment', 'pending'])->count(),
            'top_products' => $topProducts,
            'low_stock' => ProductVariant::with('product:id,name', 'color:id,name')
                ->whereColumn('stock', '<=', 'min_stock')
                ->orderBy('stock')
                ->limit(10)
                ->get()
                ->map(fn ($v) => Str::before($v->product->name, ' — ')." · {$v->color->name} {$v->size}: {$v->stock} left"),
        ]);
    }
}
