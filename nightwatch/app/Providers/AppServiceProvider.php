<?php

namespace App\Providers;

use App\Listeners\SendEmailVerificationCodeOnLogin;
use App\Services\Ai\AiFixService;
use App\Services\Ai\OpenAiFixService;
use App\Services\Ai\PlaceholderAiFixService;
use App\Models\HubCache;
use App\Models\HubCommand;
use App\Models\HubException;
use App\Models\HubHealthCheck;
use App\Models\HubJob;
use App\Models\HubLog;
use App\Models\HubMail;
use App\Models\HubNotification;
use App\Models\HubOutgoingHttp;
use App\Models\HubQuery;
use App\Models\HubRequest;
use App\Models\HubScheduledTask;
use App\Models\Project;
use App\Models\User;
use App\Services\DashboardMetricsService;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Login;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    private const DASHBOARD_CACHE_WATCHED_MODELS = [
        HubException::class,
        HubRequest::class,
        HubJob::class,
        HubHealthCheck::class,
        HubLog::class,
        HubQuery::class,
        HubOutgoingHttp::class,
        HubMail::class,
        HubNotification::class,
        HubCache::class,
        HubCommand::class,
        HubScheduledTask::class,
        Project::class,
    ];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Use the real AI pipeline when the configured default provider has a
        // key set in config/ai.php; fall back to the placeholder so local dev
        // (and CI) still exercises the full end-to-end flow without needing
        // credentials. Whichever provider you put in `ai.default` (openai,
        // anthropic, gemini, etc.) is what gets used — provider switch is a
        // config change, not a code change.
        $this->app->bind(AiFixService::class, function ($app) {
            $defaultProvider = (string) config('ai.default', 'openai');
            $hasKey = (string) config('ai.providers.'.$defaultProvider.'.key', '') !== '';

            return $hasKey
                ? $app->make(OpenAiFixService::class)
                : $app->make(PlaceholderAiFixService::class);
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        Event::listen(Login::class, SendEmailVerificationCodeOnLogin::class);
        $this->registerDashboardCacheBusting();

        Gate::before(function (User $user, string $ability): ?bool {
            return $user->isSuperAdmin() ? true : null;
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }

    /**
     * Invalidate the dashboard overview cache whenever ingest data changes
     * so the dashboard reflects new events on the very next refetch.
     */
    protected function registerDashboardCacheBusting(): void
    {
        $bust = static function (): void {
            Cache::forget(DashboardMetricsService::CACHE_KEY);
        };

        foreach (self::DASHBOARD_CACHE_WATCHED_MODELS as $model) {
            /** @var class-string<Model> $model */
            $model::created($bust);
            $model::updated($bust);
        }
    }
}
