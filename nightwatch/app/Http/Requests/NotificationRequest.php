<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class NotificationRequest extends FormRequest
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
            'trace_id' => ['nullable', 'string', 'size:32', 'regex:/^[0-9a-f]{32}$/'],
            'notification_class' => ['required', 'string', 'max:255'],
            'channel' => ['required', 'string', 'max:255'],
            'notifiable_type' => ['required', 'string', 'max:255'],
            'notifiable_id' => ['nullable', 'integer'],
            'status' => ['required', 'string', 'in:sent,failed'],
            'error_message' => ['nullable', 'string'],
            'sent_at' => ['required', 'date'],
        ];
    }
}
