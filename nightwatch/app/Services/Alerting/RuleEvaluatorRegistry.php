<?php

namespace App\Services\Alerting;

use App\Models\AlertRule;
use App\Services\Alerting\Contracts\RuleEvaluator;
use App\Services\Alerting\Evaluators\ErrorRateRuleEvaluator;
use App\Services\Alerting\Evaluators\NewExceptionClassRuleEvaluator;
use InvalidArgumentException;

/**
 * Maps rule type strings to their RuleEvaluator implementation. Adding a
 * new rule type = one new evaluator class + one entry here.
 */
class RuleEvaluatorRegistry
{
    public function __construct(
        private readonly ErrorRateRuleEvaluator $errorRate,
        private readonly NewExceptionClassRuleEvaluator $newExceptionClass,
    ) {}

    public function for(string $type): RuleEvaluator
    {
        return match ($type) {
            AlertRule::TYPE_ERROR_RATE => $this->errorRate,
            AlertRule::TYPE_NEW_EXCEPTION_CLASS => $this->newExceptionClass,
            default => throw new InvalidArgumentException("Unknown alert rule type: {$type}"),
        };
    }
}
