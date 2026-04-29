<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;


class SuperAdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = (string) env('SUPER_ADMIN_EMAIL', 'superadmin@nightwatch.test');

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => (string) env('SUPER_ADMIN_NAME', 'Super Admin'),
                'password' => Hash::make($this->resolvePassword()),
                'email_verified_at' => now(),
                'is_super_admin' => true,
            ],
        );

        if ($this->command !== null) {
            $this->command->info(
                "Super admin user ready [{$email}]. Set SUPER_ADMIN_PASSWORD in .env before seeding in production.",
            );
            if (app()->isProduction()) {
                $this->command->warn('Ensure SUPER_ADMIN_PASSWORD is set and strong in production.');
            }
        }
    }

    private function resolvePassword(): string
    {
        $explicit = env('SUPER_ADMIN_PASSWORD');

        if (is_string($explicit) && $explicit !== '') {
            return $explicit;
        }

        if (app()->isProduction()) {
            throw new \RuntimeException(
                'SUPER_ADMIN_PASSWORD must be set in production before running SuperAdminUserSeeder.'
            );
        }

        return 'password';
    }
}
