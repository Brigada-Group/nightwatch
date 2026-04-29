<?php

namespace App\Models;

use App\Services\EmailVerificationCodeService;
use Database\Factories\UserFactory;
use Illuminate\Auth\MustVerifyEmail as MustVerifyEmailTrait;
use Illuminate\Contracts\Auth\MustVerifyEmail;
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
#[Hidden([
    'password',
    'two_factor_secret',
    'two_factor_recovery_codes',
    'remember_token',
    'email_verification_code_hash',
])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use Billable, HasFactory, MustVerifyEmailTrait, Notifiable, TwoFactorAuthenticatable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'email_verification_code_sent_at' => 'datetime',
            'email_verification_code_expires_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'is_super_admin' => 'boolean',
        ];
    }

    public function sendEmailVerificationNotification(): void
    {
        app(EmailVerificationCodeService::class)->issueAndSend($this);
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
