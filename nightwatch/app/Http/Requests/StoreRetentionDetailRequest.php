<?php

namespace App\Http\Requests;

use App\Models\RetentionDetail;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRetentionDetailRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'table_name' => [
                'required',
                'string',
                Rule::in(RetentionDetail::supportedTables()),
                Rule::unique('retention_details', 'table_name'),
            ],
            'is_enabled' => ['required', 'boolean'],
            'run_interval_days' => ['required', 'integer', 'min:1', 'max:365'],
            'retention_days' => ['required', 'integer', 'min:1', 'max:3650'],
        ];
    }
}
