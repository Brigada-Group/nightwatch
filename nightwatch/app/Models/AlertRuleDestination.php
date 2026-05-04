<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AlertRuleDestination extends Model
{
    public const TYPE_WEBHOOK = 'webhook';
    public const TYPE_EMAIL = 'email';
    public const TYPE_IN_APP = 'in-app';

    protected $fillable = [
        'alert_rule_id',
        'destination_type',
        'webhook_destination_id',
        'email',
    ];

    public function rule(): BelongsTo
    {
        return $this->belongsTo(AlertRule::class, 'alert_rule_id');
    }

    public function webhookDestination(): BelongsTo
    {
        return $this->belongsTo(WebhookDestination::class);
    }
}
