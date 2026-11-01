<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\MidtransService;
use App\Services\PaymentService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    /**
     * GET /api/orders/{code} — order status for the customer's order page.
     * With ?sync=1 we also ask Midtrans directly (useful on localhost, where the
     * Midtrans webhook cannot reach us).
     */
    public function show(Request $request, Order $order, MidtransService $midtrans, PaymentService $payments)
    {
        if ($request->boolean('sync') && $order->payment_mode === 'midtrans' && ! $order->isPaid()) {
            $status = $midtrans->status($order->code);
            if ($status && isset($status['transaction_status'])) {
                $payments->apply($order, MidtransService::toOrderStatus($status['transaction_status'], $status['fraud_status'] ?? null), 'midtrans', $status);
            }
        }

        return new OrderResource($order->load('items'));
    }

    /**
     * POST /api/orders/{code}/mock-pay — sandbox stand-in for Midtrans when no keys
     * are configured. Lets the demo simulate paid / pending / failed / cancelled.
     */
    public function mockPay(Request $request, Order $order, PaymentService $payments)
    {
        abort_unless($order->payment_mode === 'mock', 403, 'This order is paid through Midtrans.');

        $data = $request->validate(['status' => ['required', 'in:paid,pending,failed,cancelled']]);
        $payments->apply($order->load('items'), $data['status'], 'mock', ['payment_type' => 'mock']);

        return new OrderResource($order->fresh('items'));
    }
}
