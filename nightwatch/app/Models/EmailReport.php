<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmailReport extends Model
{
    protected $table = 'email_details';

    public const FREQUENCIES = ['daily', 'weekly', 'monthly'];

    public const DEFAULT_SECTIONS = [
        'exceptions',
        'requests',
        'queries',
        'jobs',
        'audits',
        'health_checks',
        'outgoing_http',
    ];

    protected $fillable = [
        'user_id',
        'email',
        'frequency',
        'timezone',
        'send_hour',
        'send_day_of_week',
        'send_day_of_month',
        'project_scope',
        'project_ids',
        'sections',
        'enabled',
        'last_sent_at',
        'next_run_at',
    ];

    protected function casts(): array
    {
        return [
            'project_ids' => 'array',
            'sections' => 'array',
            'enabled' => 'boolean',
            'send_hour' => 'integer',
            'send_day_of_week' => 'integer',
            'send_day_of_month' => 'integer',
            'last_sent_at' => 'datetime',
            'next_run_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
