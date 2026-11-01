<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Sends shop events to n8n webhooks: POST {N8N_WEBHOOK_URL}/{event}.
 * Events: order-paid, stock-low. n8n turns them into Telegram/email messages.
 * A failing n8n never breaks checkout — errors are only logged.
 */
class N8nNotifier
{
    public function send(string $event, array $data): void
    {
        $base = config('services.n8n.webhook_url');
        if (blank($base)) {
            return;
        }

        try {
            Http::timeout(4)->post(rtrim($base, '/').'/'.$event, $data + ['event' => $event, 'sent_at' => now()->toIso8601String()]);
        } catch (Throwable $e) {
            Log::warning('n8n webhook failed', ['event' => $event, 'error' => $e->getMessage()]);
        }
    }
}
