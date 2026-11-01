<?php

namespace App\Services;

use App\Models\Order;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * The one place where a payment result changes an order.
 * Paying moves stock out of inventory (once), records the payment and tells n8n.
 */
class PaymentService
{
    public function __construct(private N8nNotifier $n8n) {}

    public function apply(Order $order, string $status, string $provider, array $payload = []): Order
    {
        $order->payments()->create([
            'provider' => $provider,
            'transaction_id' => $payload['transaction_id'] ?? null,
            'payment_type' => $payload['payment_type'] ?? null,
            'status' => $status,
            'amount' => $order->total,
            'payload' => $payload ?: null,
        ]);

        // A paid order never goes back to failed/expired.
        if ($order->isPaid()) {
            return $order;
        }

        if ($status !== 'paid') {
            $order->update(['status' => $status]);

            return $order;
        }

        $lowStock = DB::transaction(function () use ($order) {
            $order->update(['status' => 'paid', 'paid_at' => now()]);
            $low = [];

            foreach ($order->items as $item) {
                $variant = ProductVariant::lockForUpdate()->find($item->product_variant_id);
                if (! $variant) {
                    continue;
                }
                $variant->adjustStock(-$item->qty, 'sale', $order->id, 'Order '.$order->code);
                if ($variant->isLow()) {
                    $low[] = $variant;
                }
            }

            return $low;
        });

        $this->notifyPaid($order);
        foreach ($lowStock as $variant) {
            $this->notifyLowStock($variant);
        }

        return $order;
    }

    private function notifyPaid(Order $order): void
    {
        $this->n8n->send('order-paid', [
            'order_code' => $order->code,
            'customer_name' => $order->customer_name,
            'customer_email' => $order->customer_email,
            'customer_phone' => $order->customer_phone,
            'total' => $order->total,
            'total_label' => 'Rp '.number_format($order->total, 0, ',', '.'),
            'items' => $order->items->map(fn ($i) => $i->qty.'× '.$i->name.' ('.$i->color.', '.$i->size.')')->all(),
            'ship_to' => $order->address.', '.$order->city.' '.$order->postal_code,
        ]);
    }

    private function notifyLowStock(ProductVariant $variant): void
    {
        $variant->loadMissing('product', 'color');

        $this->n8n->send('stock-low', [
            'sku' => $variant->sku,
            'product' => Str::before($variant->product->name, ' — '),
            'color' => $variant->color->name,
            'size' => $variant->size,
            'stock' => $variant->stock,
            'min_stock' => $variant->min_stock,
        ]);
    }
}
