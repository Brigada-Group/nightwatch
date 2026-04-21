<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CacheRequest extends FormRequest
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
            'store' => ['required', 'string', 'max:255'],
            'hits' => ['required', 'integer'],
            'misses' => ['required', 'integer'],
            'writes' => ['required', 'integer'],
            'forgets' => ['required', 'integer'],
            'hit_rate' => ['nullable', 'numeric'],
            'period_start' => ['nullable', 'date'],
            'sent_at' => ['required', 'date'],
        ];
    }
}
