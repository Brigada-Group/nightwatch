<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'name' => 'Admin',
                'slug' => Role::ADMIN,
                'description' => 'Team owner with full permissions, including managing members.',
            ],
            [
                'name' => 'Project Manager',
                'slug' => Role::PROJECT_MANAGER,
                'description' => 'Can manage projects and invite members with non-admin roles.',
            ],
            [
                'name' => 'Developer',
                'slug' => Role::DEVELOPER,
                'description' => 'Can view and work on projects but cannot manage team membership.',
            ],
            [
                'name' => 'Viewer',
                'slug' => Role::VIEWER,
                'description' => 'Read-only access to team projects.',
            ],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(['slug' => $role['slug']], $role);
        }
    }
}
