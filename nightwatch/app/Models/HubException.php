<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class HubException extends Model
{
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
        'environment',
        'server',
        'trace_id',
        'exception_class',
        'message',
        'file',
        'line',
        'url',
        'status_code',
        'user',
        'ip',
        'headers',
        'stack_trace',
        'severity',
        'sent_at',
        'assigned_to',
        'assigned_by',
        'assigned_at',
        'task_status',
        'task_finished_at',
        'fingerprint',
        'is_recurrence',
        'original_exception_id',
        'recurrence_count'
    ];

    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
            'assigned_at' => 'datetime',
            'task_finished_at' => 'datetime',
            'is_recurrence' => 'boolean'
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

    public function originalException(): BelongsTo
    {
        return $this->belongsTo(HubException::class,'original_exception_id');
    }

    public function aiFixAttempts(): MorphMany
    {
        return $this->morphMany(AiFixAttempt::class, 'task');
    }

    public function latestAiFixAttempt(): MorphOne
    {
        return $this->morphOne(AiFixAttempt::class, 'task')->latestOfMany();
    }
}
