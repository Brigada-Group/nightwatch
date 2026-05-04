<?php

namespace App\Services\Alerting;

/**
 * Outcome of evaluating a single rule. The engine reads `matched` to decide
 * fire vs resolve; matched_count + context get persisted on the
 * alert_rule_firings row.
 */
final class RuleEvaluationResult
{
    public function __construct(
        public readonly bool $matched,
        public readonly int $matchedCount = 0,
        public readonly array $context = [],
    ) {}

    public static function noMatch(): self
    {
        return new self(matched: false);
    }

    public static function match(int $matchedCount, array $context = []): self
    {
        return new self(matched: true, matchedCount: $matchedCount, context: $context);
    }
}
