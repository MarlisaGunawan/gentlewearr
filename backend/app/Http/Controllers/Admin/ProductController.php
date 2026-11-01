<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    /** Units sold per product, counting paid orders only. */
    private function soldQuery()
    {
        return OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('product_variants', 'product_variants.id', '=', 'order_items.product_variant_id')
            ->whereNotNull('orders.paid_at')
            ->whereColumn('product_variants.product_id', 'products.id')
            ->selectRaw('COALESCE(SUM(order_items.qty), 0)');
    }

    /**
     * GET /api/admin/products — list with total stock and low-stock count.
     */
    public function index(Request $request)
    {
        $products = Product::with('category:id,name')
            ->withSum('variants as stock', 'stock')
            ->addSelect(['sold' => $this->soldQuery()])
            ->withCount(['variants as low_variants' => fn ($q) => $q->whereColumn('stock', '<=', 'min_stock')])
            ->when($request->query('search'), fn ($q, $s) => $q->where('name', 'like', "%{$s}%")->orWhere('sku', 'like', "%{$s}%"))
            ->when($request->query('category'), fn ($q, $c) => $q->whereHas('category', fn ($q) => $q->where('slug', $c)))
            ->orderBy('sort')
            ->get();

        return response()->json([
            'products' => $products->map(fn ($p) => [
                'sku' => $p->sku,
                'code' => $p->code,
                'name' => $p->name,
                'category' => $p->category->name,
                'price' => $p->price,
                'image' => $p->image,
                'is_active' => $p->is_active,
                'stock' => (int) $p->stock,
                'sold' => (int) $p->sold,
                'low_variants' => $p->low_variants,
            ]),
            'categories' => Category::orderBy('sort')->get(['id', 'slug', 'name']),
        ]);
    }

    /**
     * GET /api/admin/products/{sku} — full product with every variant.
     */
    public function show(Product $product)
    {
        return response()->json($this->detail($product));
    }

    /**
     * POST /api/admin/products — new product; variants are created for every colour × size.
     */
    public function store(Request $request)
    {
        $data = $this->validated($request, creating: true);

        $product = Product::create($data + ['code' => 'GW-#'.Str::upper(Str::after($data['sku'], 'gw-')), 'sort' => Product::max('sort') + 1]);

        foreach ($data['colors'] as $sort => $c) {
            $color = $product->colors()->create($c + ['sort' => $sort]);
            foreach ($data['sizes'] as $size) {
                $color->variants()->create([
                    'product_id' => $product->id,
                    'size' => $size,
                    'sku' => $product->sku.'-'.Str::slug($c['name']).'-'.Str::lower($size),
                ]);
            }
        }

        return response()->json($this->detail($product), 201);
    }

    /**
     * PUT /api/admin/products/{sku} — edit the product details.
     */
    public function update(Request $request, Product $product)
    {
        $product->update($this->validated($request, product: $product));

        return response()->json($this->detail($product));
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return response()->noContent();
    }

    private function validated(Request $request, bool $creating = false, ?Product $product = null): array
    {
        return $request->validate([
            'sku' => [$creating ? 'required' : 'prohibited', 'regex:/^gw-[0-9a-z-]+$/', Rule::unique('products', 'sku')],
            'category_id' => ['required', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:150'],
            'line' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:1000'],
            'price' => ['required', 'integer', 'min:1000'],
            'badge' => ['nullable', 'in:featured,copy'],
            'image' => ['required', 'url'],
            'is_active' => ['boolean'],
            'hotspots' => ['nullable', 'array'],
            'hotspots.*.x' => ['required', 'numeric', 'between:0,100'],
            'hotspots.*.y' => ['required', 'numeric', 'between:0,100'],
            'hotspots.*.title' => ['required', 'string', 'max:60'],
            'hotspots.*.text' => ['nullable', 'string', 'max:120'],
            'colors' => [$creating ? 'required' : 'prohibited', 'array', 'min:1'],
            'colors.*.name' => ['required', 'string', 'max:40'],
            'colors.*.hex' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'sizes' => [$creating ? 'required' : 'prohibited', 'array', 'min:1'],
            'sizes.*' => ['in:S,M,L,XL,XXL'],
        ]);
    }

    private function detail(Product $product): array
    {
        $product->load('category', 'colors.variants');
        $sold = (int) Product::whereKey($product->id)->addSelect(['sold' => $this->soldQuery()])->value('sold');

        return ['sold' => $sold, 'remaining' => (int) $product->colors->flatMap->variants->sum('stock')] + $product->only(['id', 'sku', 'code', 'name', 'line', 'description', 'price', 'badge', 'image', 'is_active', 'hotspots', 'category_id']) + [
            'category' => $product->category->name,
            'colors' => $product->colors->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'hex' => $c->hex,
                'image' => $c->image,
                'variants' => $c->variants->sortBy(fn ($v) => array_search($v->size, ['S', 'M', 'L', 'XL', 'XXL']))
                    ->map->only(['id', 'size', 'sku', 'stock', 'min_stock'])->values(),
            ]),
        ];
    }
}
