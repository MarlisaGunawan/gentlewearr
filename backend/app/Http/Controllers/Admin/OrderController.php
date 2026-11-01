<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    /**
     * GET /api/admin/orders?status=paid&search=GW-
     */
    public function index(Request $request)
    {
        $orders = Order::query()
            ->withCount('items')
            ->when($request->query('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->query('search'), fn ($q, $s) => $q->where(fn ($q) => $q
                ->where('code', 'like', "%{$s}%")->orWhere('customer_name', 'like', "%{$s}%")->orWhere('customer_email', 'like', "%{$s}%")))
            ->latest()
            ->paginate(20);

        return response()->json([
            'data' => $orders->getCollection()->map->only(['code', 'customer_name', 'customer_email', 'total', 'status', 'payment_mode', 'items_count', 'created_at']),
            'meta' => ['total' => $orders->total(), 'page' => $orders->currentPage(), 'last_page' => $orders->lastPage()],
        ]);
    }

    public function show(Order $order)
    {
        return new OrderResource($order->load('items', 'payments'));
    }

    /**
     * PUT /api/admin/orders/{code} — move a paid order along: packed → shipped → completed.
     */
    public function update(Request $request, Order $order)
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(Order::FULFILMENT_STATUSES)],
            'tracking_number' => ['nullable', 'string', 'max:60', Rule::requiredIf($request->input('status') === 'shipped')],
        ]);

        abort_unless($order->isPaid(), 422, 'Only paid orders can be packed or shipped.');

        $order->update($data);

        return new OrderResource($order->load('items', 'payments'));
    }
}
