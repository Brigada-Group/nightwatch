<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class QueryRequest extends FormRequest
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
            'sql' => ['required', 'string'],
            'duration_ms' => ['required', 'numeric'],
            'connection' => ['nullable', 'string', 'max:255'],
            'file' => ['nullable', 'string', 'max:255'],
            'line' => ['nullable', 'integer'],
            'is_slow' => ['nullable', 'boolean'],
            'is_n_plus_one' => ['nullable', 'boolean'],
            'metadata' => ['nullable', 'array'],
            'sent_at' => ['required', 'date'],
        ];
    }
}
