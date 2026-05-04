<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AlertRuleFiring extends Model
{
    protected $fillable = [
        'alert_rule_id',
        'fired_at',
        'resolved_at',
        'matched_count',
        'context',
        'notification_status',
    ];

    protected function casts(): array
    {
        return [
            'fired_at' => 'datetime',
            'resolved_at' => 'datetime',
            'context' => 'array',
            'notification_status' => 'array',
        ];
    }

    public function rule(): BelongsTo
    {
        return $this->belongsTo(AlertRule::class, 'alert_rule_id');
    }
}
