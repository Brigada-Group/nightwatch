<?php

namespace App\Services;

use App\Models\HubException;
use App\Models\HubLog;
use App\Models\HubQuery;
use App\Models\HubRequest;
use App\Models\Project;
use App\Models\RetentionCleanupRun;
use App\Models\RetentionDetail;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use App\Models\WebhookDelivery;
use App\Models\WebhookDestination;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Laravel\Paddle\Cashier;
use Laravel\Paddle\Subscription;
use Laravel\Paddle\Transaction as PaddleTransaction;

class SuperAdminPlatformService
{
    /**
     * @return array{
     *     platform: array{
     *         total_users: int, total_teams: int, total_projects: int, telemetry_events_24h: int,
     *         webhook_deliveries_24h: int, webhook_failures_24h: int
     *     }
     * }
     */
    public function dashboardOverview(): array
    {
        $since24h = now()->subDay();

        $globalTelemetry
            = HubException::query()->where('sent_at', '>=', $since24h)->count()
            + HubLog::query()->where('sent_at', '>=', $since24h)->count()
            + HubQuery::query()->where('sent_at', '>=', $since24h)->count()
            + HubRequest::query()->where('sent_at', '>=', $since24h)->count()
            + DB::table('client_error_events')
                ->where('occurred_at', '>=', $since24h)
                ->count();

        $webhookDestIds = WebhookDestination::query()->pluck('id');
        $webhookDeliveries = $webhookDestIds->isNotEmpty()
            ? WebhookDelivery::query()
                ->whereIn('destination_id', $webhookDestIds)
                ->where('created_at', '>=', $since24h)
                ->count()
            : 0;
        $webhookFailures = $webhookDestIds->isNotEmpty()
            ? WebhookDelivery::query()
                ->whereIn('destination_id', $webhookDestIds)
                ->where('created_at', '>=', $since24h)
                ->whereNotNull('failed_at')
                ->count()
            : 0;

        return [
            'platform' => [
                'total_users' => User::query()->count(),
                'total_teams' => Team::query()->count(),
                'total_projects' => Project::query()->count(),
                'telemetry_events_24h' => (int) $globalTelemetry,
                'webhook_deliveries_24h' => (int) $webhookDeliveries,
                'webhook_failures_24h' => (int) $webhookFailures,
            ],
        ];
    }

