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
            // Optional: the SDK includes this on the heartbeat right after
            // the user runs `php artisan guardian:verify <token>` to wrap
            // up the setup ceremony.
            'verification_token' => ['nullable', 'string', 'size:6', 'regex:/^[0-9]{6}$/'],
        ];
    }
}
