<?php

namespace App\Http\Middleware;

use App\Models\Project;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateGuardianClient
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        $projectId = $request->input('project_id');

        if (! $token || ! $projectId) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $project = Project::where('project_uuid', $projectId)
            ->where('api_token', $token)
            ->first();

        if (! $project) {
            return response()->json(['error' => 'Invalid credentials'], 403);
        }

        $request->merge(['_project' => $project]);

        return $next($request);
    }
}
