<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['order_id', 'provider', 'transaction_id', 'payment_type', 'status', 'amount', 'payload'])]
class Payment extends Model
{
    protected function casts(): array
    {
        return ['payload' => 'array'];
    }
}
