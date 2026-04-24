<?php

namespace App\Http\Controllers\Api\Ingest;

use App\Http\Controllers\Controller;
use App\Http\Requests\ClientErrorEventRequest;
use App\Models\Project;
use App\Services\ClientErrorIngestService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;

class IngestClientErrorController extends Controller
{
    public function __construct(
        private readonly ClientErrorIngestService $clientErrorIngestService,
    ) {}

    public function store(ClientErrorEventRequest $request): JsonResponse
    {
        $project = $request->input('_project');

        if (! $project instanceof Project) {
            return response()->json(['ok' => false, 'error' => 'Unauthorized'], 401);
        }

        try {
            $this->clientErrorIngestService->store(
                $project,
                $request->validated(),
                $request->all(),
            );
        } catch (AuthorizationException $exception) {
            return response()->json(['ok' => false, 'error' => 'project_mismatch'], 403);
        }

        return response()->json(['ok' => true]);
    }
}
