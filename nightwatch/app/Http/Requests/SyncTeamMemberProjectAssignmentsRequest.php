<?php

namespace App\Http\Requests;

use App\Services\CurrentTeam;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SyncTeamMemberProjectAssignmentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $team = app(CurrentTeam::class)->for($this->user());
        $teamId = $team?->id ?? 0;

        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'project_ids' => ['nullable', 'array'],
            'project_ids.*' => [
                'integer',
                Rule::exists('projects', 'id')->where('team_id', $teamId),
            ],
        ];
    }
}
