<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAiConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'use_ai' => ['required', 'boolean'],
            'self_heal' => ['required', 'boolean'],
        ];
    }
}
