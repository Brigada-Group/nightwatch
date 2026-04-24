<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ClientErrorEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'project_id' => ['required', 'string'],
            'environment' => ['required', 'string', 'max:64'],
            'server' => ['required', 'string', 'max:255'],
            'sent_at' => ['required', 'date'],
            'runtime' => ['nullable', 'string', 'max:32'],
            'exception_class' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:2000'],
            'file' => ['nullable', 'string', 'max:2048'],
            'line' => ['nullable', 'integer'],
            'colno' => ['nullable', 'integer'],
            'url' => ['nullable', 'string', 'max:2048'],
            'status_code' => ['nullable', 'integer'],
            'ip' => ['nullable', 'string', 'max:45'],
            'headers' => ['nullable', 'string', 'max:8000'],
            'stack_trace' => ['nullable', 'string', 'max:32000'],
            'component_stack' => ['nullable', 'string', 'max:8000'],
            'severity' => ['nullable', 'string', 'max:32'],
            'created_at' => ['nullable'],
            'user_data' => ['nullable', 'array'],
            'user_payload' => ['nullable', 'array'],
            'user' => ['nullable', 'array'],
        ];
    }
}
