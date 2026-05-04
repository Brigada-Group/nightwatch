<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AlertRule extends Model
{
    public const TYPE_ERROR_RATE = 'error_rate';
    public const TYPE_NEW_EXCEPTION_CLASS = 'new_exception_class';

    public const TYPES = [
        self::TYPE_ERROR_RATE,
        self::TYPE_NEW_EXCEPTION_CLASS,
    ];

    public const SEVERITIES = ['info', 'warning', 'critical'];

    protected $fillable = [
        'team_id',
        'project_id',
        'created_by',
        'name',
        'type',
        'params',
        'window_seconds',
        'cooldown_seconds',
        'severity',
        'is_enabled',
        'is_currently_firing',
        'last_fired_at',
        'last_resolved_at',
        'last_firing_id',
    ];

    protected function casts(): array
    {
        return [
            'params' => 'array',
            'is_enabled' => 'boolean',
            'is_currently_firing' => 'boolean',
            'last_fired_at' => 'datetime',
            'last_resolved_at' => 'datetime',
        ];
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function destinations(): HasMany
    {
        return $this->hasMany(AlertRuleDestination::class);
    }

    public function firings(): HasMany
    {
        return $this->hasMany(AlertRuleFiring::class);
    }
}
