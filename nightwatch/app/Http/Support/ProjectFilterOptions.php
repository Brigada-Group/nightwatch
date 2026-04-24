<?php

namespace App\Http\Support;

use App\Models\Project;
use App\Models\Team;

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

    public static function forTeam(Team $team): array
    {
        return $team->projects()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Project $p) => ['id' => $p->id, 'name' => $p->name])
            ->values()
            ->all();
    }
}
