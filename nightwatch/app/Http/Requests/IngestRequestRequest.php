<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class IngestRequestRequest extends FormRequest
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
            'method' => ['required', 'string', 'max:10'],
            'uri' => ['required', 'string', 'max:2048'],
            'route_name' => ['nullable', 'string', 'max:255'],
            'status_code' => ['required', 'integer'],
            'duration_ms' => ['required', 'numeric'],
            'ip' => ['nullable', 'string', 'max:45'],
            'user_id' => ['nullable', 'integer'],
            'sent_at' => ['required', 'date'],
        ];
    }
}
