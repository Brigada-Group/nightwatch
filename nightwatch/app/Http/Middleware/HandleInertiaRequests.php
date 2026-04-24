<?php

namespace App\Http\Middleware;

use App\Models\TeamMember;
use App\Services\CurrentTeam;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    public function __construct(
        private readonly CurrentTeam $currentTeam,
    ) {}

    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
                'subscription' => fn () => $request->user()?->currentSubscriptionSummary(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'hubUrl' => fn () => rtrim(config('app.url') ?? $request->getSchemeAndHttpHost(), '/'),
            'flash' => [
                'projectCredentials' => fn () => $request->session()->get('projectCredentials'),
            ],
            'teamContext' => fn () => $this->teamContext($request),
        ];
    }

    /**
     * @return array{
     *     current: array{id:int,name:string,slug:string,role:?string}|null,
     *     teams: array<int, array{id:int,name:string,slug:string,role:?string}>,
     * }
     */
    private function teamContext(Request $request): array
    {
        $user = $request->user();

        if ($user === null) {
            return ['current' => null, 'teams' => []];
        }

        $teams = $user->teams()
            ->wherePivot('status', TeamMember::STATUS_ACCEPTED)
            ->with('members.role')
            ->orderBy('team_members.accepted_at')
            ->orderBy('teams.id')
            ->get();

        $current = $this->currentTeam->for($user);
        $currentRole = $current ? $this->currentTeam->roleFor($user, $current) : null;

        return [
            'current' => $current ? [
                'id' => $current->id,
                'name' => $current->name,
                'slug' => $current->slug,
                'role' => $currentRole,
            ] : null,
            'teams' => $teams->map(fn ($team) => [
                'id' => $team->id,
                'name' => $team->name,
                'slug' => $team->slug,
                'role' => $team->members
                    ->firstWhere('user_id', $user->id)?->role?->slug,
            ])->values()->all(),
        ];
    }
}
