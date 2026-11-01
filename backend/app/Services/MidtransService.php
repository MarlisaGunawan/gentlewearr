<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Midtrans Snap (sandbox by default).
 * Docs: https://docs.midtrans.com/reference/snap-api
 */
class MidtransService
{
    public function enabled(): bool
    {
        return filled(config('services.midtrans.server_key'));
    }

    /**
     * Public key for snap.js in the browser. Refuses anything that is not a client
     * key, so a server key pasted in the wrong .env line is never sent to visitors.
     */
    public function clientKey(): ?string
    {
        $key = trim((string) config('services.midtrans.client_key'));

        if (! preg_match('/^(SB-)?Mid-client-/', $key)) {
            Log::warning('MIDTRANS_CLIENT_KEY is missing or is not a client key (it must start with SB-Mid-client-).');

            return null;
        }

        return $key;
    }

    /**
     * Ask Midtrans for a Snap token for this order (the frontend opens the popup with it).
     */
    public function createSnapToken(Order $order): string
    {
        $items = $order->items->map(fn ($item) => [
            'id' => $item->sku,
            'name' => mb_substr($item->name.' '.$item->color.' '.$item->size, 0, 50), // Midtrans limit
            'price' => $item->price,
            'quantity' => $item->qty,
        ])->all();

        if ($order->shipping_cost > 0) {
            $items[] = ['id' => 'shipping', 'name' => 'Shipping', 'price' => $order->shipping_cost, 'quantity' => 1];
        }

        return $this->client()
            ->post($this->snapBase().'/snap/v1/transactions', [
                'transaction_details' => ['order_id' => $order->code, 'gross_amount' => $order->total],
                'item_details' => $items, // must add up exactly to gross_amount
                'customer_details' => [
                    'first_name' => $order->customer_name,
                    'email' => $order->customer_email,
                    'phone' => $order->customer_phone,
                    'shipping_address' => [
                        'first_name' => $order->customer_name,
                        'phone' => $order->customer_phone,
                        'address' => $order->address,
                        'city' => $order->city,
                        'postal_code' => $order->postal_code,
                        'country_code' => 'IDN',
                    ],
                ],
            ])
            ->throw()
            ->json('token');
    }

    /**
     * Current transaction status straight from Midtrans. Used when the webhook
     * cannot reach us (e.g. running on localhost), so the order still updates.
     */
    public function status(string $orderCode): ?array
    {
        $response = $this->client()->get($this->apiBase().'/v2/'.$orderCode.'/status');

        return $response->successful() ? $response->json() : null;
    }

    /**
     * Webhook check: signature = sha512(order_id + status_code + gross_amount + server_key).
     */
    public function hasValidSignature(array $notification): bool
    {
        $expected = hash('sha512',
            ($notification['order_id'] ?? '').($notification['status_code'] ?? '').
            ($notification['gross_amount'] ?? '').config('services.midtrans.server_key'));

        return hash_equals($expected, $notification['signature_key'] ?? '');
    }

    /**
     * Midtrans transaction_status → our order status.
     */
    public static function toOrderStatus(string $transactionStatus, ?string $fraudStatus = null): string
    {
        return match ($transactionStatus) {
            'capture' => $fraudStatus === 'challenge' ? 'pending' : 'paid',
            'settlement' => 'paid',
            'pending' => 'pending',
            'cancel' => 'cancelled',
            'expire' => 'expired',
            default => 'failed', // deny, failure
        };
    }

    private function client()
    {
        return Http::withBasicAuth(config('services.midtrans.server_key'), '')->acceptJson()->timeout(15);
    }

    private function snapBase(): string
    {
        return config('services.midtrans.is_production') ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com';
    }

    private function apiBase(): string
    {
        return config('services.midtrans.is_production') ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';
    }
}
