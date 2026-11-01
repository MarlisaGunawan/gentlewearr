<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One sellable item: a product in one colour and one size. Stock lives here.
 */
#[Fillable(['product_id', 'product_color_id', 'size', 'sku', 'stock', 'min_stock'])]
class ProductVariant extends Model
{
    protected function casts(): array
    {
        return ['stock' => 'integer', 'min_stock' => 'integer'];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function color(): BelongsTo
    {
        return $this->belongsTo(ProductColor::class, 'product_color_id');
    }

    public function movements(): HasMany
    {
        return $this->hasMany(StockMovement::class)->latest();
    }

    public function isLow(): bool
    {
        return $this->stock <= $this->min_stock;
    }

    /**
     * Change the stock and log why. Use negative numbers to take stock out.
     */
    public function adjustStock(int $change, string $reason, ?int $orderId = null, ?string $note = null): void
    {
        $this->stock = max(0, $this->stock + $change);
        $this->save();

        $this->movements()->create([
            'change' => $change,
            'stock_after' => $this->stock,
            'reason' => $reason,
            'order_id' => $orderId,
            'note' => $note,
        ]);
    }
}
