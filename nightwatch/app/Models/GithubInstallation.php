<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GithubInstallation extends Model
{
    protected $fillable = [
        'team_id',
        'installed_by_user_id',
        'installation_id',
        'account_id',
        'account_login',
        'account_type',
        'target_type',
        'repository_selection',
        'permissions',
        'events',
        'access_token',
        'access_token_expires_at',
        'suspended_at',
    ];

    protected $hidden = [
        'access_token',
    ];

    protected function casts(): array
    {
        return [
            'permissions' => 'array',
            'events' => 'array',
            'access_token_expires_at' => 'datetime',
            'suspended_at' => 'datetime',
        ];
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function installedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'installed_by_user_id');
    }

    public function repositories(): HasMany
    {
        return $this->hasMany(GithubRepository::class);
    }
}
