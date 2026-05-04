<?php

namespace App\Http\Requests;

use App\Models\AlertRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAlertRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'type' => ['required', 'string', Rule::in(AlertRule::TYPES)],
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'window_seconds' => ['required', 'integer', 'min:60', 'max:86400'],
            'cooldown_seconds' => ['required', 'integer', 'min:60', 'max:86400'],
            'severity' => ['required', 'string', Rule::in(AlertRule::SEVERITIES)],
            'is_enabled' => ['nullable', 'boolean'],

            'params' => ['required', 'array'],
            'params.threshold' => ['required_if:type,error_rate', 'integer', 'min:1'],
            'params.severity_filter' => ['nullable', 'array'],
            'params.severity_filter.*' => ['string', 'max:20'],
            'params.class_pattern' => ['nullable', 'string', 'max:255'],

            'destination_webhook_ids' => ['nullable', 'array'],
            'destination_webhook_ids.*' => ['integer', 'exists:webhook_destinations,id'],

            'destination_emails' => ['nullable', 'array'],
            'destination_emails.*' => ['email', 'max:255'],
        ];
    }
}
