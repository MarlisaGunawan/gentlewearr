<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // Backoffice login created by AdminUserSeeder (php artisan db:seed --class=AdminUserSeeder).
    'admin' => [
        'name' => env('ADMIN_NAME', 'Gentle Wear Admin'),
        'email' => env('ADMIN_EMAIL', 'admin@gentlewear.test'),
        'password' => env('ADMIN_PASSWORD', 'gentlewear123'),
    ],

    // Payment gateway. Leave the server key empty to use mock payments.
    'midtrans' => [
        'server_key' => env('MIDTRANS_SERVER_KEY'),
        'client_key' => env('MIDTRANS_CLIENT_KEY'),
        'is_production' => env('MIDTRANS_IS_PRODUCTION', false),
    ],

    // Automation. Laravel POSTs events to {webhook_url}/{event}; n8n calls back with the token.
    'n8n' => [
        'webhook_url' => env('N8N_WEBHOOK_URL'),
        'token' => env('N8N_API_TOKEN'),
    ],

    // External API: Indonesian provinces and cities (free, no key).
    'regions' => [
        'base_url' => env('REGIONS_API_URL', 'https://www.emsifa.com/api-wilayah-indonesia/api'),
    ],

    // Shop rules shared by checkout and the admin dashboard.
    'shop' => [
        'free_shipping_min' => 500000,
        'shipping' => [
            'regular' => ['label' => 'Regular (2–4 days)', 'cost' => 20000, 'free_over_min' => true],
            'express' => ['label' => 'Express (1 day)', 'cost' => 45000, 'free_over_min' => false],
        ],
    ],

];
