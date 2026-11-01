<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RegionService;
use Throwable;

/**
 * Proxy for the external Indonesian regions API (cached), used by the checkout form.
 */
class RegionController extends Controller
{
    public function provinces(RegionService $regions)
    {
        return $this->respond(fn () => $regions->provinces());
    }

    public function cities(string $province, RegionService $regions)
    {
        abort_unless(ctype_digit($province), 404);

        return $this->respond(fn () => $regions->cities($province));
    }

    private function respond(callable $load)
    {
        try {
            return response()->json($load());
        } catch (Throwable) {
            return response()->json(['message' => 'Region service is unavailable right now.'], 502);
        }
    }
}
