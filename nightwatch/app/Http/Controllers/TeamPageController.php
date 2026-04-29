<?php

namespace App\Http\Controllers;

use App\Services\CurrentTeam;
use App\Services\TeamPageService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TeamPageController extends Controller
{
    public function __construct(
        private readonly CurrentTeam $currentTeam,
        private readonly TeamPageService $teamPage,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $team = $this->currentTeam->for($user);

        abort_unless($team !== null, 403);

        $page = $this->teamPage->roster($team);
        $page['canManageProjectAssignments'] = $this->currentTeam->userCanManageProjects($user, $team);
        $page['teamProjects'] = $team->projects()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('team/index', $page);
    }
}
