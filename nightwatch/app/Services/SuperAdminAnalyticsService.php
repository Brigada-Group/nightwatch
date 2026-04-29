<?php

namespace App\Services;

use App\Models\HubException;
use App\Models\HubLog;
use App\Models\HubOutgoingHttp;
use App\Models\HubQuery;
use App\Models\HubRequest;
use App\Models\PlatformMetricSnapshot;
use App\Models\Project;
use App\Models\Team;
use App\Models\User;
use App\Models\WebhookDelivery;
use App\Models\WebhookDestination;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Laravel\Paddle\Subscription;
use Laravel\Paddle\Transaction as PaddleTransaction;

class SuperAdminAnalyticsService
{
    public function __construct(
        private SuperAdminPlatformService $platform,
    ) {}

    public function dashboardAnalytics(): array
    {
        Cache::remember('super_admin:platform_snapshots:'.now()->format('Y-m-d-H'), 3600, function (): int {
            $this->recordDailySnapshots();

            return 1;
        });

        return [
            'growth' => $this->growthData(),
            'growing_factor' => $this->growingFactor(),
            'database_footprint' => $this->databaseFootprint(),
            'feature_adoption' => $this->featureAdoption(),
            'team_activity' => $this->teamActivityBreakdown(),
        ];
    }

    public function externalDependenciesPayload(): array
    {
        $since24h = now()->subDay();
        $since7d = now()->subDays(7);
        $since30d = now()->subDays(30);

        $destIds = WebhookDestination::query()->pluck('id');
        $webhook = [
            'destinations_count' => WebhookDestination::query()->count(),
            'deliveries_24h' => $destIds->isNotEmpty()
                ? WebhookDelivery::query()->whereIn('destination_id', $destIds)->where('created_at', '>=', $since24h)->count()
                : 0,
            'failures_24h' => $destIds->isNotEmpty()
                ? WebhookDelivery::query()->whereIn('destination_id', $destIds)->where('created_at', '>=', $since24h)->whereNotNull('failed_at')->count()
                : 0,
            'deliveries_7d' => $destIds->isNotEmpty()
                ? WebhookDelivery::query()->whereIn('destination_id', $destIds)->where('created_at', '>=', $since7d)->count()
                : 0,
        ];

        $outgoing = [
            'count_24h' => HubOutgoingHttp::query()->where('sent_at', '>=', $since24h)->count(),
            'count_7d' => HubOutgoingHttp::query()->where('sent_at', '>=', $since7d)->count(),
            'failed_24h' => HubOutgoingHttp::query()->where('sent_at', '>=', $since24h)->where('failed', true)->count(),
            'avg_ms_24h' => round(
                (float) (HubOutgoingHttp::query()->where('sent_at', '>=', $since24h)->avg('duration_ms') ?? 0),
                2,
            ),
        ];

        $subs = [
            'by_status' => Subscription::query()
                ->selectRaw('status, count(*) as c')
                ->where('type', Subscription::DEFAULT_TYPE)
                ->groupBy('status')
                ->pluck('c', 'status')
                ->all(),
        ];

        $paddle = [
            'transactions_30d' => PaddleTransaction::query()
                ->whereIn('status', [PaddleTransaction::STATUS_PAID, PaddleTransaction::STATUS_COMPLETED, 'billed'])
                ->where('billed_at', '>=', $since30d)
                ->count(),
            'last_billed_at' => optional(
                PaddleTransaction::query()
                    ->whereIn('status', [PaddleTransaction::STATUS_PAID, PaddleTransaction::STATUS_COMPLETED, 'billed'])
                    ->orderByDesc('billed_at')
                    ->first()
            )?->billed_at?->toIso8601String(),
            'api_instrumented' => false,
            'api_note' => 'Outbound calls to the Paddle API are not logged yet. Add middleware or a wrapper to record latency and error rates.',
        ];

        return [
            'webhook' => $webhook,
            'outgoing_http' => $outgoing,
            'subscriptions' => $subs,
            'paddle' => $paddle,
        ];
    }

