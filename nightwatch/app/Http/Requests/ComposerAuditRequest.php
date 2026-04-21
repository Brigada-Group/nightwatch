<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ComposerAuditRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'environment' => ['required', 'string', 'max:50'],
            'server' => ['required', 'string', 'max:255'],
            'advisories_count' => ['nullable', 'integer', 'min:0'],
            'abandoned_count' => ['nullable', 'integer', 'min:0'],
            'advisories' => ['nullable', 'array'],
            'abandoned' => ['nullable', 'array'],
            'sent_at' => ['required', 'date'],
        ];
    }
}
