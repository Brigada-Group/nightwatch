<?php

namespace App\Http\Controllers\Integrations;

use App\Http\Controllers\Controller;
use App\Models\GithubInstallation;
use App\Models\GithubRepository;
use App\Models\Project;
use App\Models\Team;
use App\Services\CurrentTeam;
use App\Services\Github\GithubInstallationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class GithubController extends Controller
{
    public function __construct(
        private readonly CurrentTeam $currentTeam,
        private readonly GithubInstallationService $installationService,
    ) {}

    public function show(Request $request): Response
    {
        $team = $this->teamForActor($request);
        $installation = $this->installationFor($team);

        $installUrl = null;

        if ($installation === null) {
            $appSlug = (string) config('services.github.app_slug', '');
            $installUrl = $appSlug !== ''
                ? 'https://github.com/apps/'.$appSlug.'/installations/new'
                : null;
        }

        return Inertia::render('integrations/github', [
            'installation' => $installation === null ? null : [
                'id' => $installation->id,
                'account_login' => $installation->account_login,
                'account_type' => $installation->account_type,
                'repository_selection' => $installation->repository_selection,
                'installed_at' => optional($installation->created_at)->toIso8601String(),
                'suspended_at' => optional($installation->suspended_at)->toIso8601String(),
            ],
            'repositories' => $installation === null ? [] : $installation
                ->repositories()
                ->with('project:id,project_uuid,name')
                ->orderBy('full_name')
                ->get()
                ->map(fn (GithubRepository $repo): array => [
                    'id' => $repo->id,
                    'full_name' => $repo->full_name,
                    'private' => $repo->private,
                    'default_branch' => $repo->default_branch,
                    'project' => $repo->project === null ? null : [
                        'uuid' => $repo->project->project_uuid,
                        'name' => $repo->project->name,
                    ],
                ])
                ->all(),
            'projects' => $team->projects()
                ->orderBy('name')
                ->get(['id', 'project_uuid', 'name'])
                ->map(fn (Project $project): array => [
                    'uuid' => $project->project_uuid,
                    'name' => $project->name,
                ])
                ->all(),
            'install_url' => $installUrl,
        ]);
    }

    /**
     * Redirect the admin to GitHub's install page. We don't pass `state` here
     * because GitHub bounces back to the App's configured Setup URL, not to
     * an arbitrary URL we provide; team scoping is recovered server-side
     * from the actor's session at /integrations/github/setup.
     */
    public function install(Request $request): RedirectResponse
    {
        $this->teamForActor($request);

        $appSlug = (string) config('services.github.app_slug', '');

        abort_if($appSlug === '', 500, 'GitHub App slug is not configured.');

        return redirect()->away('https://github.com/apps/'.$appSlug.'/installations/new');
    }

    /**
     * GitHub's "Setup URL" callback. Fires after a fresh install AND after
     * an installation is updated (e.g. repo selection changed). Re-syncs
     * everything from GitHub's view of the world.
     */
    public function setup(Request $request): RedirectResponse
    {
        $team = $this->teamForActor($request);

        $installationId = (int) $request->query('installation_id', 0);
        $action = (string) $request->query('setup_action', 'install');

        if ($installationId === 0) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('GitHub did not return an installation id.')]);

            return to_route('integrations.github.show');
        }

        if ($action === 'cancel') {
            return to_route('integrations.github.show');
        }

        $this->installationService->syncFromInstallationId($installationId, $team, $request->user());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('GitHub connected.')]);

        return to_route('integrations.github.show');
    }

    /**
     * GitHub's identifying-users-via-OAuth flow lands here. We only need the
     * email mapping eventually; for the initial round trip we just confirm
     * the auth completed and bounce back to the integration page.
     */
    public function oauthCallback(Request $request): RedirectResponse
    {
        $this->teamForActor($request);

        // The "code" can be exchanged for a user token later when we wire the
        // team-member-to-GitHub-account mapping. For now, just acknowledge.
        return to_route('integrations.github.show');
    }

    public function disconnect(Request $request): RedirectResponse
    {
        $team = $this->teamForActor($request);
        $installation = $this->installationFor($team);

        if ($installation !== null) {
            $this->installationService->disconnect($installation);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('GitHub disconnected from Nightwatch. Uninstall the App on GitHub to revoke its access there.'),
        ]);

        return to_route('integrations.github.show');
    }

    public function linkRepository(Request $request, GithubRepository $repository): RedirectResponse
    {
        $team = $this->teamForActor($request);

        // Defence-in-depth: confirm this repo's installation belongs to the
        // actor's team before we let them rewrite the project link.
        abort_unless($repository->installation->team_id === $team->id, 404);

        $validated = Validator::make($request->all(), [
            'project_uuid' => ['nullable', 'string'],
        ])->validate();

        $projectUuid = $validated['project_uuid'] ?? null;

        if ($projectUuid === null || $projectUuid === '') {
            $repository->update(['project_id' => null]);
        } else {
            $project = $team->projects()->where('project_uuid', $projectUuid)->first();
            abort_unless($project !== null, 404);

            $repository->update(['project_id' => $project->id]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Repository link updated.')]);

        return to_route('integrations.github.show');
    }

    private function teamForActor(Request $request): Team
    {
        $user = $request->user();
        $team = $this->currentTeam->for($user);

        abort_unless($team !== null, 403);
        abort_unless($this->currentTeam->userCanManageProjects($user, $team), 403);

        return $team;
    }

    private function installationFor(Team $team): ?GithubInstallation
    {
        return GithubInstallation::query()
            ->where('team_id', $team->id)
            ->latest('id')
            ->first();
    }
}
