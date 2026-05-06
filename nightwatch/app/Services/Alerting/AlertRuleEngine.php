<?php

namespace App\Services\Alerting;

use App\Mail\AlertRuleFiringMail;
use App\Models\AlertRule;
use App\Models\AlertRuleDestination;
use App\Models\AlertRuleFiring;
use App\Services\WebhookDispatcherService;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Owns the state machine + delivery for one rule. Called from
 * EvaluateAlertRulesCommand once per minute per enabled rule.
 *
 * State transitions (sticky firing):
 *   not_firing + match     → FIRE   (insert firing row, dispatch destinations)
 *   firing     + match     → noop   (already firing — don't re-notify)
 *   firing     + no match  → RESOLVE (close firing row)
 *   not_firing + no match  → noop
 *
 * Cooldown: a rule cannot transition not_firing → firing within
 * cooldown_seconds of its last_resolved_at. This prevents flapping.
 */
class AlertRuleEngine
{
    public function __construct(
        private readonly RuleEvaluatorRegistry $registry,
        private readonly WebhookDispatcherService $webhooks,
    ) {}

    public function tick(AlertRule $rule, ?CarbonInterface $now = null): void
    {
        $now ??= Carbon::now();

        try {
            $evaluator = $this->registry->for($rule->type);
        } catch (\Throwable $e) {
            Log::warning('AlertRuleEngine: unknown rule type', [
                'rule_id' => $rule->id,
                'type' => $rule->type,
            ]);
            return;
        }

        $result = $evaluator->evaluate($rule, $now);

        if ($result->matched && ! $rule->is_currently_firing) {
            if ($this->isInCooldown($rule, $now)) {
                return;
            }
            $this->fire($rule, $result, $now);
            return;
        }

        if (! $result->matched && $rule->is_currently_firing) {
            $this->resolve($rule, $now);
            return;
        }

        // matched + already_firing → sticky (no-op).
        // not_matched + not_firing → nothing to do.
    }

    private function isInCooldown(AlertRule $rule, CarbonInterface $now): bool
    {
        if ($rule->last_resolved_at === null) {
            return false;
        }

        return $rule->last_resolved_at->copy()
            ->addSeconds($rule->cooldown_seconds)
            ->isAfter($now);
    }

    private function fire(AlertRule $rule, RuleEvaluationResult $result, CarbonInterface $now): void
    {
        $firing = null;

        DB::transaction(function () use ($rule, $result, $now, &$firing): void {
            $firing = AlertRuleFiring::create([
                'alert_rule_id' => $rule->id,
                'fired_at' => $now,
                'matched_count' => $result->matchedCount,
                'context' => $result->context,
            ]);

            $rule->forceFill([
                'is_currently_firing' => true,
                'last_fired_at' => $now,
                'last_firing_id' => $firing->id,
            ])->save();
        });

        $deliveryStatus = $this->dispatch($rule, $firing, $result);

        // Persist a per-destination summary on the firing row so the UI can
        // show "1 of 2 webhooks failed" without re-querying receivers.
        $firing->forceFill(['notification_status' => $deliveryStatus])->save();
    }

    private function resolve(AlertRule $rule, CarbonInterface $now): void
    {
        DB::transaction(function () use ($rule, $now): void {
            if ($rule->last_firing_id !== null) {
                AlertRuleFiring::query()
                    ->whereKey($rule->last_firing_id)
                    ->update(['resolved_at' => $now]);
            }

            $rule->forceFill([
                'is_currently_firing' => false,
                'last_resolved_at' => $now,
            ])->save();
        });
    }

    /**
     * Fan out to every destination on the rule. Each delivery is independent
     * — one failed webhook doesn't block the others. Returns an array keyed
     * by destination id with success/error info for the firing row.
     *
     * @return array<int, array<string, mixed>>
     */
    private function dispatch(AlertRule $rule, AlertRuleFiring $firing, RuleEvaluationResult $result): array
    {
        $rule->loadMissing(['destinations.webhookDestination', 'team', 'project']);

        $payload = $this->buildPayload($rule, $firing, $result);
        $eventId = (string) Str::uuid();
        $eventType = "alert.{$rule->type}.fired";
        $status = [];

        foreach ($rule->destinations as $destination) {
            /** @var AlertRuleDestination $destination */
            $status[$destination->id] = match ($destination->destination_type) {
                AlertRuleDestination::TYPE_WEBHOOK => $this->dispatchWebhook(
                    $destination, $eventType, $eventId, $payload,
                ),
                AlertRuleDestination::TYPE_EMAIL => $this->dispatchEmail(
                    $destination, $rule, $firing,
                ),
                default => [
                    'type' => $destination->destination_type,
                    'sent' => false,
                    'reason' => 'unsupported_destination_type',
                ],
            };
        }

        return $status;
    }

    private function dispatchWebhook(
        AlertRuleDestination $destination,
        string $eventType,
        string $eventId,
        array $payload,
    ): array {
        $webhook = $destination->webhookDestination;
        if ($webhook === null || ! $webhook->enabled) {
            return [
                'type' => 'webhook',
                'sent' => false,
                'reason' => 'webhook_missing_or_disabled',
            ];
        }

        try {
            $delivered = $this->webhooks->deliver($webhook, $eventType, $eventId, $payload);
            return [
                'type' => 'webhook',
                'sent' => $delivered,
                'webhook_destination_id' => $webhook->id,
            ];
        } catch (\Throwable $e) {
            report($e);
            return [
                'type' => 'webhook',
                'sent' => false,
                'webhook_destination_id' => $webhook->id,
                'error' => $e->getMessage(),
            ];
        }
    }

    private function dispatchEmail(
        AlertRuleDestination $destination,
        AlertRule $rule,
        AlertRuleFiring $firing,
    ): array {
        $email = (string) $destination->email;

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return [
                'type' => 'email',
                'sent' => false,
                'email' => $email,
                'reason' => 'invalid_email',
            ];
        }

        try {
            Mail::to($email)->send(new AlertRuleFiringMail($rule, $firing));
            return [
                'type' => 'email',
                'sent' => true,
                'email' => $email,
            ];
        } catch (\Throwable $e) {
            report($e);
            return [
                'type' => 'email',
                'sent' => false,
                'email' => $email,
                'error' => $e->getMessage(),
            ];
        }
    }

    private function buildPayload(AlertRule $rule, AlertRuleFiring $firing, RuleEvaluationResult $result): array
    {
        $occurredAt = optional($firing->fired_at)->toIso8601String() ?? now()->toIso8601String();

        return [
            'event_type' => "alert.{$rule->type}.fired",
            // The Slack + Discord formatters look at project.environment, so
            // surface it from the scoped project (or null for team-wide).
            'project' => [
                'id' => $rule->project?->id,
                'name' => $rule->project?->name ?? 'All projects in team',
                'environment' => $rule->project?->environment,
            ],
            'team' => $rule->team
                ? ['id' => $rule->team->id, 'name' => $rule->team->name]
                : null,
            // Slack + Discord read message/severity/occurred_at from data.*
            // Generic-webhook consumers also benefit from having every
            // evaluator-specific datum here in one flat object.
            'data' => array_merge([
                'message' => $rule->name.' — '.$this->humanSummary($rule, $result),
                'severity' => $rule->severity,
                'occurred_at' => $occurredAt,
                'rule_id' => $rule->id,
                'rule_name' => $rule->name,
                'rule_type' => $rule->type,
                'matched_count' => $result->matchedCount,
                'window_seconds' => $rule->window_seconds,
                'firing_id' => $firing->id,
            ], $result->context),
            'occurred_at' => $occurredAt,
            'guardian_url' => config('app.url'),
        ];
    }

    /**
     * Type-specific one-liner used as the Slack/Discord description and the
     * fallback for any consumer that wants a human-readable summary.
     */
    private function humanSummary(AlertRule $rule, RuleEvaluationResult $result): string
    {
        $context = $result->context;

        return match ($rule->type) {
            AlertRule::TYPE_ERROR_RATE => sprintf(
                '%d error%s in last %ds (threshold %s)',
                $result->matchedCount,
                $result->matchedCount === 1 ? '' : 's',
                $rule->window_seconds,
                (string) ($context['threshold'] ?? '?'),
            ),
            AlertRule::TYPE_NEW_EXCEPTION_CLASS => sprintf(
                '%d new exception class%s detected in last %ds',
                $result->matchedCount,
                $result->matchedCount === 1 ? '' : 'es',
                $rule->window_seconds,
            ),
            default => sprintf('%d match(es)', $result->matchedCount),
        };
    }
}
