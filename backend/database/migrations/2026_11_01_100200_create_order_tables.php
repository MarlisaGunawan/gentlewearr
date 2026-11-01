<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Sales + payment: orders, their items (a price snapshot), and payment attempts.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // also the Midtrans order_id
            $table->string('status')->default('waiting_payment')->index();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone');
            $table->string('address');
            $table->string('city');
            $table->string('province')->nullable();
            $table->string('postal_code', 10);
            $table->string('shipping_method');
            $table->unsignedInteger('shipping_cost');
            $table->unsignedInteger('subtotal');
            $table->unsignedInteger('total');
            $table->string('payment_mode');   // midtrans | mock
            $table->string('snap_token')->nullable();
            $table->string('tracking_number')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_variant_id')->nullable()->constrained()->nullOnDelete();
            $table->string('sku');
            $table->string('name');
            $table->string('color');
            $table->string('size', 8);
            $table->string('image');
            $table->unsignedInteger('price');
            $table->unsignedInteger('qty');
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('provider');               // midtrans | mock
            $table->string('transaction_id')->nullable();
            $table->string('payment_type')->nullable(); // bank_transfer, qris, …
            $table->string('status');
            $table->unsignedInteger('amount');
            $table->json('payload')->nullable();      // raw gateway response, for auditing
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
