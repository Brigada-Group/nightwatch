<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    /**
     * @var list<string>
     */
    protected $hidden = [
        'api_token',
    ];

    /**
     * @var list<string>
     */
    protected $appends = [
        'api_token_last_four',
        'connection_status',
    ];

    /**
     * Connection status thresholds — drive the live badge on the project
     * pages. Past CONNECTED_THRESHOLD = stale; past STALE_THRESHOLD = lost.
     */
    public const CONNECTED_THRESHOLD_SECONDS = 300;   // 5 minutes
    public const STALE_THRESHOLD_SECONDS = 3600;      // 1 hour

    public const STATUS_CONNECTED = 'connected';
    public const STATUS_STALE = 'stale';
    public const STATUS_LOST = 'lost';
    public const STATUS_DISCONNECTED = 'disconnected';

    protected $fillable = [
        'team_id',
        'project_uuid',
        'name',
        'description',
        'api_token',
        'environment',
        'status',
        'last_heartbeat_at',
        'metadata',
        'verified_at',
        'verify_token',
        'verify_token_expires_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'last_heartbeat_at' => 'datetime',
            'verified_at' => 'datetime',
            'verify_token_expires_at' => 'datetime',
        ];
    }

    /**
     * Live connection status derived from last_heartbeat_at. Verified-once
     * is a separate concept (verified_at) — that's a setup confirmation
     * marker, while this is the moment-to-moment health.
     */
    public function connectionStatus(): string
    {
        if ($this->last_heartbeat_at === null) {
            return self::STATUS_DISCONNECTED;
        }

        $age = $this->last_heartbeat_at->diffInSeconds(now());

        if ($age <= self::CONNECTED_THRESHOLD_SECONDS) {
            return self::STATUS_CONNECTED;
        }

        if ($age <= self::STALE_THRESHOLD_SECONDS) {
            return self::STATUS_STALE;
        }

        return self::STATUS_LOST;
    }

    public function getRouteKeyName(): string
    {
        return 'project_uuid';
    }

    /**
     * Old-style accessor so Eloquent resolves `connection_status` from the
     * $appends list. Can't use the new Attribute::get() pattern here
     * because the camelCase method name (connectionStatus) is already taken
     * by the public method that does the actual computation.
     */
    public function getConnectionStatusAttribute(): string
    {
        return $this->connectionStatus();
    }

    protected function apiTokenLastFour(): Attribute
    {
        return Attribute::get(function (): ?string {
            $token = $this->attributes['api_token'] ?? null;

            if (! is_string($token) || strlen($token) < 4) {
                return null;
            }

            return substr($token, -4);
        });
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function exceptions(): HasMany
    {
        return $this->hasMany(HubException::class);
    }

    public function requests(): HasMany
    {
        return $this->hasMany(HubRequest::class);
    }

    public function queries(): HasMany
    {
        return $this->hasMany(HubQuery::class);
    }

    public function jobs(): HasMany
    {
        return $this->hasMany(HubJob::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(HubLog::class);
    }

    public function outgoingHttp(): HasMany
    {
        return $this->hasMany(HubOutgoingHttp::class);
    }

    public function mails(): HasMany
    {
        return $this->hasMany(HubMail::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(HubNotification::class);
    }

    public function caches(): HasMany
    {
        return $this->hasMany(HubCache::class);
    }

    public function commands(): HasMany
    {
        return $this->hasMany(HubCommand::class);
    }

    public function scheduledTasks(): HasMany
    {
        return $this->hasMany(HubScheduledTask::class);
    }

    public function healthChecks(): HasMany
    {
        return $this->hasMany(HubHealthCheck::class);
    }

    public function composerAudits(): HasMany
    {
        return $this->hasMany(HubComposerAudit::class);
    }

    public function npmAudits(): HasMany
    {
        return $this->hasMany(HubNpmAudit::class);
    }

    public function assignees(): BelongsToMany 
    {
        return $this->belongsToMany(User::class, 'project_user_assignments')
            ->withPivot(['assigned_by'])
            ->withTimestamps();
    }

    
}
