<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class NpmAuditRequest extends FormRequest
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
            'total_vulnerabilities' => ['nullable', 'integer', 'min:0'],
            'info_count' => ['nullable', 'integer', 'min:0'],
            'low_count' => ['nullable', 'integer', 'min:0'],
            'moderate_count' => ['nullable', 'integer', 'min:0'],
            'high_count' => ['nullable', 'integer', 'min:0'],
            'critical_count' => ['nullable', 'integer', 'min:0'],
            'vulnerabilities' => ['nullable', 'array'],
            'audit_metadata' => ['nullable', 'array'],
            'sent_at' => ['required', 'date'],
        ];
    }
}
