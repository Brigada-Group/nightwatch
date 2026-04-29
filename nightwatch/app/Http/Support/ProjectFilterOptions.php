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

    /**
     * Restricted variant: only the projects whose ids are in $allowedIds.
     * Useful for non-managers whose visible project list is the subset they
     * are explicitly assigned to.
     *
     * @param  array<int>  $allowedIds
     */
    public static function forIds(Team $team, array $allowedIds): array
    {
        if ($allowedIds === []) {
            return [];
        }

        return $team->projects()
            ->whereIn('projects.id', $allowedIds)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Project $p) => ['id' => $p->id, 'name' => $p->name])
            ->values()
            ->all();
    }
}
