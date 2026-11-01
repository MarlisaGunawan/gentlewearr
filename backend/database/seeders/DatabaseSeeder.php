<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database: the admin login (from .env), the catalog, and CMS content.
     */
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
            CatalogSeeder::class,
            ContentSeeder::class,
        ]);
    }
}
