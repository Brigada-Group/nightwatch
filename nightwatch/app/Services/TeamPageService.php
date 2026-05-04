<?php

namespace App\Services;

use App\Models\Team;
use App\Models\TeamMember;
use Illuminate\Support\Collection;

class TeamPageService
{
    public function roster(Team $team): array
    {
        $members = TeamMember::query()
            ->where('team_id', $team->id)
            ->where('status', TeamMember::STATUS_ACCEPTED)
            ->with([
                'user:id,name,email',
                'user.assignedProjects' => static fn ($q) => $q->where('projects.team_id', $team->id)
                    ->select(['projects.id', 'projects.name', 'projects.team_id']),
                'role:id,slug,name',
            ])
            ->orderBy('accepted_at')
            ->orderBy('team_members.id')
            ->get();

        return [
            'team' => [
                'id' => $team->id,
                'name' => $team->name,
                'slug' => $team->slug,
                'admin_id' => $team->admin_id,
            ],
            'members' => $this->serializeMembers($members),
        ];
    }

    private function serializeMembers(Collection $members): array
    {
        return $members->map(fn (TeamMember $row): array => [
            'id' => $row->id,
            'status' => $row->status,
            'joined_at' => $row->accepted_at?->toIso8601String(),
            'user' => [
                'id' => $row->user->id,
                'name' => $row->user->name,
                'email' => $row->user->email,
            ],
            'role' => $row->relationLoaded('role') && $row->role !== null
                ? [
                    'id' => $row->role->id,
                    'slug' => $row->role->slug,
                    'name' => $row->role->name,
                ]
                : null,
            'assigned_projects' => $row->user->relationLoaded('assignedProjects')
                ? $row->user->assignedProjects->map(static fn ($p): array => [
                    'id' => $p->id,
                    'name' => $p->name,
                ])->values()->all()
                : [],
        ])->values()->all();
    }
}
