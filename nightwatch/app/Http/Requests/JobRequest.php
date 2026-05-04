<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class JobRequest extends FormRequest
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
            'trace_id' => ['nullable', 'string', 'size:32', 'regex:/^[0-9a-f]{32}$/'],
            'job_class' => ['required', 'string', 'max:255'],
            'queue' => ['nullable', 'string', 'max:255'],
            'connection' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:completed,failed'],
            'duration_ms' => ['nullable', 'numeric'],
            'attempt' => ['nullable', 'integer'],
            'error_message' => ['nullable', 'string'],
            'metadata' => ['nullable', 'array'],
            'sent_at' => ['required', 'date'],
        ];
    }
}
