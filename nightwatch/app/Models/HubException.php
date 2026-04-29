<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HubException extends Model
{
    public const TASK_STATUS_STARTED = 'started';
    public const TASK_STATUS_ONGOING = 'ongoing';
    public const TASK_STATUS_FINISHED = 'finished';

    public const TASK_STATUSES = [
        self::TASK_STATUS_STARTED,
        self::TASK_STATUS_ONGOING,
        self::TASK_STATUS_FINISHED,
    ];

    protected $fillable = [
        'project_id',
        'environment',
        'server',
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
    ];

    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
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
}
