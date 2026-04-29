<?php

namespace App\Http\Requests;

use App\Services\CurrentTeam;
use App\Services\TeamInvitationLinkService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTeamInvitationLinkRequest extends FormRequest
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
            'role_slug' => ['required', 'string', Rule::in(TeamInvitationLinkService::ALLOWED_ROLE_SLUGS)],
            'expires_in_days' => ['nullable', 'integer', 'min:1', 'max:'.TeamInvitationLinkService::MAX_EXPIRES_DAYS],
            'max_uses' => ['nullable', 'integer', 'min:1', 'max:10000'],
            'project_ids' => ['nullable', 'array'],
            'project_ids.*' => [
                'integer',
                Rule::exists('projects', 'id')->where('team_id', $teamId),
            ],
            'notify_emails' => ['nullable', 'array', 'max:50'],
            'notify_emails.*' => ['email', 'max:255'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (! $this->has('expires_in_days') || $this->input('expires_in_days') === null) {
            $this->merge([
                'expires_in_days' => TeamInvitationLinkService::DEFAULT_EXPIRES_DAYS,
            ]);
        }
    }
}
