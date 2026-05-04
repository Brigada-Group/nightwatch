<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateAiConfigRequest;
use App\Models\Project;
use App\Models\Team;
use App\Services\AiConfigService;
use App\Services\CurrentTeam;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AiConfigController extends Controller
{
    public function __construct(
        private readonly AiConfigService $aiConfig,
        private readonly CurrentTeam $currentTeam,
    ) {}

    public function show(Request $request): Response
    {
        $team = $this->teamForActor($request);

        return Inertia::render('ai-config', [
            'projects' => $this->aiConfig->forTeamProjects($team),
        ]);
    }

    public function update(UpdateAiConfigRequest $request, Project $project): RedirectResponse
    {
        $team = $this->teamForActor($request);

        // Verify the project belongs to the actor's team. This is the only
        // line keeping a malicious team admin from poking another team's
        // project config by guessing IDs, so it lives here in the controller
        // rather than down in the service.
        abort_unless($project->team_id === $team->id, 404);

        $this->aiConfig->update($project, $request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('AI configuration updated.')]);

        return to_route('ai-config.show');
    }

    private function teamForActor(Request $request): Team
    {
        $user = $request->user();
        $team = $this->currentTeam->for($user);

        abort_unless($team !== null, 403);
        abort_unless($this->currentTeam->userCanManageProjects($user, $team), 403);

        return $team;
    }
}
