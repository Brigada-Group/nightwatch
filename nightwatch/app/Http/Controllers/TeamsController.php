<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTeamRequest;
use App\Models\Team;
use App\Services\CurrentTeam;
use App\Services\TeamService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TeamsController extends Controller
{
    public function __construct(
        private readonly TeamService $teamService,
        private readonly CurrentTeam $currentTeam,
    ) {}

    public function create(): Response
    {
        return Inertia::render('teams/create');
    }

    public function store(StoreTeamRequest $request): RedirectResponse
    {
        $team = $this->teamService->create($request->user(), $request->validated());

        $this->currentTeam->set($request->user(), $team);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Team created.')]);

        return to_route('dashboard');
    }

    public function switch(Request $request, Team $team): RedirectResponse
    {
        $switched = $this->currentTeam->set($request->user(), $team);

        abort_unless($switched, 403);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Switched to :name.', ['name' => $team->name])]);

        return back();
    }
}
