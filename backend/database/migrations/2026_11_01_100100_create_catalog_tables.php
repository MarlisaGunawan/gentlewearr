<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Catalog + inventory: categories → products → colours → variants (colour × size).
     * Stock lives on the variant; every change is logged in stock_movements.
     */
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->string('sku')->unique(); // e.g. gw-101 (used in URLs)
            $table->string('code');          // e.g. GW-#101 (shown on the photo)
            $table->string('name');
            $table->string('line')->nullable();
            $table->text('description')->nullable();
            $table->unsignedInteger('price'); // rupiah
            $table->string('badge')->nullable();
            $table->string('image');
            $table->json('hotspots')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();
        });

        Schema::create('product_colors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('hex', 7);
            $table->string('image')->nullable(); // recoloured photo for this colour
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();
        });

        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_color_id')->constrained()->cascadeOnDelete();
            $table->string('size', 8);
            $table->string('sku')->unique(); // e.g. gw-101-white-m
            $table->unsignedInteger('stock')->default(0);
            $table->unsignedInteger('min_stock')->default(2); // below this → low-stock alert
            $table->timestamps();

            $table->unique(['product_color_id', 'size']);
        });

        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_variant_id')->constrained()->cascadeOnDelete();
            $table->integer('change');      // + in, − out
            $table->unsignedInteger('stock_after');
            $table->string('reason');       // seed, sale, adjustment, restock
            $table->unsignedBigInteger('order_id')->nullable();
            $table->string('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('product_colors');
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
    }
};
