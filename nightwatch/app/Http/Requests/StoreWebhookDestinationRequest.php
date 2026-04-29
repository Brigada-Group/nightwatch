<?php

namespace App\Http\Requests;

use App\Models\WebhookDestination;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWebhookDestinationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'provider' => ['required', Rule::in([
                WebhookDestination::PROVIDER_GENERIC,
                WebhookDestination::PROVIDER_SLACK,
                WebhookDestination::PROVIDER_DISCORD,
            ])],
            'url' => ['required', 'url', 'max:2048'],
            'secret' => ['nullable', 'string', 'max:255'],
            'enabled' => ['sometimes', 'boolean'],
            'subscribed_events' => ['required', 'array', 'min:1'],
            'subscribed_events.*' => ['string', 'max:80'],
            'filters' => ['nullable', 'array'],
            'filters.environments' => ['nullable', 'array'],
            'filters.environments.*' => ['string', 'max:64'],
            'filters.project_ids' => ['nullable', 'array'],
            'filters.project_ids.*' => ['integer'],
        ];
    }
}
