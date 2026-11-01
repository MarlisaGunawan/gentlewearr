<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;

/**
 * Turns a cart into an order. Prices, stock and shipping are worked out here on
 * the server — never trusted from the browser.
 */
class CheckoutService
{
    public function __construct(private MidtransService $midtrans) {}

    public function place(array $data): Order
    {
        $lines = $this->priceLines($data['items']);
        $subtotal = collect($lines)->sum(fn ($line) => $line['price'] * $line['qty']);
        $shippingCost = $this->shippingCost($data['shipping'], $subtotal);

        $order = DB::transaction(function () use ($data, $lines, $subtotal, $shippingCost) {
            $order = Order::create([
                'code' => 'GW-'.now()->format('ymd').'-'.Str::upper(Str::random(5)),
                'status' => 'waiting_payment',
                'customer_name' => $data['customer']['name'],
                'customer_email' => $data['customer']['email'],
                'customer_phone' => $data['customer']['phone'],
                'address' => $data['customer']['address'],
                'city' => $data['customer']['city'],
                'province' => $data['customer']['province'] ?? null,
                'postal_code' => $data['customer']['postal_code'],
                'shipping_method' => $data['shipping'],
                'shipping_cost' => $shippingCost,
                'subtotal' => $subtotal,
                'total' => $subtotal + $shippingCost,
                'payment_mode' => $this->midtrans->enabled() ? 'midtrans' : 'mock',
            ]);
            $order->items()->createMany($lines);

            return $order;
        });

        if ($this->midtrans->enabled()) {
            try {
                $order->update(['snap_token' => $this->midtrans->createSnapToken($order->load('items'))]);
            } catch (Throwable $e) {
                // Wrong/production key, Midtrans down… → keep the order as failed and say so clearly.
                Log::error('Midtrans Snap token failed', ['order' => $order->code, 'error' => $e->getMessage()]);
                $order->update(['status' => 'failed']);

                throw new HttpException(502, 'The payment gateway is not available right now. Please try again later.');
            }
        }

        return $order->load('items');
    }

    /**
     * Look up every cart line in the database, check stock and take the current price.
     */
    private function priceLines(array $items): array
    {
        $errors = [];
        $lines = [];

        foreach ($items as $i => $item) {
            $product = Product::with('colors.variants')->where('sku', $item['sku'])->where('is_active', true)->first();
            $color = $product?->colors->firstWhere('name', $item['color']);
            $variant = $color?->variants->firstWhere('size', $item['size']);

            if (! $variant) {
                $errors["items.$i"] = 'This item is no longer available.';

                continue;
            }
            if ($variant->stock < $item['qty']) {
                $errors["items.$i"] = "Only {$variant->stock} left of {$product->name} ({$color->name}, {$variant->size}).";

                continue;
            }

            $lines[] = [
                'product_variant_id' => $variant->id,
                'sku' => $variant->sku,
                // Base name only ("Everyday crew tee"); the colour is stored on its own.
                'name' => Str::before($product->name, ' — '),
                'color' => $color->name,
                'size' => $variant->size,
                'image' => $color->image ?? $product->image,
                'price' => $product->price,
                'qty' => $item['qty'],
            ];
        }

        if ($errors) {
            throw ValidationException::withMessages($errors);
        }

        return $lines;
    }

    public function shippingCost(string $method, int $subtotal): int
    {
        $option = config("services.shop.shipping.$method");
        $free = $option['free_over_min'] && $subtotal >= config('services.shop.free_shipping_min');

        return $free ? 0 : $option['cost'];
    }
}
