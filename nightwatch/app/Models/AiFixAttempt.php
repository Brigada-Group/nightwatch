<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class AiFixAttempt extends Model
{
    public const STATUS_QUEUED = 'queued';
    public const STATUS_RUNNING = 'running';
    public const STATUS_SUCCEEDED = 'succeeded';
    public const STATUS_FAILED = 'failed';

    public const ACTIVE_STATUSES = [
        self::STATUS_QUEUED,
        self::STATUS_RUNNING,
    ];

    protected $fillable = [
        'task_type',
        'task_id',
        'project_id',
        'requested_by_user_id',
        'status',
        'result',
        'error',
        'started_at',
        'completed_at',
        'applied_at',
        'apply_branch_name',
        'apply_commit_sha',
        'apply_pr_url',
        'apply_pr_number',
        'apply_error',
    ];

    protected function casts(): array
    {
        return [
            'result' => 'array',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'applied_at' => 'datetime',
        ];
    }

    public function task(): MorphTo
    {
        return $this->morphTo();
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_user_id');
    }

    public function isActive(): bool
    {
        return in_array($this->status, self::ACTIVE_STATUSES, true);
    }

    public function isApplied(): bool
    {
        return $this->applied_at !== null;
    }
}
