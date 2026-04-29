<?php

namespace App\Http\Controllers;

use App\Services\CurrentTeam;
use App\Services\TeamInvitationLinkService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TeamJoinController extends Controller
{
    public function __construct(
        private readonly TeamInvitationLinkService $invitationLinks,
        private readonly CurrentTeam $currentTeam,
    ) {}

    public function show(Request $request, string $token): Response|RedirectResponse
    {
        if (! preg_match('/^[a-f0-9]{64}$/', $token)) {
            abort(404);
        }

        $invite = $this->invitationLinks->findUsableByPlainToken($token);

        if ($invite === null) {
            return Inertia::render('join/show', [
                'valid' => false,
            ]);
        }

        if (! $request->user()) {
            session()->put('url.intended', url()->current());
        }

        $projects = [];

        if (is_array($invite->project_ids) && $invite->project_ids !== []) {
            $projects = $invite->team->projects()
                ->whereIn('projects.id', $invite->project_ids)
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(static fn ($p): array => ['id' => $p->id, 'name' => $p->name])
                ->values()
                ->all();
        }

        $viewer = $request->user();
        $isOwner = $viewer !== null
            && $invite->created_by !== null
            && $invite->created_by === $viewer->id;

        return Inertia::render('join/show', [
            'valid' => true,
            'team' => [
                'name' => $invite->team->name,
                'slug' => $invite->team->slug,
            ],
            'role' => [
                'name' => $invite->role->name,
                'slug' => $invite->role->slug,
            ],
            'expires_at' => $invite->expires_at->toIso8601String(),
            'projects' => $projects,
            // The token only matters for users who can accept. Keeping it out
            // of the props for the link's owner makes accidental acceptance
            // impossible from the page.
            'token' => $isOwner ? null : $token,
            'is_owner' => $isOwner,
        ]);
    }

    public function accept(Request $request, string $token): RedirectResponse
    {
        abort_unless($request->user(), 401);

        $team = $this->invitationLinks->accept($request->user(), $token, $this->currentTeam);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('You joined :team.', ['team' => $team->name])]);

        return redirect()->route('dashboard');
    }
}
