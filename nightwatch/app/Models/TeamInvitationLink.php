<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeamInvitationLink extends Model
{
    /** @var list<string> */
    protected $hidden = [
        'token_hash',
        'token_cipher',
    ];

    /** @var list<string> */
    protected $appends = [
        'join_url',
    ];

    protected $fillable = [
        'team_id',
        'role_id',
        'created_by',
        'project_ids',
        'token_hash',
        'token_cipher',
        'token_prefix',
        'max_uses',
        'uses_count',
        'revoked_at',
        'last_used_at',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'project_ids' => 'array',
            'revoked_at' => 'datetime',
            'last_used_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Full join URL for admins (plain token is only recoverable from encrypted storage).
     */
    protected function joinUrl(): Attribute
    {
        return Attribute::get(function (): ?string {
            if ($this->token_cipher === null) {
                return null;
            }

            try {
                $plain = decrypt($this->token_cipher);

                return url('/join/'.$plain);
            } catch (\Throwable) {
                return null;
            }
        });
    }

    public function isRevoked(): bool
    {
        return $this->revoked_at !== null;
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function hasUsesRemaining(): bool
    {
        if ($this->max_uses === null) {
            return true;
        }

        return $this->uses_count < $this->max_uses;
    }

    public function isUsable(): bool
    {
        return ! $this->isRevoked()
            && ! $this->isExpired()
            && $this->hasUsesRemaining();
    }
}
