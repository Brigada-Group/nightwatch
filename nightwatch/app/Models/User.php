<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Paddle\Billable;
use Laravel\Paddle\Subscription;

#[Fillable(['name', 'email', 'password', 'is_super_admin'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use Billable, HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'is_super_admin' => 'boolean',
        ];
    }

    public function teamMemberships(): HasMany
    {
        return $this->hasMany(TeamMember::class);
    }

    public function teams(): BelongsToMany
    {
        return $this->belongsToMany(Team::class, 'team_members')
            ->withPivot(['role_id', 'status'])
            ->withTimestamps();
    }

    public function hasActiveSubscription(string $type = Subscription::DEFAULT_TYPE): bool
    {
        return $this->subscribed($type);
    }

    public function activeSubscription(string $type = Subscription::DEFAULT_TYPE): ?Subscription
    {
        $subscription = $this->subscription($type);

        return $subscription && $subscription->valid() ? $subscription : null;
    }

    public function currentSubscriptionSummary(string $type = Subscription::DEFAULT_TYPE): ?array
    {
        $subscription = $this->activeSubscription($type);

        if (! $subscription) {
            return null;
        }

        return [
            'type' => $subscription->type,
            'status' => $subscription->status,
            'price_ids' => $subscription->items()->pluck('price_id')->values()->all(),
            'ends_at' => optional($subscription->ends_at)?->toIso8601String(),
        ];
    }

    public function assignedProjects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_user_assignments')
            ->withPivot(['assigned_by'])
            ->withTimestamps();
    }

    public function isSuperAdmin(): bool
    {
        return (bool) $this->is_super_admin;
    }

    public function emailReports(): HasMany
    {
        return $this->hasMany(EmailReport::class, 'user_id');
    }
}
