<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Creates or updates the backoffice login from .env (ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD).
 *
 * Change the password: edit ADMIN_PASSWORD in .env, then run
 *   php artisan db:seed --class=AdminUserSeeder
 * Only this account is touched — products, stock, orders and content stay as they are.
 */
class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = config('services.admin');

        User::updateOrCreate(
            ['email' => $admin['email']],
            ['name' => $admin['name'], 'role' => 'owner', 'password' => $admin['password']], // hashed by the model cast
        );

        $this->command?->info("Backoffice login ready: {$admin['email']} (password from ADMIN_PASSWORD in .env)");
    }
}
