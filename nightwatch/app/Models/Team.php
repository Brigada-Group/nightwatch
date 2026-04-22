<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Team extends Model
{
    //

    protected $fillable = [
        'team_uuid',
        'name',
        'slug',
        'description',
        'admin_id'
    ];

    protected static function booted(): void
    {
        static::creating(function (Team $team): void {
            if(empty($team->team_uuid)) {
                $team->team_uuid = (string) Str::uuid();
            }
        });

        static::created(function (Team $team): void {
            $adminRole = Role::where('slug',Role::ADMIN)->first();

            if ($adminRole !== null) {
                $team->members()->create([
                    'user_id' => $team->admin_id,
                    'role_id' => $adminRole->id,
                    'status' => TeamMember::STATUS_ACCEPTED,
                    'invited_by' => $team->admin_id,
                    'invited_at' => now(),
                    'accepted_at' => now()
                ]);
            }
        });
    }

    public function admin(): BelongsTo 
    {
        return $this->belongsTo(User::class,'admin_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(TeamMember::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'team_members')
            ->withPivot(['role_id', 'status'])
            ->withTimestamps();
    }
}
