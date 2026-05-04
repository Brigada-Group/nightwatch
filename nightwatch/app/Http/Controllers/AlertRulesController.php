<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAlertRuleRequest;
use App\Http\Requests\UpdateAlertRuleRequest;
use App\Models\AlertRule;
use App\Models\AlertRuleDestination;
use App\Models\AlertRuleFiring;
use App\Models\Project;
use App\Models\WebhookDestination;
use App\Services\CurrentTeam;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AlertRulesController extends Controller
{
    public function __construct(
        private readonly CurrentTeam $currentTeam,
    ) {}

    public function index(Request $request): Response
    {
        $team = $this->currentTeam->for($request->user());
        abort_unless($team !== null, 403);

        $rules = AlertRule::query()
            ->with(['project:id,name', 'destinations', 'destinations.webhookDestination:id,name,provider'])
            ->where('team_id', $team->id)
            ->orderByDesc('id')
            ->get();

        $recentFirings = AlertRuleFiring::query()
            ->whereIn('alert_rule_id', $rules->pluck('id')->all())
            ->with('rule:id,name,severity')
            ->orderByDesc('fired_at')
            ->limit(50)
            ->get();

        $projects = Project::query()
            ->where('team_id', $team->id)
            ->orderBy('name')
            ->get(['id', 'name']);

        $webhookDestinations = WebhookDestination::query()
            ->where('team_id', $team->id)
            ->where('enabled', true)
            ->orderBy('name')
            ->get(['id', 'name', 'provider']);

        return Inertia::render('alert-rules/index', [
            'rules' => $rules->map(fn (AlertRule $rule) => $this->serialize($rule))->all(),
            'recentFirings' => $recentFirings->map(fn (AlertRuleFiring $f) => [
                'id' => $f->id,
                'alert_rule_id' => $f->alert_rule_id,
                'rule_name' => $f->rule?->name,
                'severity' => $f->rule?->severity,
                'fired_at' => $f->fired_at?->toIso8601String(),
                'resolved_at' => $f->resolved_at?->toIso8601String(),
                'matched_count' => (int) $f->matched_count,
            ])->all(),
            'projects' => $projects,
            'webhookDestinations' => $webhookDestinations,
            'ruleTypes' => array_map(fn ($type) => [
                'value' => $type,
                'label' => $this->labelForType($type),
            ], AlertRule::TYPES),
            'severities' => AlertRule::SEVERITIES,
        ]);
    }

    public function store(StoreAlertRuleRequest $request): RedirectResponse
    {
        $team = $this->currentTeam->for($request->user());
        abort_unless($team !== null, 403);

        $data = $request->validated();
        $this->guardProjectScope($team, $data['project_id'] ?? null);

        DB::transaction(function () use ($team, $request, $data): void {
            $rule = AlertRule::create([
                'team_id' => $team->id,
                'project_id' => $data['project_id'] ?? null,
                'created_by' => $request->user()->id,
                'name' => $data['name'],
                'type' => $data['type'],
                'params' => $data['params'],
                'window_seconds' => (int) $data['window_seconds'],
                'cooldown_seconds' => (int) $data['cooldown_seconds'],
                'severity' => $data['severity'],
                'is_enabled' => (bool) ($data['is_enabled'] ?? true),
            ]);

            $this->syncDestinations(
                $rule,
                $team->id,
                $data['destination_webhook_ids'] ?? [],
                $data['destination_emails'] ?? [],
            );
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Alert rule created.')]);

        return to_route('alert-rules.index');
    }

    public function update(UpdateAlertRuleRequest $request, AlertRule $alertRule): RedirectResponse
    {
        $team = $this->currentTeam->for($request->user());
        abort_unless($team !== null, 403);
        abort_unless($alertRule->team_id === $team->id, 404);

        $data = $request->validated();
        $this->guardProjectScope($team, $data['project_id'] ?? null);

        DB::transaction(function () use ($alertRule, $team, $data): void {
            $alertRule->update([
                'project_id' => $data['project_id'] ?? null,
                'name' => $data['name'],
                'type' => $data['type'],
                'params' => $data['params'],
                'window_seconds' => (int) $data['window_seconds'],
                'cooldown_seconds' => (int) $data['cooldown_seconds'],
                'severity' => $data['severity'],
                'is_enabled' => (bool) ($data['is_enabled'] ?? true),
            ]);

            $this->syncDestinations(
                $alertRule,
                $team->id,
                $data['destination_webhook_ids'] ?? [],
                $data['destination_emails'] ?? [],
            );
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Alert rule updated.')]);

        return to_route('alert-rules.index');
    }

    public function destroy(Request $request, AlertRule $alertRule): RedirectResponse
    {
        $team = $this->currentTeam->for($request->user());
        abort_unless($team !== null, 403);
        abort_unless($alertRule->team_id === $team->id, 404);

        $alertRule->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Alert rule removed.')]);

        return to_route('alert-rules.index');
    }

    /**
     * Make sure that, when project_id is set, it actually belongs to the
     * actor's team. Otherwise an attacker who guesses ids could attach a
     * rule to a project in someone else's team.
     */
    private function guardProjectScope($team, ?int $projectId): void
    {
        if ($projectId === null) {
            return;
        }

        $belongs = Project::query()
            ->whereKey($projectId)
            ->where('team_id', $team->id)
            ->exists();

        abort_unless($belongs, 422, __('That project does not belong to this team.'));
    }

    /**
     * Replace the rule's destinations with the given webhook ids + emails.
     * Webhooks are validated to belong to the team to prevent cross-team
     * referencing; emails are validated by the FormRequest.
     *
     * @param  list<int>  $webhookIds
     * @param  list<string>  $emails
     */
    private function syncDestinations(AlertRule $rule, int $teamId, array $webhookIds, array $emails): void
    {
        $rule->destinations()->delete();

        $validWebhookIds = WebhookDestination::query()
            ->whereIn('id', $webhookIds)
            ->where('team_id', $teamId)
            ->pluck('id')
            ->all();

        foreach ($validWebhookIds as $id) {
            AlertRuleDestination::create([
                'alert_rule_id' => $rule->id,
                'destination_type' => AlertRuleDestination::TYPE_WEBHOOK,
                'webhook_destination_id' => $id,
            ]);
        }

        // Dedupe + lowercase normalize so re-saves don't fan out to a
        // doubled inbox.
        $normalizedEmails = array_values(array_unique(array_map(
            fn ($e) => strtolower(trim((string) $e)),
            $emails,
        )));

        foreach ($normalizedEmails as $email) {
            if ($email === '') continue;

            AlertRuleDestination::create([
                'alert_rule_id' => $rule->id,
                'destination_type' => AlertRuleDestination::TYPE_EMAIL,
                'email' => $email,
            ]);
        }
    }

    private function serialize(AlertRule $rule): array
    {
        return [
            'id' => $rule->id,
            'name' => $rule->name,
            'type' => $rule->type,
            'type_label' => $this->labelForType($rule->type),
            'params' => $rule->params,
            'window_seconds' => (int) $rule->window_seconds,
            'cooldown_seconds' => (int) $rule->cooldown_seconds,
            'severity' => $rule->severity,
            'is_enabled' => (bool) $rule->is_enabled,
            'is_currently_firing' => (bool) $rule->is_currently_firing,
            'last_fired_at' => $rule->last_fired_at?->toIso8601String(),
            'last_resolved_at' => $rule->last_resolved_at?->toIso8601String(),
            'project' => $rule->project
                ? ['id' => $rule->project->id, 'name' => $rule->project->name]
                : null,
            'destinations' => $rule->destinations->map(fn (AlertRuleDestination $d) => [
                'id' => $d->id,
                'destination_type' => $d->destination_type,
                'email' => $d->email,
                'webhook' => $d->webhookDestination
                    ? [
                        'id' => $d->webhookDestination->id,
                        'name' => $d->webhookDestination->name,
                        'provider' => $d->webhookDestination->provider,
                    ]
                    : null,
            ])->values()->all(),
        ];
    }

    private function labelForType(string $type): string
    {
        return match ($type) {
            AlertRule::TYPE_ERROR_RATE => 'Error rate threshold',
            AlertRule::TYPE_NEW_EXCEPTION_CLASS => 'New exception class detected',
            default => $type,
        };
    }
}
