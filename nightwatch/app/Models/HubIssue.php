<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HubIssue extends Model
{
    public const SOURCE_SLOW_QUERY = 'slow_query';
    public const SOURCE_SLOW_REQUEST = 'slow_request';

    public const SOURCE_TYPES = [
        self::SOURCE_SLOW_QUERY,
        self::SOURCE_SLOW_REQUEST,
    ];

    public const TASK_STATUS_STARTED = 'started';
    public const TASK_STATUS_ONGOING = 'ongoing';
    public const TASK_STATUS_REVIEW = 'review';
    public const TASK_STATUS_FINISHED = 'finished';

    public const TASK_STATUSES = [
        self::TASK_STATUS_STARTED,
        self::TASK_STATUS_ONGOING,
        self::TASK_STATUS_REVIEW,
        self::TASK_STATUS_FINISHED,
    ];

    protected $fillable = [
        'project_id',
        'source_type',
        'source_id',
        'summary',
        'severity',
        'fingerprint',
        'is_recurrence',
        'original_issue_id',
        'recurrence_count',
        'first_seen_at',
        'last_seen_at',
        'assigned_to',
        'assigned_by',
        'assigned_at',
        'task_status',
        'task_finished_at',
    ];

    protected function casts(): array
    {
        return [
            'is_recurrence' => 'boolean',
            'first_seen_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'assigned_at' => 'datetime',
            'task_finished_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function originalIssue(): BelongsTo
    {
        return $this->belongsTo(HubIssue::class, 'original_issue_id');
    }
}
