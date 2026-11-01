<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Only n8n (which knows N8N_API_TOKEN) may call the /api/n8n/* endpoints.
 */
class VerifyN8nToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = config('services.n8n.token');

        abort_if(blank($token) || ! hash_equals($token, (string) $request->header('X-N8N-Token')), 401, 'Invalid n8n token.');

        return $next($request);
    }
}
