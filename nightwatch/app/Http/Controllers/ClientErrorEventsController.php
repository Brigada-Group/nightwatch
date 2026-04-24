<?php

namespace App\Http\Controllers;

use App\Http\Support\InertiaPaginator;
use App\Http\Support\ProjectFilterOptions;
use App\Models\ClientErrorEvent;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClientErrorEventsController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = (int) min(50, max(5, $request->integer('per_page', 15)));

        $query = ClientErrorEvent::query()
            ->with(['project:id,name,project_uuid'])
            ->orderByDesc('occurred_at');

        if ($request->filled('project_id')) {
            $project = Project::query()
                ->whereKey($request->integer('project_id'))
                ->first();

            if ($project !== null) {
                $query->where('project_id', $project->project_uuid);
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        if ($request->filled('severity')) {
            $query->where('severity', (string) $request->query('severity'));
        }

        if ($request->filled('runtime')) {
            $query->where('runtime', (string) $request->query('runtime'));
        }

        $paginator = $query->paginate($perPage)->withQueryString();

        return Inertia::render('client-errors/index', [
            'clientErrors' => InertiaPaginator::props($paginator),
            'filters' => [
                'project_id' => $request->filled('project_id') ? $request->integer('project_id') : null,
                'severity' => $request->filled('severity') ? (string) $request->query('severity') : null,
                'runtime' => $request->filled('runtime') ? (string) $request->query('runtime') : null,
            ],
            'projectOptions' => ProjectFilterOptions::all(),
        ]);
    }

    public function show(int $clientError): Response
    {
        $event = ClientErrorEvent::query()
            ->with(['project:id,name,project_uuid'])
            ->findOrFail($clientError);

        return Inertia::render('client-errors/show', [
            'event' => $event,
        ]);
    }
}
