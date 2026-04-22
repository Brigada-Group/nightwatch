<?php

namespace App\Http\Requests;

use App\Models\EmailReport;
use DateTimeZone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmailReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email:rfc', 'max:190'],
            'frequency' => ['required', Rule::in(EmailReport::FREQUENCIES)],
            'timezone' => ['nullable', 'string', 'max:64', Rule::in(DateTimeZone::listIdentifiers())],
            'send_hour' => ['nullable', 'integer', 'between:0,23'],
            'send_day_of_week' => ['nullable', 'integer', 'between:0,6'],
            'send_day_of_month' => ['nullable', 'integer', 'between:1,28'],
            'project_scope' => ['required', Rule::in(['all', 'selected'])],
            'project_ids' => ['nullable', 'array'],
            'project_ids.*' => ['integer', 'exists:projects,id'],
            'sections' => ['nullable', 'array'],
            'sections.*' => ['string', Rule::in(EmailReport::DEFAULT_SECTIONS)],
            'enabled' => ['sometimes', 'boolean'],
        ];
    }
}
