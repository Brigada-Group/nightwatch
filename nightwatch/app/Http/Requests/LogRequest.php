<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LogRequest extends FormRequest
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
            'level' => ['required', 'string', 'in:emergency,alert,critical,error,warning'],
            'message' => ['required', 'string'],
            'channel' => ['nullable', 'string', 'max:255'],
            'context' => ['nullable', 'array'],
            'sent_at' => ['required', 'date'],
        ];
    }
}
