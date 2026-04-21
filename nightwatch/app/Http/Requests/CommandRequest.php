<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CommandRequest extends FormRequest
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
            'command' => ['required', 'string', 'max:255'],
            'exit_code' => ['nullable', 'integer'],
            'duration_ms' => ['nullable', 'numeric'],
            'sent_at' => ['required', 'date'],
        ];
    }
}
