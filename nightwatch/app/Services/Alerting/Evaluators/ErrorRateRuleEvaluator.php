<?php

namespace App\Services\Alerting\Evaluators;

use App\Models\AlertRule;
use App\Models\HubException;
use App\Services\Alerting\Contracts\RuleEvaluator;
use App\Services\Alerting\RuleEvaluationResult;
use Carbon\CarbonInterface;

/**
 * Fires when count(exceptions in window) exceeds threshold.
 *
 * Params:
 *   - threshold (int, required) — match if count > threshold
 *   - severity_filter (array, optional) — only count exceptions with these
 *     severities. Defaults to ['error', 'critical'] so warning-level noise
 *     doesn't trip incident-grade alerts.
 *
 * Window comes from rule->window_seconds (rule-level, not param-level, since
 * window is universal across rule types).
 */
class ErrorRateRuleEvaluator implements RuleEvaluator
{
    public function evaluate(AlertRule $rule, CarbonInterface $now): RuleEvaluationResult
    {
        $params = $rule->params ?? [];
        $threshold = (int) ($params['threshold'] ?? 0);

        if ($threshold <= 0) {
            return RuleEvaluationResult::noMatch();
        }

        $severityFilter = $params['severity_filter'] ?? ['error', 'critical'];
        $windowStart = $now->copy()->subSeconds($rule->window_seconds);

        $query = HubException::query()
            ->whereIn('project_id', $this->scopedProjectIds($rule))
            ->whereBetween('sent_at', [$windowStart, $now]);

        if (! empty($severityFilter)) {
            $query->whereIn('severity', $severityFilter);
        }

        $count = (int) $query->count();

        if ($count <= $threshold) {
            return RuleEvaluationResult::noMatch();
        }

        // Pull a small sample of recent exception ids so the firing context
        // can deep-link back to actual evidence. Caps at 5 so context json
        // doesn't grow unbounded.
        $sampleIds = $query
            ->orderByDesc('sent_at')
            ->limit(5)
            ->pluck('id')
            ->all();

        return RuleEvaluationResult::match($count, [
            'threshold' => $threshold,
            'window_seconds' => $rule->window_seconds,
            'severity_filter' => $severityFilter,
            'sample_exception_ids' => $sampleIds,
        ]);
    }

    /**
     * Project scope: explicit project if rule->project_id is set, otherwise
     * every project in the team.
     *
     * @return list<int>
     */
    private function scopedProjectIds(AlertRule $rule): array
    {
        if ($rule->project_id !== null) {
            return [$rule->project_id];
        }

        $rule->loadMissing('team');

        return $rule->team
            ? $rule->team->projects()->pluck('projects.id')->map(fn ($id) => (int) $id)->all()
            : [];
    }
}
