<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTeamRequest;
use App\Services\TeamService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class TeamsController extends Controller
{
    public function __construct(
        private readonly TeamService $teamService,
    ) {}

    public function create(): Response
    {
        return Inertia::render('teams/create');
    }

    public function store(StoreTeamRequest $request): RedirectResponse
    {
        $this->teamService->create($request->user(), $request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Team created.')]);

        return to_route('dashboard');
    }
}
