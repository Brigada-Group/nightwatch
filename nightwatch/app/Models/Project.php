<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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
    ];

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
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'last_heartbeat_at' => 'datetime',
        ];
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
}
