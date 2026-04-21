<?php

namespace App\Services;

use App\Models\Project;
use Illuminate\Support\Str;

class ProjectService
{
    /**
     * Create a monitored project and return the plain API token so the caller
     * can display it to the user once before it is no longer retrievable.
     *
     * @param  array{name: string, description?: string|null, environment?: string|null}  $data
     * @return array{project: Project, api_token: string}
     */
    public function create(array $data): array
    {
        $plainToken = $this->generateToken();

        $project = Project::create([
            'project_uuid' => (string) Str::uuid(),
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'environment' => $data['environment'] ?: 'production',
            'api_token' => $plainToken,
        ]);

        return [
            'project' => $project,
            'api_token' => $plainToken,
        ];
    }

    /**
     * @param  array{name: string, description?: string|null, environment?: string|null}  $data
     */
    public function update(Project $project, array $data): Project
    {
        $project->update([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'environment' => $data['environment'] ?: $project->environment,
        ]);

        return $project;
    }

    /**
     * Rotate the API token. Returns the new plain token so the caller can
     * show it once.
     */
    public function rotateToken(Project $project): string
    {
        $plainToken = $this->generateToken();

        $project->update(['api_token' => $plainToken]);

        return $plainToken;
    }

    public function delete(Project $project): void
    {
        $project->delete();
    }

    private function generateToken(): string
    {
        return Str::random(64);
    }
}
