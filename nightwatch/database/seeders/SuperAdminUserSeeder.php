<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Updates the existing super-admin user's email (e.g. default install email → production address).
 * Does not create users or change passwords.
 *
 * Configure in .env / Forge: SUPER_ADMIN_MATCH_EMAIL, SUPER_ADMIN_EMAIL.
 */
class SuperAdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $matchEmail = (string) config('super_admin.match_email');
        $newEmail = (string) config('super_admin.email');

        $user = User::query()
            ->where('email', $matchEmail)
            ->first();

        if ($user === null) {
            $user = User::query()
                ->where('is_super_admin', true)
                ->orderBy('id')
                ->first();
        }

        if ($user === null) {
            if ($this->command !== null) {
                $this->command->warn(
                    "No super-admin user found (no row with email [{$matchEmail}] and no is_super_admin=1). Nothing to update.",
                );
            }

            return;
        }

        if ($user->email === $newEmail) {
            if ($this->command !== null) {
                $this->command->info("Super admin already uses [{$newEmail}]. Skipping.");
            }

            return;
        }

        if (User::query()->where('email', $newEmail)->whereKeyNot($user->getKey())->exists()) {
            throw new \RuntimeException(
                "Cannot move super admin to [{$newEmail}]: another user already uses that email."
            );
        }

        $user->forceFill(['email' => $newEmail])->save();

        if ($this->command !== null) {
            $this->command->info(
                "Super admin email updated: [{$matchEmail}] → [{$newEmail}] (user id {$user->id}).",
            );
        }
    }
}
