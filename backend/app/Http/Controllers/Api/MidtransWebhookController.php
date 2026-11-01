<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\MidtransService;
use App\Services\PaymentService;
use Illuminate\Http\Request;

class MidtransWebhookController extends Controller
{
    /**
     * POST /api/midtrans/notification — Midtrans tells us a payment changed.
     * Set this URL as "Payment Notification URL" in the Midtrans dashboard.
     */
    public function __invoke(Request $request, MidtransService $midtrans, PaymentService $payments)
    {
        $notification = $request->all();

        abort_unless($midtrans->hasValidSignature($notification), 403, 'Invalid signature.');

        $order = Order::with('items')->where('code', $notification['order_id'])->firstOrFail();
        $status = MidtransService::toOrderStatus($notification['transaction_status'], $notification['fraud_status'] ?? null);
        $payments->apply($order, $status, 'midtrans', $notification);

        return response()->json(['ok' => true]);
    }
}
