<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class HeartbeatRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'php_version' => ['required', 'string', 'max:50'],
            'laravel_version' => ['required', 'string', 'max:50'],
        ];
    }
}
