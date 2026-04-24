<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Role;
use App\Models\TeamMember;
use App\Models\User;
use App\Services\CurrentTeam;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class TeamInvitationsController extends Controller
{
    //

    public function __construct(private readonly CurrentTeam $currentTeam) {}

    public function searchUsers(Request $request): JsonResponse 
    {
        try {
            $user = $request->user();
            abort_unless($user !== null, 401);

            $team = $this->currentTeam->for($user);
            abort_unless($team, 403);

            $q = trim((string) $request->query('q', ''));

            if (strlen($q) < 2) {
                return response()->json(['data' => []]);
            }

            $alreadyInTeamIds = $team->members()->pluck('user_id')->filter()->values();

            $users = User::query()
                ->where('email', 'like', "%{$q}%")
                ->whereNotIn('id', $alreadyInTeamIds)
                ->limit(10)
                ->get(['id', 'name', 'email']);

            return response()->json(['data' => $users]);
        } catch (Throwable $exception) {
            Log::error('Team invitation search failed', [
                'exception_class' => get_class($exception),
                'message' => $exception->getMessage(),
                'user_id' => $request->user()?->id,
                'query' => (string) $request->query('q', ''),
            ]);

            throw $exception;
        }
    }

    public function store(Request $request): RedirectResponse|JsonResponse
    {
        try {
            $user = $request->user();
            abort_unless($user !== null, 401);

            $team = $this->currentTeam->for($user);
            abort_unless($team, 403);

            abort_unless($this->currentTeam->userCanManageProjects($user, $team), 403);

            $data = $request->validate([
                'email' => ['required', 'email'],
                'role_slug' => ['required', 'string', 'in:developer,viewer,project_manager'],
            ]);

            $roleId = $this->resolveRoleId($data['role_slug']);
            abort_unless($roleId, 422);

            $targetUser = User::query()->where('email', $data['email'])->first();

            TeamMember::updateOrCreate(
                [
                    'team_id' => $team->id,
                    'invitation_email' => $data['email'],
                ],
                [
                    'user_id' => $targetUser?->id,
                    'role_id' => $roleId,
                    'status' => TeamMember::STATUS_PENDING,
                    'invitation_token' => Str::random(64),
                    'invited_by' => $user->id,
                    'invited_at' => now(),
                    'accepted_at' => null,
                    'declined_at' => null,
                ]
            );

            return back()->with('success', 'Invitation sent.');
        } catch (Throwable $exception) {
            Log::error('Team invitation store failed', [
                'exception_class' => get_class($exception),
                'message' => $exception->getMessage(),
                'user_id' => $request->user()?->id,
                'email' => (string) $request->input('email', ''),
                'role_slug' => (string) $request->input('role_slug', ''),
            ]);

            if ($request->expectsJson()) {
                $statusCode = $exception instanceof HttpExceptionInterface
                    ? $exception->getStatusCode()
                    : 500;

                return response()->json([
                    'ok' => false,
                    'message' => $exception->getMessage(),
                    'exception_class' => get_class($exception),
                    'error_context' => [
                        'email' => (string) $request->input('email', ''),
                        'role_slug' => (string) $request->input('role_slug', ''),
                    ],
                ], $statusCode);
            }

            throw $exception;
        }
    }

    public function accept(string $token, Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user, 401);
        $invite = TeamMember::query()
            ->where('invitation_token', $token)
            ->where('status', TeamMember::STATUS_PENDING)
            ->firstOrFail();
        abort_unless(
            $invite->invitation_email === $user->email || $invite->user_id === $user->id,
            403
        );
        $invite->update([
            'user_id' => $user->id,
            'status' => TeamMember::STATUS_ACCEPTED,
            'accepted_at' => now(),
            'invitation_token' => null,
        ]);
        return redirect()->route('dashboard');
    }

    private function resolveRoleId(string $slug): ?int
    {
        $defaultNames = [
            Role::PROJECT_MANAGER => 'Project Manager',
            Role::DEVELOPER => 'Developer',
            Role::VIEWER => 'Viewer',
            Role::ADMIN => 'Admin',
        ];

        $role = Role::query()->firstOrCreate(
            ['slug' => $slug],
            ['name' => $defaultNames[$slug] ?? Str::headline($slug)]
        );

        return $role->id;
    }
}
