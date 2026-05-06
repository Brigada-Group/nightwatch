<?php

/**
 * Super admin-related settings (read via config(), not env(), when config is cached).
 */
return [
    /** Used to locate the existing super-admin row before renaming (typically the old default). */
    'match_email' => env('SUPER_ADMIN_MATCH_EMAIL', 'superadmin@guardian.test'),
    /** New login email after SuperAdminUserSeeder runs. */
    'email' => env('SUPER_ADMIN_EMAIL', 'superadmin@gmail.com'),
    'name' => env('SUPER_ADMIN_NAME', 'Super Admin'),
    /** Optional; only used if you extend the seeder to rotate credentials. */
    'password' => env('SUPER_ADMIN_PASSWORD'),
];
