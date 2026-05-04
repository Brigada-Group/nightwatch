<?php

namespace App\Console\Commands;

use App\Models\AlertRule;
use App\Services\Alerting\AlertRuleEngine;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

/**
 * Runs every minute via routes/console.php. Loads every enabled rule and
 * dispatches each through AlertRuleEngine::tick(). The engine owns all
 * state transitions; this command is just the cron entrypoint.
 *
 * One rule failing must not stop the rest — wrap each tick in a try/catch.
 */
class EvaluateAlertRulesCommand extends Command
{
    protected $signature = 'alerting:evaluate {--rule= : Evaluate a single rule by id (debug helper)}';

    protected $description = 'Evaluate every enabled alert rule and fire/resolve as needed';

    public function handle(AlertRuleEngine $engine): int
    {
        $now = Carbon::now();
        $singleRuleId = $this->option('rule');

        $rules = AlertRule::query()
            ->with(['destinations.webhookDestination', 'team', 'project'])
            ->when($singleRuleId !== null, fn ($q) => $q->whereKey((int) $singleRuleId))
            ->where('is_enabled', true)
            ->orderBy('id')
            ->cursor();

        $count = 0;
        $failed = 0;

        foreach ($rules as $rule) {
            try {
                $engine->tick($rule, $now);
                $count++;
            } catch (\Throwable $e) {
                $failed++;
                report($e);
                $this->warn("Rule #{$rule->id} ({$rule->name}) tick failed: ".$e->getMessage());
            }
        }

        $this->info("Evaluated {$count} rule(s)".($failed > 0 ? ", {$failed} failed" : ''));

        return self::SUCCESS;
    }
}
