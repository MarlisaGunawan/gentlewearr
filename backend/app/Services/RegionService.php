<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * External API: Indonesian provinces and cities (api-wilayah-indonesia by emsifa).
 * Results are cached for a day, so the checkout stays fast and works if the API blips.
 */
class RegionService
{
    public function provinces(): array
    {
        return $this->fetch('regions:provinces', '/provinces.json');
    }

    public function cities(string $provinceId): array
    {
        return $this->fetch('regions:cities:'.$provinceId, '/regencies/'.$provinceId.'.json');
    }

    private function fetch(string $cacheKey, string $path): array
    {
        return Cache::remember($cacheKey, now()->addDay(), function () use ($path) {
            $rows = Http::timeout(8)->acceptJson()
                ->get(rtrim(config('services.regions.base_url'), '/').$path)
                ->throw()
                ->json();

            // Keep only what the frontend needs, with nicer capitalisation.
            return collect($rows)
                ->map(fn ($row) => ['id' => $row['id'], 'name' => ucwords(strtolower($row['name']))])
                ->values()
                ->all();
        });
    }
}
