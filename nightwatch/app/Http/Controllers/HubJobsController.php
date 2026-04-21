<?php

namespace App\Http\Controllers;

use App\Http\Support\InertiaPaginator;
use App\Http\Support\ProjectFilterOptions;
use App\Models\HubJob;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HubJobsController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = (int) min(50, max(5, $request->integer('per_page', 15)));

        $query = HubJob::query()
            ->with(['project:id,name'])
            ->orderByDesc('sent_at');

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->integer('project_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', (string) $request->query('status'));
        }

        $paginator = $query->paginate($perPage)->withQueryString();

        return Inertia::render('jobs/index', [
            'jobs' => InertiaPaginator::props($paginator),
            'filters' => [
                'project_id' => $request->filled('project_id') ? $request->integer('project_id') : null,
                'status' => $request->filled('status') ? (string) $request->query('status') : null,
            ],
            'projectOptions' => ProjectFilterOptions::all(),
        ]);
    }
}