    /**
     * @return array{ teams: list<array<string, mixed>> }
     */
    public function teamsDirectory(): array
    {
        return [
            'teams' => $this->teamDirectoryRows(),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function teamDirectoryRows(): array
    {
        $since24h = now()->subDay();
        $teamActivity = $this->teamActivityBySince($since24h);

        $teams = Team::query()
            ->withCount([
                'projects',
                'members as accepted_members_count' => function (Builder $q): void {
                    $q->where('status', TeamMember::STATUS_ACCEPTED);
                },
            ])
            ->orderByDesc('created_at')
            ->get();

        $adminIds = $teams->pluck('admin_id')->unique()->values()->all();
        $subscriptions = $this->defaultSubscriptionsByAdminIds($adminIds);
        $spendLabels = $this->spendLabelByUserIds($adminIds);

        return $teams->map(function (Team $team) use ($teamActivity, $subscriptions, $spendLabels) {
            $t = (int) $team->id;
            $a = $teamActivity[$t] ?? $this->emptyTeamActivity();
            $total = $a['requests'] + $a['logs'] + $a['queries'] + $a['exceptions'] + $a['client_errors'];
            $sub = $subscriptions->get((int) $team->admin_id);

            return [
                'id' => $team->id,
                'name' => $team->name,
                'team_uuid' => $team->team_uuid,
                'slug' => $team->slug,
                'created_at' => $team->created_at?->toIso8601String(),
                'project_count' => $team->projects_count,
                'member_count' => $team->accepted_members_count,
                'activity' => $a,
                'activity_total' => $total,
                'subscription_status' => $sub?->status,
                'lifetime_spend_label' => $spendLabels[(int) $team->admin_id] ?? '—',
            ];
        })->values()->all();
    }

    /**
     * @return array{
     *     team: array<string, mixed>, counts: array{members: int, projects: int},
     *     billing_admin: array{id: int, name: string, email: string}|null,
     *     subscription: array<string, mixed>|null, spend: list<array{currency: string, formatted: string}>,
     *     activity: array{last_24h: array, last_7d: array}
     * }
     */
    public function teamDetailPayload(Team $team): array
    {
        $since24h = now()->subDay();
        $since7d = now()->subDays(7);

        $team->loadCount([
            'projects',
            'webhookDestinations',
            'members as accepted_members_count' => function (Builder $q): void {
                $q->where('status', TeamMember::STATUS_ACCEPTED);
            },
        ]);

        $admin = $team->admin()->select('id', 'name', 'email')->first();
        $subscription = $admin?->currentSubscriptionSummary();

        $spend = $this->spendTiersByUserId((int) $team->admin_id);
        $destinationIds = WebhookDestination::query()
            ->where('team_id', $team->id)
            ->pluck('id');

        $teamId = (int) $team->id;

        return [
            'team' => [
                'id' => $team->id,
                'name' => $team->name,
                'team_uuid' => $team->team_uuid,
                'slug' => $team->slug,
                'description' => $team->description,
                'created_at' => $team->created_at?->toIso8601String(),
                'updated_at' => $team->updated_at?->toIso8601String(),
            ],
            'counts' => [
                'members' => $team->accepted_members_count,
                'projects' => $team->projects_count,
                'webhook_destinations' => $team->webhook_destinations_count,
            ],
            'billing_admin' => $admin
                ? [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                ]
                : null,
            'subscription' => $subscription,
            'spend' => $spend,
            'activity' => [
                'last_24h' => $this->activityForTeamId($teamId, $since24h, $destinationIds),
                'last_7d' => $this->activityForTeamId($teamId, $since7d, $destinationIds),
            ],
        ];
    }

    /**
     * @return array{
     *     retention_details: \Illuminate\Database\Eloquent\Collection<int, RetentionDetail>,
     *     available_tables: list<string>, retention_runs: \Illuminate\Database\Eloquent\Collection<int, RetentionCleanupRun>
     * }
     */
    public function retentionConfigPayload(): array
    {
        $instances = RetentionDetail::query()
            ->instances()
            ->orderBy('table_name')
            ->get(['id', 'table_name', 'is_enabled', 'run_interval_days', 'retention_days']);

        $configuredTables = $instances->pluck('table_name')->all();

        return [
            'retention_details' => $instances,
            'available_tables' => array_values(array_diff(RetentionDetail::supportedTables(), $configuredTables)),
            'retention_runs' => RetentionCleanupRun::query()
                ->orderBy('cleanup_key')
                ->get(['cleanup_key', 'last_ran_at', 'last_deleted_rows', 'last_retention_days', 'notes']),
        ];
    }

    public function createRetentionDetail(array $attributes): void
    {
        RetentionDetail::query()->create($attributes);
    }

    public function updateRetentionDetail(RetentionDetail $retentionDetail, array $attributes): void
    {
        abort_unless(in_array($retentionDetail->table_name, RetentionDetail::supportedTables(), true), 404);

        $retentionDetail->update($attributes);
    }

    public function deleteRetentionDetail(RetentionDetail $retentionDetail): void
    {
        abort_unless(in_array($retentionDetail->table_name, RetentionDetail::supportedTables(), true), 404);

        $retentionDetail->delete();
    }

    /**
     * @return array<int, array{
     *     requests: int, logs: int, queries: int, exceptions: int, client_errors: int,
     *     webhook_deliveries: int, webhook_failures: int
     * }>
     */
    public function teamActivityBySince(\DateTimeInterface $since): array
    {
        $ids = Team::pluck('id')->all();
        $out = [];
        foreach ($ids as $id) {
            $out[(int) $id] = $this->emptyTeamActivity();
        }

        $merge = function (string $table, string $timeColumn, string $key) use ($since, &$out): void {
            $rows = DB::table($table)
                ->join('projects', 'projects.id', '=', "{$table}.project_id")
                ->where("{$table}.{$timeColumn}", '>=', $since)
                ->groupBy('projects.team_id')
                ->selectRaw('projects.team_id as team_id, count(*) as c')
                ->get();
            foreach ($rows as $row) {
                $tid = (int) $row->team_id;
                if (isset($out[$tid])) {
                    $out[$tid][$key] = (int) $row->c;
                }
            }
        };

        $merge('hub_requests', 'sent_at', 'requests');
        $merge('hub_logs', 'sent_at', 'logs');
        $merge('hub_queries', 'sent_at', 'queries');
        $merge('hub_exceptions', 'sent_at', 'exceptions');
        $merge('client_error_events', 'occurred_at', 'client_errors');

        $deliveryRows = DB::table('webhook_deliveries')
            ->join('webhook_destinations', 'webhook_destinations.id', '=', 'webhook_deliveries.destination_id')
            ->where('webhook_deliveries.created_at', '>=', $since)
            ->groupBy('webhook_destinations.team_id')
            ->selectRaw('webhook_destinations.team_id as team_id, count(*) as c')
            ->get();
        foreach ($deliveryRows as $row) {
            $tid = (int) $row->team_id;
            if (isset($out[$tid])) {
                $out[$tid]['webhook_deliveries'] = (int) $row->c;
            }
        }

        $failRows = DB::table('webhook_deliveries')
            ->join('webhook_destinations', 'webhook_destinations.id', '=', 'webhook_deliveries.destination_id')
            ->where('webhook_deliveries.created_at', '>=', $since)
            ->whereNotNull('webhook_deliveries.failed_at')
            ->groupBy('webhook_destinations.team_id')
            ->selectRaw('webhook_destinations.team_id as team_id, count(*) as c')
            ->get();
        foreach ($failRows as $row) {
            $tid = (int) $row->team_id;
            if (isset($out[$tid])) {
                $out[$tid]['webhook_failures'] = (int) $row->c;
            }
        }

        return $out;
    }

    /**
     * @return array{
     *     requests: int, logs: int, queries: int, exceptions: int, client_errors: int,
     *     webhook_deliveries: int, webhook_failures: int
     * }
     */
    private function activityForTeamId(int $teamId, \DateTimeInterface $since, Collection $destinationIds): array
    {
        $act = $this->emptyTeamActivity();
        $projectIds = Project::query()->where('team_id', $teamId)->pluck('id');

        if ($projectIds->isEmpty()) {
            return $act;
        }

        $act['requests'] = HubRequest::query()
            ->whereIn('project_id', $projectIds)
            ->where('sent_at', '>=', $since)
            ->count();
        $act['logs'] = HubLog::query()
            ->whereIn('project_id', $projectIds)
            ->where('sent_at', '>=', $since)
            ->count();
        $act['queries'] = HubQuery::query()
            ->whereIn('project_id', $projectIds)
            ->where('sent_at', '>=', $since)
            ->count();
        $act['exceptions'] = HubException::query()
            ->whereIn('project_id', $projectIds)
            ->where('sent_at', '>=', $since)
            ->count();
        $act['client_errors'] = DB::table('client_error_events')
            ->whereIn('project_id', $projectIds)
            ->where('occurred_at', '>=', $since)
            ->count();

        if ($destinationIds->isNotEmpty()) {
            $act['webhook_deliveries'] = WebhookDelivery::query()
                ->whereIn('destination_id', $destinationIds)
                ->where('created_at', '>=', $since)
                ->count();
            $act['webhook_failures'] = WebhookDelivery::query()
                ->whereIn('destination_id', $destinationIds)
                ->where('created_at', '>=', $since)
                ->whereNotNull('failed_at')
                ->count();
        }

        return $act;
    }

    /**
     * @return array{requests: int, logs: int, queries: int, exceptions: int, client_errors: int, webhook_deliveries: int, webhook_failures: int}
     */
    public function emptyTeamActivity(): array
    {
        return [
            'requests' => 0,
            'logs' => 0,
            'queries' => 0,
            'exceptions' => 0,
            'client_errors' => 0,
            'webhook_deliveries' => 0,
            'webhook_failures' => 0,
        ];
    }

    /**
     * @param  list<int>  $adminIds
     * @return Collection<int, Subscription>
     */
    private function defaultSubscriptionsByAdminIds(array $adminIds)
    {
        if ($adminIds === []) {
            return collect();
        }

        return Subscription::query()
            ->without('items')
            ->select(['id', 'status', 'billable_id', 'type'])
            ->where('billable_type', User::class)
            ->whereIn('billable_id', $adminIds)
            ->where('type', Subscription::DEFAULT_TYPE)
            ->orderByDesc('id')
            ->get()
            ->unique('billable_id')
            ->keyBy('billable_id');
    }

    /**
     * @param  list<int>  $userIds
     * @return array<int, string>
     */
    private function spendLabelByUserIds(array $userIds): array
    {
        if ($userIds === []) {
            return [];
        }

        $byUserCurrency = PaddleTransaction::query()
            ->where('billable_type', User::class)
            ->whereIn('billable_id', $userIds)
            ->whereIn('status', [PaddleTransaction::STATUS_PAID, PaddleTransaction::STATUS_COMPLETED, 'billed'])
            ->get(['billable_id', 'total', 'currency'])
            ->groupBy('billable_id');

        $out = [];
        foreach ($byUserCurrency as $userId => $txs) {
            $byCurrency = [];
            foreach ($txs as $t) {
                $c = strtoupper($t->currency);
                $byCurrency[$c] = ($byCurrency[$c] ?? 0) + (int) $t->total;
            }
            $parts = [];
            foreach ($byCurrency as $currency => $amountMinor) {
                $parts[] = Cashier::formatAmount((string) $amountMinor, $currency);
            }
            $out[(int) $userId] = $parts === [] ? '—' : implode(' · ', $parts);
        }

        return $out;
    }

    /**
     * @return list<array{ currency: string, formatted: string }>
     */
    private function spendTiersByUserId(int $userId): array
    {
        $byCurrency = [];

        $txs = PaddleTransaction::query()
            ->where('billable_type', User::class)
            ->where('billable_id', $userId)
            ->whereIn('status', [PaddleTransaction::STATUS_PAID, PaddleTransaction::STATUS_COMPLETED, 'billed'])
            ->get(['total', 'currency']);

        foreach ($txs as $t) {
            $c = strtoupper($t->currency);
            $byCurrency[$c] = ($byCurrency[$c] ?? 0) + (int) $t->total;
        }

        $rows = [];

        foreach ($byCurrency as $currency => $amountMinor) {
            $rows[] = [
                'currency' => $currency,
                'formatted' => Cashier::formatAmount((string) $amountMinor, $currency),
            ];
        }

        if ($rows !== []) {
            usort($rows, fn (array $a, array $b) => $a['currency'] <=> $b['currency']);
        }

        return $rows;
    }
}
