<?php

namespace App\Services;

use App\Models\AiConfig;
use App\Models\Project;
use App\Models\Team;

/**
 * Per-project accessor for AI configuration. There is exactly one row per
 * project in `ai_configs`; the service hides that detail and lazily creates
 * the row with safe defaults the first time a project's config is read so the
 * page never has to special-case a missing config.
 */
class AiConfigService
{
    public function forProject(Project $project): AiConfig
    {
        return AiConfig::query()->firstOrCreate(
            ['project_id' => $project->id],
            ['use_ai' => false, 'self_heal' => false],
        );
    }

    /**
     * Resolve every project owned by the team along with its current AI
     * config, ready for direct serialization to the page. Configs are
     * lazily created for projects that don't have one yet so the page
     * always renders a complete row per project.
     *
     * The returned `uuid` matches the Project model's route key, so the
     * frontend can construct PATCH URLs that bind cleanly on the backend.
     *
     * @return list<array{
     *     project: array{id: int, uuid: string, name: string, environment: string|null},
     *     config: array{use_ai: bool, self_heal: bool}
     * }>
     */
    public function forTeamProjects(Team $team): array
    {
        $projects = $team->projects()->orderBy('name')->get();

        return $projects->map(function (Project $project): array {
            $config = $this->forProject($project);

            return [
                'project' => [
                    'id' => $project->id,
                    'uuid' => $project->project_uuid,
                    'name' => $project->name,
                    'environment' => $project->environment,
                ],
                'config' => [
                    'use_ai' => $config->use_ai,
                    'self_heal' => $config->self_heal,
                ],
            ];
        })->all();
    }

    /**
     * @param  array{use_ai: bool, self_heal: bool}  $data
     */
    public function update(Project $project, array $data): AiConfig
    {
        $config = $this->forProject($project);
        $config->update($data);

        return $config->refresh();
    }
}
