<?php

namespace App\Http\Support;

use App\Models\Project;

final class ProjectFilterOptions
{
    
    public static function all(): array
    {
        return Project::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Project $p) => ['id' => $p->id, 'name' => $p->name])
            ->values()
            ->all();
    }
}
