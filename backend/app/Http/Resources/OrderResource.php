<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'code' => $this->code,
            'status' => $this->status,
            'customer' => [
                'name' => $this->customer_name,
                'email' => $this->customer_email,
                'phone' => $this->customer_phone,
                'address' => $this->address,
                'city' => $this->city,
                'province' => $this->province,
                'postal_code' => $this->postal_code,
            ],
            'items' => $this->items->map(fn ($item) => [
                'sku' => $item->sku,
                'name' => $item->name,
                'color' => $item->color,
                'size' => $item->size,
                'image' => $item->image,
                'price' => $item->price,
                'qty' => $item->qty,
            ]),
            'subtotal' => $this->subtotal,
            'shipping' => [
                'method' => $this->shipping_method,
                'label' => config("services.shop.shipping.{$this->shipping_method}.label"),
                'cost' => $this->shipping_cost,
            ],
            'total' => $this->total,
            'payment_mode' => $this->payment_mode,
            'tracking_number' => $this->tracking_number,
            'paid_at' => $this->paid_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
            // Only for staff screens (payment history).
            'payments' => $this->when($request->user() !== null, fn () => $this->payments->map->only(['provider', 'status', 'payment_type', 'transaction_id', 'created_at'])),
        ];
    }
}
