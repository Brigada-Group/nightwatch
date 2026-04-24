<?php

namespace App\Services;

use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Str;

class TeamService
{
    /**
     * Create a team owned by the given user. The Team model's `created` hook
     * is responsible for seeding the admin as a team member.
     *
     * @param  array{name: string, description?: string|null}  $data
     */
    public function create(User $admin, array $data): Team
    {
        return Team::create([
            'name' => $data['name'],
            'slug' => $this->uniqueSlug($data['name']),
            'description' => $data['description'] ?? null,
            'admin_id' => $admin->id,
        ]);
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name);

        if ($base === '') {
            $base = 'team';
        }

        $slug = $base;
        $suffix = 2;

        while (Team::where('slug', $slug)->exists()) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }
}
