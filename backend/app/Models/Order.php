<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'code', 'status', 'customer_name', 'customer_email', 'customer_phone', 'address', 'city', 'province',
    'postal_code', 'shipping_method', 'shipping_cost', 'subtotal', 'total', 'payment_mode', 'snap_token',
    'tracking_number', 'paid_at',
])]
class Order extends Model
{
    /** Statuses the payment gateway can set. */
    public const PAYMENT_STATUSES = ['waiting_payment', 'pending', 'paid', 'failed', 'cancelled', 'expired'];

    /** Statuses staff set after payment (fulfilment). */
    public const FULFILMENT_STATUSES = ['packed', 'shipped', 'completed'];

    protected function casts(): array
    {
        return ['paid_at' => 'datetime'];
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class)->latest();
    }

    public function isPaid(): bool
    {
        return $this->paid_at !== null;
    }
}
