<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WebhookDestination extends Model
{
    public const PROVIDER_GENERIC = 'generic';

    public const PROVIDER_SLACK = 'slack';

    public const PROVIDER_DISCORD = 'discord';

    protected $fillable = [
        'team_id',
        'created_by',
        'name',
        'provider',
        'url',
        'secret',
        'enabled',
        'subscribed_events',
        'filters',
        'last_tested_at',
        'last_test_status',
        'last_test_error',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'subscribed_events' => 'array',
            'filters' => 'array',
            'last_tested_at' => 'datetime',
        ];
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(WebhookDelivery::class, 'destination_id');
    }

    public function listensTo(string $eventType): bool
    {
        $events = $this->subscribed_events ?? [];

        return in_array($eventType, $events, true);
    }
}
