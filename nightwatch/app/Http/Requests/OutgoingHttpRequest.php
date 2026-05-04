<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OutgoingHttpRequest extends FormRequest
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
            'method' => ['required', 'string', 'max:10'],
            'url' => ['required', 'string', 'max:2048'],
            'host' => ['required', 'string', 'max:255'],
            'status_code' => ['nullable', 'integer'],
            'duration_ms' => ['nullable', 'numeric'],
            'failed' => ['nullable', 'boolean'],
            'error_message' => ['nullable', 'string'],
            'sent_at' => ['required', 'date'],
        ];
    }
}
