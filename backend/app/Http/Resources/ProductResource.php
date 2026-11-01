<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Product in the shape the React shop uses (same fields as frontend/src/config/catalog.js).
 */
class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $colors = $this->colors->map(fn ($color) => [
            'name' => $color->name,
            'hex' => $color->hex,
            'image' => $color->image,
            'variants' => $color->variants->sortBy(fn ($v) => array_search($v->size, ['S', 'M', 'L', 'XL', 'XXL']))->map(fn ($v) => [
                'id' => $v->id,
                'size' => $v->size,
                'stock' => $v->stock,
            ])->values(),
        ]);

        return [
            'sku' => $this->sku,
            'code' => $this->code,
            'category' => $this->category->name,
            'name' => $this->name,
            'line' => $this->line,
            'description' => $this->description,
            'price' => $this->price,
            'badge' => $this->badge,
            'image' => $this->image,
            'hotspots' => $this->hotspots ?? [],
            'sold_out' => $this->colors->flatMap->variants->sum('stock') === 0,
            'colors' => $colors,
        ];
    }
}
