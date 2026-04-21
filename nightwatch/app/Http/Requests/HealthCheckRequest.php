<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class HealthCheckRequest extends FormRequest
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
            'checks' => ['required', 'array', 'min:1'],
            'checks.*.name' => ['required', 'string', 'max:255'],
            'checks.*.status' => ['required', 'string', 'in:ok,warning,critical,error'],
            'checks.*.message' => ['nullable', 'string'],
            'checks.*.metadata' => ['nullable', 'array'],
            'sent_at' => ['required', 'date'],
        ];
    }
}
