<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CheckoutRequest;
use App\Http\Resources\OrderResource;
use App\Services\CheckoutService;
use App\Services\MidtransService;

class CheckoutController extends Controller
{
    /**
     * POST /api/checkout — create the order and (with Midtrans keys) a Snap token.
     */
    public function store(CheckoutRequest $request, CheckoutService $checkout, MidtransService $midtrans)
    {
        $order = $checkout->place($request->validated());

        return response()->json([
            'order' => new OrderResource($order),
            'payment' => [
                'mode' => $order->payment_mode,          // midtrans | mock
                'token' => $order->snap_token,           // open with window.snap.pay(token)
                'client_key' => $midtrans->clientKey(),  // public key for snap.js
            ],
        ], 201);
    }
}
