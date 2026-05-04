<?php

namespace App\Services\Alerting\Evaluators;

use App\Models\AlertRule;
use App\Models\HubException;
use App\Services\Alerting\Contracts\RuleEvaluator;
use App\Services\Alerting\RuleEvaluationResult;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;

/**
 * Fires when an exception_class appears in the window that has NEVER
 * appeared before in this project (lifetime first-occurrence).
 *
 * Params:
 *   - class_pattern (string, optional) — if set, only consider classes
 *     matching this LIKE pattern (e.g. "App\\Exceptions\\%"). Use "%" for
 *     wildcard. Defaults to no filter (alert on any new class).
 *
 * Implementation: find distinct exception_class values inside the window,
 * then for each one check whether ANY exception of that class exists in the
 * project BEFORE the window. The classes that fail that check are "new".
 */
class NewExceptionClassRuleEvaluator implements RuleEvaluator
{
    public function evaluate(AlertRule $rule, CarbonInterface $now): RuleEvaluationResult
    {
        $params = $rule->params ?? [];
        $pattern = $params['class_pattern'] ?? null;
        $windowStart = $now->copy()->subSeconds($rule->window_seconds);

        $projectIds = $this->scopedProjectIds($rule);
        if ($projectIds === []) {
            return RuleEvaluationResult::noMatch();
        }

        $candidateQuery = HubException::query()
            ->select('project_id', 'exception_class', DB::raw('MIN(id) as first_id'), DB::raw('COUNT(*) as occurrences'))
            ->whereIn('project_id', $projectIds)
            ->whereBetween('sent_at', [$windowStart, $now])
            ->groupBy('project_id', 'exception_class');

        if (is_string($pattern) && $pattern !== '') {
            $candidateQuery->where('exception_class', 'like', $pattern);
        }

        $candidates = $candidateQuery->get();

        if ($candidates->isEmpty()) {
            return RuleEvaluationResult::noMatch();
        }

        $newClasses = [];
        foreach ($candidates as $row) {
            $existedBefore = HubException::query()
                ->where('project_id', $row->project_id)
                ->where('exception_class', $row->exception_class)
                ->where('sent_at', '<', $windowStart)
                ->exists();

            if (! $existedBefore) {
                $newClasses[] = [
                    'project_id' => (int) $row->project_id,
                    'exception_class' => (string) $row->exception_class,
                    'first_exception_id' => (int) $row->first_id,
                    'occurrences_in_window' => (int) $row->occurrences,
                ];
            }
        }

        if ($newClasses === []) {
            return RuleEvaluationResult::noMatch();
        }

        return RuleEvaluationResult::match(
            matchedCount: count($newClasses),
            context: [
                'window_seconds' => $rule->window_seconds,
                'class_pattern' => $pattern,
                'new_classes' => $newClasses,
            ],
        );
    }

    /**
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
