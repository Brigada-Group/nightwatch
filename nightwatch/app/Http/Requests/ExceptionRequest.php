<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ExceptionRequest extends FormRequest
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
            'exception_class' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string'],
            'file' => ['nullable', 'string', 'max:255'],
            'line' => ['nullable', 'integer'],
            'url' => ['nullable', 'string', 'max:2048'],
            'status_code' => ['nullable', 'integer'],
            'user' => ['nullable', 'string', 'max:255'],
            'ip' => ['nullable', 'string', 'max:45'],
            'headers' => ['nullable', 'string'],
            'stack_trace' => ['nullable', 'string'],
            'severity' => ['nullable', 'string', 'in:error,warning,info,debug,critical'],
            'sent_at' => ['required', 'date'],
        ];
    }
}
