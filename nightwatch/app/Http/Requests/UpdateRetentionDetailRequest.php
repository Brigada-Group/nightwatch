<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRetentionDetailRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'is_enabled' => ['required', 'boolean'],
            'run_interval_days' => ['required', 'integer', 'min:1', 'max:365'],
            'retention_days' => ['required', 'integer', 'min:1', 'max:3650'],
        ];
    }
}
