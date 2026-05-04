<?php

namespace App\Services\Alerting\Contracts;

use App\Models\AlertRule;
use App\Services\Alerting\RuleEvaluationResult;
use Carbon\CarbonInterface;

/**
 * One implementation per rule type. Stateless — receives the rule + the
 * evaluation timestamp, returns a verdict. The caller (AlertRuleEngine)
 * owns state persistence.
 */
interface RuleEvaluator
{
    public function evaluate(AlertRule $rule, CarbonInterface $now): RuleEvaluationResult;
}
