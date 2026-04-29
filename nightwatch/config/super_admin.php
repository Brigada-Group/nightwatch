<?php

/**
 * Super admin-related settings (read via config(), not env(), when config is cached).
 */
return [
    'email' => env('SUPER_ADMIN_EMAIL', 'superadmin@nightwatch.test'),
    'name' => env('SUPER_ADMIN_NAME', 'Super Admin'),
    /** Nullable until set — use explicit values in production before seeding/creating users via console. */
    'password' => env('SUPER_ADMIN_PASSWORD'),
];
