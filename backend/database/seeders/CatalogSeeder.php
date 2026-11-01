<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Fills categories, products, colours and variants from data/catalog.json
 * (exported from the frontend with `node scripts/export-catalog.mjs`).
 */
class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $data = json_decode(file_get_contents(__DIR__.'/data/catalog.json'), true);

        DB::transaction(function () use ($data) {
            $categoryIds = [];
            foreach ($data['categories'] as $sort => $c) {
                $category = Category::updateOrCreate(
                    ['slug' => $c['slug']],
                    ['name' => $c['name'], 'title' => $c['title'], 'description' => $c['description'], 'sort' => $sort],
                );
                $categoryIds[$c['name']] = $category->id;
            }

            foreach ($data['products'] as $p) {
                $product = Product::updateOrCreate(['sku' => $p['sku']], [
                    'category_id' => $categoryIds[$p['category']],
                    'code' => $p['code'],
                    'name' => $p['name'],
                    'line' => $p['line'],
                    'description' => $p['description'],
                    'price' => $p['price'],
                    'badge' => $p['badge'],
                    'image' => $p['image'],
                    'hotspots' => $p['hotspots'],
                    'sort' => $p['sort'],
                ]);

                foreach ($p['colors'] as $colorSort => $c) {
                    $color = $product->colors()->updateOrCreate(
                        ['name' => $c['name']],
                        ['hex' => $c['hex'], 'image' => $c['image'], 'sort' => $colorSort],
                    );

                    foreach ($c['variants'] as $v) {
                        $variant = $color->variants()->firstOrNew(['size' => $v['size']]);
                        $isNew = ! $variant->exists;
                        $variant->fill([
                            'product_id' => $product->id,
                            'sku' => $p['sku'].'-'.Str::slug($c['name']).'-'.Str::lower($v['size']),
                        ])->save();

                        // Opening stock is logged as a movement, like a real stock count.
                        if ($isNew && $v['stock'] > 0) {
                            $variant->adjustStock($v['stock'], 'seed', note: 'Opening stock');
                        }
                    }
                }
            }
        });
    }
}
