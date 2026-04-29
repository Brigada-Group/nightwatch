<?php

namespace App\Services;

use App\Models\Role;
use App\Models\Team;
use App\Models\TeamInvitationLink;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TeamInvitationLinkService
{
    public const DEFAULT_EXPIRES_DAYS = 7;

    public const MAX_EXPIRES_DAYS = 30;

    public const ALLOWED_ROLE_SLUGS = [
        Role::PROJECT_MANAGER,
        Role::DEVELOPER,
        Role::VIEWER,
    ];

    public function __construct(
        private readonly TeamProjectAssignmentService $teamProjectAssignments,
    ) {}

    public function createForTeam(
        Team $team,
        string $roleSlug,
        int $expiresInDays,
        ?int $maxUses,
        ?array $projectIds = null,
        ?User $createdBy = null,
    ): array {
        $expiresInDays = max(1, min($expiresInDays, self::MAX_EXPIRES_DAYS));
        $role = Role::query()->where('slug', $roleSlug)->firstOrFail();

        $normalizedProjectIds = $this->normalizeInvitationProjectIds($team, $projectIds);

        $plain = bin2hex(random_bytes(32));
        $hash = hash('sha256', $plain);

        $link = TeamInvitationLink::create([
            'team_id' => $team->id,
            'role_id' => $role->id,
            'created_by' => $createdBy?->id,
            'project_ids' => $normalizedProjectIds,
            'token_hash' => $hash,
            'token_cipher' => encrypt($plain),
            'token_prefix' => Str::lower(substr($plain, 0, 8)),
            'max_uses' => $maxUses,
            'expires_at' => now()->addDays($expiresInDays),
        ]);

        return [
            'plain_token' => $plain,
            'link' => $link,
            'join_url' => url('/join/'.$plain),
        ];
    }

    public function findUsableByPlainToken(string $plainToken): ?TeamInvitationLink
    {
        if (! preg_match('/^[a-f0-9]{64}$/', $plainToken)) {
            return null;
        }

        $hash = hash('sha256', $plainToken);

        $link = TeamInvitationLink::query()
            ->with(['team', 'role'])
            ->where('token_hash', $hash)
            ->first();

        if ($link === null || ! $link->isUsable()) {
            return null;
        }

        return $link;
    }

    public function accept(User $user, string $plainToken, CurrentTeam $currentTeam): Team
    {
        if (! preg_match('/^[a-f0-9]{64}$/', $plainToken)) {
            abort(404);
        }

        return DB::transaction(function () use ($user, $plainToken, $currentTeam): Team {
            $hash = hash('sha256', $plainToken);

            $invite = TeamInvitationLink::query()
                ->where('token_hash', $hash)
                ->lockForUpdate()
                ->first();

            if ($invite === null || ! $invite->isUsable()) {
                abort(410, __('This invitation link is invalid, expired, or no longer usable.'));
            }

            if ($invite->created_by !== null && $invite->created_by === $user->id) {
                abort(403, __('You created this invitation link — you cannot accept your own invitation.'));
            }

            $team = Team::query()->findOrFail($invite->team_id);

            $already = TeamMember::query()
                ->where('team_id', $team->id)
                ->where('user_id', $user->id)
                ->where('status', TeamMember::STATUS_ACCEPTED)
                ->exists();

            if ($already) {
                $currentTeam->set($user, $team);

                return $team;
            }

            TeamMember::query()->updateOrCreate(
                [
                    'team_id' => $team->id,
                    'user_id' => $user->id,
                ],
                [
                    'role_id' => $invite->role_id,
                    'status' => TeamMember::STATUS_ACCEPTED,
                    'invitation_email' => $user->email,
                    'invitation_token' => null,
                    'invited_by' => $team->admin_id,
                    'invited_at' => now(),
                    'accepted_at' => now(),
                    'declined_at' => null,
                ]
            );

            $invite->forceFill([
                'uses_count' => $invite->uses_count + 1,
                'last_used_at' => now(),
            ])->save();

            $currentTeam->set($user, $team);

            if (is_array($invite->project_ids) && $invite->project_ids !== []) {
                $assignedBy = User::query()->find($team->admin_id) ?? $user;
                $this->teamProjectAssignments->attachUserToTeamProjects(
                    $user,
                    $team,
                    $invite->project_ids,
                    $assignedBy,
                );
            }

            return $team;
        });
    }

    private function normalizeInvitationProjectIds(Team $team, ?array $projectIds): ?array
    {
        if ($projectIds === null || $projectIds === []) {
            return null;
        }

        $input = array_values(array_unique(array_map(static fn ($id) => (int) $id, $projectIds)));
        $valid = $this->teamProjectAssignments->projectIdsOwnedByTeam($team, $input);

        abort_unless(count($valid) === count($input), 422, __('One or more projects are not part of this team.'));

        return $valid;
    }

    public function revoke(TeamInvitationLink $link): void
    {
        $link->forceFill(['revoked_at' => now()])->save();
    }
}
