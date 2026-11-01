<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class DashboardController extends Controller
{
    /** Range → number of buckets, bucket size and label format. */
    private const RANGES = [
        '7d' => ['count' => 7, 'unit' => 'day'],
        '30d' => ['count' => 30, 'unit' => 'day'],
        '90d' => ['count' => 13, 'unit' => 'week'],
        '12m' => ['count' => 12, 'unit' => 'month'],
    ];

    /**
     * GET /api/admin/dashboard?range=30d — KPIs vs the previous period, revenue
     * series (this period + previous), revenue by category, stock alerts and recent orders.
     */
    public function __invoke(Request $request)
    {
        $range = array_key_exists($request->query('range'), self::RANGES) ? $request->query('range') : '30d';
        ['count' => $count, 'unit' => $unit] = self::RANGES[$range];

        $end = now()->endOfDay();
        $start = $this->shift(now()->startOfDay(), $unit, -($count - 1));
        if ($unit === 'week') {
            $start = $start->startOfWeek();
        } elseif ($unit === 'month') {
            $start = $start->startOfMonth();
        }
        $prevStart = $this->shift($start->copy(), $unit, -$count);

        // Paid orders of both periods, bucketed in PHP (works the same on SQLite and MySQL).
        $paid = Order::whereNotNull('paid_at')->whereBetween('paid_at', [$prevStart, $end])->get(['id', 'total', 'paid_at']);

        $points = [];
        for ($i = 0; $i < $count; $i++) {
            $from = $this->shift($start->copy(), $unit, $i);
            $to = $this->shift($from->copy(), $unit, 1);
            $prevFrom = $this->shift($from->copy(), $unit, -$count);
            $prevTo = $this->shift($prevFrom->copy(), $unit, 1);
            $points[] = [
                'label' => $unit === 'month' ? $from->format('M Y') : ($unit === 'week' ? 'Week of '.$from->format('M j') : $from->format('M j, Y')),
                'tick' => $unit === 'month' ? $from->format('M') : $from->format('M j'),
                'current' => (int) $paid->filter(fn ($o) => $o->paid_at >= $from && $o->paid_at < $to)->sum('total'),
                'previous' => (int) $paid->filter(fn ($o) => $o->paid_at >= $prevFrom && $o->paid_at < $prevTo)->sum('total'),
            ];
        }

        $current = $paid->filter(fn ($o) => $o->paid_at >= $start);
        $previous = $paid->filter(fn ($o) => $o->paid_at < $start);
        $itemsNow = $this->itemsSold($current->pluck('id'));
        $itemsPrev = $this->itemsSold($previous->pluck('id'));
        $avg = fn ($orders) => $orders->count() ? (int) round($orders->sum('total') / $orders->count()) : 0;

        $kpis = [
            ['id' => 'revenue', 'label' => 'Net revenue', 'format' => 'currency', 'value' => (int) $current->sum('total'), 'previous' => (int) $previous->sum('total'), 'spark' => array_column($points, 'current')],
            ['id' => 'orders', 'label' => 'Paid orders', 'format' => 'number', 'value' => $current->count(), 'previous' => $previous->count(), 'spark' => $this->countSpark($current, $start, $unit, $count)],
            ['id' => 'aov', 'label' => 'Avg. order value', 'format' => 'currency', 'value' => $avg($current), 'previous' => $avg($previous), 'spark' => array_column($points, 'current')],
            ['id' => 'items', 'label' => 'Items sold', 'format' => 'number', 'value' => $itemsNow, 'previous' => $itemsPrev, 'spark' => array_column($points, 'current')],
        ];

        return response()->json([
            'range' => $range,
            'points' => $points,
            'kpis' => $kpis,
            'categories' => OrderItem::query()
                ->join('product_variants', 'product_variants.id', '=', 'order_items.product_variant_id')
                ->join('products', 'products.id', '=', 'product_variants.product_id')
                ->join('categories', 'categories.id', '=', 'products.category_id')
                ->whereIn('order_items.order_id', $current->pluck('id'))
                ->groupBy('categories.name')
                ->selectRaw('categories.name as label, SUM(order_items.qty * order_items.price) as value')
                ->orderByDesc('value')
                ->get()
                ->map(fn ($r) => ['label' => $r->label, 'value' => (int) $r->value]),
            'waiting_payment' => Order::whereIn('status', ['waiting_payment', 'pending'])->count(),
            'to_ship' => Order::whereIn('status', ['paid', 'packed'])->count(),
            'stock_units' => (int) ProductVariant::sum('stock'),
            'low_stock' => ProductVariant::with('product:id,name,sku', 'color:id,name')
                ->whereColumn('stock', '<=', 'min_stock')
                ->orderBy('stock')->limit(8)->get()
                ->map(fn ($v) => [
                    'id' => $v->id,
                    'product_sku' => $v->product->sku,
                    'name' => Str::before($v->product->name, ' — '),
                    'variant' => $v->color->name.' · '.$v->size,
                    'stock' => $v->stock,
                ]),
            'recent_orders' => Order::latest()->limit(50)->get(['code', 'customer_name', 'customer_email', 'total', 'status', 'payment_mode', 'created_at']),
        ]);
    }

    private function shift(Carbon $date, string $unit, int $amount): Carbon
    {
        return match ($unit) {
            'week' => $date->addWeeks($amount),
            'month' => $date->addMonthsNoOverflow($amount),
            default => $date->addDays($amount),
        };
    }

    private function itemsSold($orderIds): int
    {
        return (int) OrderItem::whereIn('order_id', $orderIds)->sum('qty');
    }

    private function countSpark($orders, Carbon $start, string $unit, int $count): array
    {
        $spark = [];
        for ($i = 0; $i < $count; $i++) {
            $from = $this->shift($start->copy(), $unit, $i);
            $to = $this->shift($from->copy(), $unit, 1);
            $spark[] = $orders->filter(fn ($o) => $o->paid_at >= $from && $o->paid_at < $to)->count();
        }

        return $spark;
    }
}
