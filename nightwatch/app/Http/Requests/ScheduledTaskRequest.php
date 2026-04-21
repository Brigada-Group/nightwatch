<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ScheduledTaskRequest extends FormRequest
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
            'task' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:255'],
            'expression' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:completed,failed,skipped'],
            'duration_ms' => ['nullable', 'numeric'],
            'output' => ['nullable', 'string'],
            'sent_at' => ['required', 'date'],
        ];
    }
}
