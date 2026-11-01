<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Sales screens that read across orders: payment history and customers.
 */
class SalesController extends Controller
{
    /**
     * GET /api/admin/payments?status=paid — every payment attempt (Midtrans or mock).
     */
    public function payments(Request $request)
    {
        $payments = Payment::query()
            ->join('orders', 'orders.id', '=', 'payments.order_id')
            ->when($request->query('status'), fn ($q, $s) => $q->where('payments.status', $s))
            ->when($request->query('search'), fn ($q, $s) => $q->where(fn ($q) => $q
                ->where('orders.code', 'like', "%{$s}%")->orWhere('orders.customer_name', 'like', "%{$s}%")))
            ->orderByDesc('payments.created_at')
            ->select('payments.provider', 'payments.payment_type', 'payments.status', 'payments.amount', 'payments.transaction_id', 'payments.created_at', 'orders.code', 'orders.customer_name')
            ->paginate(20);

        return response()->json([
            'data' => $payments->items(),
            'meta' => ['total' => $payments->total(), 'page' => $payments->currentPage(), 'last_page' => $payments->lastPage()],
            'totals' => [
                'paid' => (int) Payment::where('status', 'paid')->sum('amount'),
                'count' => Payment::count(),
            ],
        ]);
    }

    /**
     * GET /api/admin/customers — customers grouped by email, with spend from paid orders.
     */
    public function customers(Request $request)
    {
        $customers = Order::query()
            ->when($request->query('search'), fn ($q, $s) => $q->where(fn ($q) => $q
                ->where('customer_name', 'like', "%{$s}%")->orWhere('customer_email', 'like', "%{$s}%")))
            ->groupBy('customer_email')
            ->selectRaw('customer_email as email, MAX(customer_name) as name, MAX(customer_phone) as phone, MAX(city) as city')
            ->selectRaw('COUNT(*) as orders')
            ->selectRaw('SUM(CASE WHEN paid_at IS NOT NULL THEN total ELSE 0 END) as spent')
            ->selectRaw('MAX(created_at) as last_order_at')
            ->orderByDesc(DB::raw('spent'))
            ->limit(200)
            ->get()
            ->map(fn ($c) => [...$c->toArray(), 'orders' => (int) $c->orders, 'spent' => (int) $c->spent]);

        return response()->json(['data' => $customers]);
    }
}
