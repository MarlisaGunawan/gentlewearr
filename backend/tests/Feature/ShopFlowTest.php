<?php

namespace Tests\Feature;

use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * The main business rules: checkout prices on the server, payment moves stock
 * out once, n8n is notified, and the admin / n8n endpoints are protected.
 */
class ShopFlowTest extends TestCase
{
    use RefreshDatabase;

    protected $seed = true;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.midtrans.server_key' => null, 'services.n8n.webhook_url' => 'http://n8n.test/webhook/gentle-wear']);
        Http::fake();
    }

    private function checkout(array $items, string $shipping = 'regular')
    {
        return $this->postJson('/api/checkout', [
            'customer' => [
                'name' => 'Rina Pratama', 'email' => 'rina@example.com', 'phone' => '081234567890',
                'address' => 'Jl. Kemang Raya No. 8', 'city' => 'Jakarta Selatan', 'postal_code' => '12730',
            ],
            'shipping' => $shipping,
            'items' => $items,
        ]);
    }

    private function variant(string $sku): ProductVariant
    {
        return ProductVariant::where('sku', $sku)->firstOrFail();
    }

    public function test_catalog_lists_products_with_stock_per_variant(): void
    {
        $this->getJson('/api/products')
            ->assertOk()
            ->assertJsonCount(5, 'categories')
            ->assertJsonCount(20, 'products')
            ->assertJsonStructure(['products' => [['sku', 'price', 'colors' => [['name', 'hex', 'variants' => [['id', 'size', 'stock']]]]]]]);
    }

    public function test_checkout_uses_server_prices_and_shipping(): void
    {
        $variant = $this->variant('gw-101-black-m');
        $variant->update(['stock' => 10]);

        $this->checkout([['sku' => 'gw-101', 'color' => 'Black', 'size' => 'M', 'qty' => 2]])
            ->assertCreated()
            ->assertJsonPath('order.subtotal', 298000)
            ->assertJsonPath('order.shipping.cost', 20000)
            ->assertJsonPath('order.total', 318000)
            ->assertJsonPath('payment.mode', 'mock');

        // Over the free-shipping threshold, regular shipping is free.
        $this->checkout([['sku' => 'gw-101', 'color' => 'Black', 'size' => 'M', 'qty' => 4]])
            ->assertJsonPath('order.shipping.cost', 0);
    }

    public function test_checkout_rejects_more_than_the_stock(): void
    {
        $this->variant('gw-101-black-m')->update(['stock' => 1]);

        $this->checkout([['sku' => 'gw-101', 'color' => 'Black', 'size' => 'M', 'qty' => 3]])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('items.0');
    }

    public function test_payment_takes_stock_out_once_and_notifies_n8n(): void
    {
        $variant = $this->variant('gw-101-black-m');
        $variant->update(['stock' => 3, 'min_stock' => 2]);

        $code = $this->checkout([['sku' => 'gw-101', 'color' => 'Black', 'size' => 'M', 'qty' => 2]])->json('order.code');

        $this->postJson("/api/orders/{$code}/mock-pay", ['status' => 'paid'])->assertOk()->assertJsonPath('data.status', 'paid');
        $this->postJson("/api/orders/{$code}/mock-pay", ['status' => 'paid'])->assertOk(); // paying twice changes nothing

        $this->assertSame(1, $variant->fresh()->stock);
        $this->assertDatabaseHas('stock_movements', ['product_variant_id' => $variant->id, 'change' => -2, 'reason' => 'sale']);

        Http::assertSent(fn ($request) => str_ends_with($request->url(), '/order-paid') && $request['order_code'] === $code);
        Http::assertSent(fn ($request) => str_ends_with($request->url(), '/stock-low') && $request['stock'] === 1);
    }

    public function test_failed_payment_keeps_the_stock(): void
    {
        $variant = $this->variant('gw-101-black-m');
        $variant->update(['stock' => 5]);

        $code = $this->checkout([['sku' => 'gw-101', 'color' => 'Black', 'size' => 'M', 'qty' => 2]])->json('order.code');
        $this->postJson("/api/orders/{$code}/mock-pay", ['status' => 'failed'])->assertJsonPath('data.status', 'failed');

        $this->assertSame(5, $variant->fresh()->stock);
    }

    public function test_midtrans_webhook_checks_the_signature(): void
    {
        config(['services.midtrans.server_key' => 'SB-Mid-server-test']);

        $this->postJson('/api/midtrans/notification', [
            'order_id' => 'GW-X', 'status_code' => '200', 'gross_amount' => '1000.00',
            'transaction_status' => 'settlement', 'signature_key' => 'forged',
        ])->assertForbidden();
    }

    public function test_admin_and_n8n_endpoints_are_protected(): void
    {
        $this->getJson('/api/admin/dashboard')->assertUnauthorized();
        $this->getJson('/api/n8n/daily-summary')->assertUnauthorized();

        config(['services.n8n.token' => 'secret-token']);
        $this->getJson('/api/n8n/daily-summary', ['X-N8N-Token' => 'secret-token'])->assertOk()->assertJsonStructure(['orders', 'revenue', 'low_stock']);

        $token = $this->postJson('/api/admin/login', ['email' => 'admin@gentlewear.test', 'password' => 'gentlewear123'])->json('token');
        $this->getJson('/api/admin/dashboard', ['Authorization' => 'Bearer '.$token])->assertOk()->assertJsonStructure(['points', 'kpis', 'categories', 'low_stock', 'recent_orders']);
        $this->getJson('/api/admin/inventory', ['Authorization' => 'Bearer '.$token])->assertOk()->assertJsonStructure(['data', 'summary', 'movements']);
        $this->getJson('/api/admin/customers', ['Authorization' => 'Bearer '.$token])->assertOk()->assertJsonStructure(['data']);
        $this->assertSame('owner', User::first()->role);
    }
}