    public function recordDailySnapshots(): void
    {
        $day = now()->toDateString();

        $telemetryRows = $this->estimateTelemetryRowTotal();

        $dbBytes = $this->resolveDatabaseFileSizeBytes();

        $rows = [
            [PlatformMetricSnapshot::USERS, (float) User::query()->count()],
            [PlatformMetricSnapshot::TEAMS, (float) Team::query()->count()],
            [PlatformMetricSnapshot::PROJECTS, (float) Project::query()->count()],
            [PlatformMetricSnapshot::DB_BYTES, (float) $dbBytes],
            [PlatformMetricSnapshot::TELEMETRY_ROWS, (float) $telemetryRows],
        ];

        $now = now();
        $payload = [];

        foreach ($rows as [$key, $value]) {
            $payload[] = [
                'recorded_on' => $day,
                'metric_key' => $key,
                'value' => (string) $value,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // Single upsert avoids UNIQUE races (concurrent requests) and SQLite date / cast mismatches in updateOrCreate lookups.
        PlatformMetricSnapshot::upsert(
            $payload,
            ['recorded_on', 'metric_key'],
            ['value', 'updated_at'],
        );
    }

    private function estimateTelemetryRowTotal(): int
    {
        return (int) Cache::remember('super_admin:telemetry_row_estimate', 300, function (): int {
            return HubRequest::query()->count()
                + HubLog::query()->count()
                + HubQuery::query()->count()
                + HubException::query()->count()
                + (int) DB::table('client_error_events')->count();
        });
    }

    private function resolveDatabaseFileSizeBytes(): int
    {
        $connection = config('database.default');
        if ($connection === 'sqlite') {
            $path = (string) config('database.connections.sqlite.database');
            if ($path === ':memory:') {
                return 0;
            }
            if (str_starts_with($path, '/')) {
                $full = $path;
            } else {
                $full = base_path($path);
            }
            if (is_file($full)) {
                $size = filesize($full);

                return $size !== false ? (int) $size : 0;
            }
        }

        if ($connection === 'mysql' || $connection === 'mariadb') {
            $row = DB::selectOne(
                'select sum(data_length + index_length) as s from information_schema.tables where table_schema = database()',
            );

            return (int) ($row->s ?? 0);
        }

        return 0;
    }

    /**
     * @return array{series: list<array{date: string, users: int, teams: int, projects: int}>, has_sparse_history: bool}
     */
    private function growthData(): array
    {
        $from = now()->subDays(30)->toDateString();
        $raw = PlatformMetricSnapshot::query()
            ->where('recorded_on', '>=', $from)
            ->orderBy('recorded_on')
            ->get(['recorded_on', 'metric_key', 'value']);

        $byDate = [];
        foreach ($raw as $row) {
            $d = $row->recorded_on->format('Y-m-d');
            if (! isset($byDate[$d])) {
                $byDate[$d] = [PlatformMetricSnapshot::USERS => null, PlatformMetricSnapshot::TEAMS => null, PlatformMetricSnapshot::PROJECTS => null];
            }
            $k = (string) $row->metric_key;
            if (in_array($k, [PlatformMetricSnapshot::USERS, PlatformMetricSnapshot::TEAMS, PlatformMetricSnapshot::PROJECTS], true)) {
                $byDate[$d][$k] = (int) round((float) $row->value);
            }
        }
        ksort($byDate);

        $series = [];
        foreach ($byDate as $date => $vals) {
            $series[] = [
                'date' => $date,
                'users' => (int) ($vals[PlatformMetricSnapshot::USERS] ?? 0),
                'teams' => (int) ($vals[PlatformMetricSnapshot::TEAMS] ?? 0),
                'projects' => (int) ($vals[PlatformMetricSnapshot::PROJECTS] ?? 0),
            ];
        }

        if ($series === []) {
            $series[] = [
                'date' => now()->toDateString(),
                'users' => User::query()->count(),
                'teams' => Team::query()->count(),
                'projects' => Project::query()->count(),
            ];
        }

        return [
            'series' => $series,
            'has_sparse_history' => count($series) < 3,
        ];
    }

    /**
     * @return array{value: float, label: string, teams_wow: float|null, users_wow: float|null}
     */
    private function growingFactor(): array
    {
        $now = now()->toDateString();
        $weekAgo = now()->subDays(7)->toDateString();

        $tNow = (float) $this->snapshotValue($now, PlatformMetricSnapshot::TEAMS);
        $tWas = (float) $this->snapshotValue($weekAgo, PlatformMetricSnapshot::TEAMS);
        $uNow = (float) $this->snapshotValue($now, PlatformMetricSnapshot::USERS);
        $uWas = (float) $this->snapshotValue($weekAgo, PlatformMetricSnapshot::USERS);

        $teamsWow = $tWas > 0 ? round(100.0 * ($tNow - $tWas) / $tWas, 1) : null;
        $usersWow = $uWas > 0 ? round(100.0 * ($uNow - $uWas) / $uWas, 1) : null;

        $momentum = 0.0;
        $n = 0;
        if ($teamsWow !== null) {
            $momentum += $teamsWow;
            $n++;
        }
        if ($usersWow !== null) {
            $momentum += $usersWow;
            $n++;
        }
        $value = $n > 0 ? round($momentum / $n, 1) : 0.0;

        return [
            'value' => $value,
            'label' => '7d momentum (avg % change for teams + users, from daily snapshots)',
            'teams_wow' => $teamsWow,
            'users_wow' => $usersWow,
        ];
    }

    private function snapshotValue(string $date, string $key): float
    {
        $v = PlatformMetricSnapshot::query()
            ->whereDate('recorded_on', $date)
            ->where('metric_key', $key)
            ->value('value');

        if ($v === null) {
            return (float) match ($key) {
                PlatformMetricSnapshot::USERS => User::query()->count(),
                PlatformMetricSnapshot::TEAMS => Team::query()->count(),
                PlatformMetricSnapshot::PROJECTS => Project::query()->count(),
                default => 0,
            };
        }

        return (float) $v;
    }

    /**
     * @return array{database_bytes: int, database_bytes_label: string, telemetry_rows: int, telemetry_rows_trend: list<array{date: string, value: int}>}
     */
    private function databaseFootprint(): array
    {
        $bytes = (int) $this->resolveDatabaseFileSizeBytes();
        if ($bytes === 0) {
            $v = (float) $this->snapshotValue(now()->toDateString(), PlatformMetricSnapshot::DB_BYTES);
            $bytes = (int) $v;
        }

        $telemetry = $this->estimateTelemetryRowTotal();
        $from = now()->subDays(30)->toDateString();
        $trend = PlatformMetricSnapshot::query()
            ->where('metric_key', PlatformMetricSnapshot::TELEMETRY_ROWS)
            ->where('recorded_on', '>=', $from)
            ->orderBy('recorded_on')
            ->get()
            ->map(fn ($r) => [
                'date' => $r->recorded_on->format('Y-m-d'),
                'value' => (int) round((float) $r->value),
            ])
            ->values()
            ->all();

        if ($trend === []) {
            $trend[] = [
                'date' => now()->toDateString(),
                'value' => $telemetry,
            ];
        }

        return [
            'database_bytes' => $bytes,
            'database_bytes_label' => $this->formatBytes($bytes),
            'telemetry_rows' => $telemetry,
            'telemetry_rows_trend' => $trend,
        ];
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes < 1024) {
            return $bytes.' B';
        }
        if ($bytes < 1024 * 1024) {
            return round($bytes / 1024, 1).' KB';
        }
        if ($bytes < 1024 * 1024 * 1024) {
            return round($bytes / (1024 * 1024), 1).' MB';
        }

        return round($bytes / (1024 * 1024 * 1024), 2).' GB';
    }

    /**
     * @return array{
     *     team_total: int,
     *     teams_with_webhooks: int,
     *     teams_with_email_reports: int,
     *     webhooks_percent: float,
     *     email_reports_percent: float
     * }
     */
    private function featureAdoption(): array
    {
        $total = Team::query()->count();
        if ($total === 0) {
            return [
                'team_total' => 0,
                'teams_with_webhooks' => 0,
                'teams_with_email_reports' => 0,
                'webhooks_percent' => 0.0,
                'email_reports_percent' => 0.0,
            ];
        }

        $withWebhooks = Team::query()
            ->whereHas('webhookDestinations')
            ->count();

        $withEmail = Team::query()
            ->whereHas('users', function ($q): void {
                $q->whereHas('emailReports', function ($e): void {
                    $e->where('enabled', true);
                });
            })
            ->count();

        return [
            'team_total' => $total,
            'teams_with_webhooks' => $withWebhooks,
            'teams_with_email_reports' => $withEmail,
            'webhooks_percent' => round(100.0 * $withWebhooks / $total, 1),
            'email_reports_percent' => round(100.0 * $withEmail / $total, 1),
        ];
    }

    /**
     * @return array{
     *     active_7d: int, inactive_7d: int, never_active_7d: int, top: list<array{id: int, name: string, total: int}>, dormant: list<array{id: int, name: string, created_at: string|null}>
     * }
     */
    private function teamActivityBreakdown(): array
    {
        $since = now()->subDays(7);
        $map = $this->platform->teamActivityBySince($since);
        $active = 0;
        $inactive = 0;
        $totals = [];

        foreach (Team::query()->get(['id', 'name', 'created_at']) as $team) {
            $tid = (int) $team->id;
            $a = $map[$tid] ?? $this->platform->emptyTeamActivity();
            $t = (int) ($a['requests'] + $a['logs'] + $a['queries'] + $a['exceptions'] + $a['client_errors']);
            $totals[$tid] = $t;
            if ($t > 0) {
                $active++;
            } else {
                if ($team->created_at && $team->created_at->lt($since)) {
                    $inactive++;
                }
            }
        }

        arsort($totals);
        $top = [];
        $i = 0;
        foreach ($totals as $tid => $v) {
            if ($i >= 6) {
                break;
            }
            if ($v <= 0) {
                break;
            }
            $t = Team::query()->find($tid);
            if ($t) {
                $top[] = ['id' => (int) $t->id, 'name' => $t->name, 'total' => (int) $v];
            }
            $i++;
        }

        $dormant = Team::query()
            ->where('created_at', '<', $since)
            ->get(['id', 'name', 'created_at'])
            ->filter(function (Team $t) use ($map): bool {
                $a = $map[(int) $t->id] ?? $this->platform->emptyTeamActivity();
                $n = (int) ($a['requests'] + $a['logs'] + $a['queries'] + $a['exceptions'] + $a['client_errors']);

                return $n === 0;
            })
            ->take(8)
            ->map(fn (Team $t) => [
                'id' => (int) $t->id,
                'name' => $t->name,
                'created_at' => $t->created_at?->toIso8601String(),
            ])
            ->values()
            ->all();

        $newTeamsInWindow = Team::query()
            ->where('created_at', '>=', $since)
            ->count();
        $newTeamsWithNoIngest = 0;
        foreach (Team::query()->where('created_at', '>=', $since)->get(['id']) as $t) {
            $a = $map[(int) $t->id] ?? $this->platform->emptyTeamActivity();
            if (((int) ($a['requests'] + $a['logs'] + $a['queries'] + $a['exceptions'] + $a['client_errors'])) === 0) {
                $newTeamsWithNoIngest++;
            }
        }

        return [
            'active_7d' => $active,
            'inactive_7d' => $inactive,
            'never_active_7d' => $newTeamsWithNoIngest,
            'new_teams_7d' => $newTeamsInWindow,
            'top' => $top,
            'dormant' => $dormant,
        ];
    }
}
