<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Http\Support\InertiaPaginator;
use App\Models\Project;
use App\Services\CurrentTeam;
use App\Services\ProjectService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectsController extends Controller
{
    public function __construct(
        private readonly ProjectService $projectService,
        private readonly CurrentTeam $currentTeam,
    ) {}

    public function index(Request $request): Response
    {
        $team = $this->currentTeam->for($request->user());

        abort_unless($team !== null, 403);

        $perPage = (int) min(50, max(5, $request->integer('per_page', 15)));

        $paginator = $team->projects()
            ->orderByDesc('last_heartbeat_at')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('projects/index', [
            'projects' => InertiaPaginator::props($paginator),
            'canCreateProject' => $request->user()->can('create', Project::class),
        ]);
    }

    public function store(StoreProjectRequest $request): RedirectResponse
    {
        $this->authorize('create', Project::class);

        $team = $this->currentTeam->for($request->user());

        abort_unless($team !== null, 403);

        $result = $this->projectService->create($team, $request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Project created.')]);

        return to_route('projects.show', $result['project'])->with('projectCredentials', [
            'project_id' => $result['project']->id,
            'project_uuid' => $result['project']->project_uuid,
            'api_token' => $result['api_token'],
            'kind' => 'created',
        ]);
    }

    public function show(Project $project): Response
    {
        $this->authorize('view', $project);

        $project->loadCount([
            'exceptions',
            'requests',
            'queries',
            'jobs',
            'logs',
            'outgoingHttp',
            'mails',
            'notifications',
            'caches',
            'commands',
            'scheduledTasks',
            'healthChecks',
        ]);

        return Inertia::render('projects/show', [
            'project' => $project,
            'counts' => [
                'exceptions' => $project->exceptions_count,
                'requests' => $project->requests_count,
                'queries' => $project->queries_count,
                'jobs' => $project->jobs_count,
                'logs' => $project->logs_count,
                'outgoing_http' => $project->outgoing_http_count,
                'mails' => $project->mails_count,
                'notifications' => $project->notifications_count,
                'caches' => $project->caches_count,
                'commands' => $project->commands_count,
                'scheduled_tasks' => $project->scheduled_tasks_count,
                'health_checks' => $project->health_checks_count,
            ],
            'recent' => [
                'exceptions' => $project->exceptions()->latest('sent_at')->limit(5)->get(),
                'requests' => $project->requests()->latest('sent_at')->limit(5)->get(),
                'queries' => $project->queries()->latest('sent_at')->limit(5)->get(),
                'jobs' => $project->jobs()->latest('sent_at')->limit(5)->get(),
                'logs' => $project->logs()->latest('sent_at')->limit(5)->get(),
                'outgoing_http' => $project->outgoingHttp()->latest('sent_at')->limit(5)->get(),
                'mails' => $project->mails()->latest('sent_at')->limit(5)->get(),
                'notifications' => $project->notifications()->latest('sent_at')->limit(5)->get(),
                'caches' => $project->caches()->latest('sent_at')->limit(5)->get(),
                'commands' => $project->commands()->latest('sent_at')->limit(5)->get(),
                'scheduled_tasks' => $project->scheduledTasks()->latest('sent_at')->limit(5)->get(),
                'health_checks' => $project->healthChecks()->latest('sent_at')->limit(5)->get(),
            ],
        ]);
    }

    public function update(UpdateProjectRequest $request, Project $project): RedirectResponse
    {
        $this->authorize('update', $project);

        $this->projectService->update($project, $request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Project updated.')]);

        return to_route('projects.show', $project);
    }

    public function rotateToken(Project $project): RedirectResponse
    {
        $this->authorize('update', $project);

        $plainToken = $this->projectService->rotateToken($project);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('API token regenerated.')]);

        return to_route('projects.show', $project)->with('projectCredentials', [
            'project_id' => $project->id,
            'project_uuid' => $project->project_uuid,
            'api_token' => $plainToken,
            'kind' => 'rotated',
        ]);
    }

    public function destroy(Project $project): RedirectResponse
    {
        $this->authorize('delete', $project);

        $this->projectService->delete($project);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Project removed.')]);

        return to_route('projects.index');
    }
}
