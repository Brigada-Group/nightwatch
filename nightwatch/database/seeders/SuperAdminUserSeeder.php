<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = (string) config('super_admin.email');

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => (string) config('super_admin.name'),
                'password' => Hash::make($this->resolvePassword()),
                'email_verified_at' => now(),
                'is_super_admin' => true,
            ],
        );

        if ($this->command !== null) {
            $this->command->info(
                "Super admin user ready [{$email}]. In production, rely on config('super_admin.*') (set env, then config:cache).",
            );
            if (app()->isProduction()) {
                $this->command->warn('Ensure SUPER_ADMIN_PASSWORD is set and strong in production.');
            }
        }
    }

    private function resolvePassword(): string
    {
        $explicit = config('super_admin.password');

        if (is_string($explicit) && $explicit !== '') {
            return $explicit;
        }

        if (app()->isProduction()) {
            throw new \RuntimeException(
                'SUPER_ADMIN_PASSWORD must be set in production and config must include it. '.
                'If you use `php artisan config:cache`, set the variable in .env (or Forge env), then run `php artisan config:cache` again (or `config:clear` then seed).'
            );
        }

        return 'password';
    }
}
