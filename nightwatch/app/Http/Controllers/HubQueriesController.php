<?php

namespace App\Http\Controllers;

use App\Http\Support\InertiaPaginator;
use App\Http\Support\ProjectFilterOptions;
use App\Models\HubQuery;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HubQueriesController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = (int) min(50, max(5, $request->integer('per_page', 15)));

        $query = HubQuery::query()
            ->with(['project:id,name'])
            ->orderByDesc('sent_at');

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->integer('project_id'));
        }

        if ($request->boolean('slow_only')) {
            $query->where('is_slow', true);
        }

        $paginator = $query->paginate($perPage)->withQueryString();

        return Inertia::render('queries/index', [
            'queries' => InertiaPaginator::props($paginator),
            'filters' => [
                'project_id' => $request->filled('project_id') ? $request->integer('project_id') : null,
                'slow_only' => $request->boolean('slow_only'),
            ],
            'projectOptions' => ProjectFilterOptions::all(),
        ]);
    }
}
