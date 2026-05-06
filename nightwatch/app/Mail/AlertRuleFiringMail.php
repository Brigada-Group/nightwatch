<?php

namespace App\Mail;

use App\Models\AlertRule;
use App\Models\AlertRuleFiring;
use App\Models\HubException;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Sent to every email destination on an alert rule when it transitions
 * not_firing → firing. The body focuses on the ACTUAL errors that triggered
 * the rule, not on the rule's metadata — the reader cares about which bugs
 * are happening, not about threshold mechanics.
 */
class AlertRuleFiringMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public AlertRule $rule,
        public AlertRuleFiring $firing,
    ) {}

    public function envelope(): Envelope
    {
        $appName = (string) config('app.name', 'Guardian');
        $severityTag = strtoupper((string) $this->rule->severity);

        return new Envelope(
            subject: "[{$severityTag}] {$appName} alert: {$this->rule->name}",
        );
    }

    public function content(): Content
    {
        $project = $this->rule->project;
        $team = $this->rule->team;

        return new Content(
            markdown: 'mail.alert-rule-firing',
            with: [
                'appName' => (string) config('app.name', 'Guardian'),
                'ruleName' => $this->rule->name,
                'severity' => $this->rule->severity,
                'firedAt' => $this->firing->fired_at?->toDayDateTimeString() ?? '',
                'projectName' => $project?->name,
                'teamName' => $team?->name,
                'events' => $this->loadTriggeringEvents(
                    $this->rule->type,
                    $this->firing->context ?? [],
                ),
                'rulesUrl' => url('/alert-rules'),
            ],
        );
    }

    /**
     * Resolve the firing's context into the actual exception rows that
     * triggered the rule. Returns a list of normalized event records the
     * Blade template can iterate over without conditionals.
     *
     * @return array<int, array{
     *     exception_class: string,
     *     message: string,
     *     file: ?string,
     *     line: ?int,
     *     severity: ?string,
     *     occurred_at: string,
     *     url: string,
     *     occurrences_in_window: ?int,
     * }>
     */
    private function loadTriggeringEvents(string $ruleType, array $context): array
    {
        $ids = $this->collectExceptionIds($ruleType, $context);
        if ($ids === []) {
            return [];
        }

        $exceptions = HubException::query()
            ->whereIn('id', $ids)
            ->orderByDesc('sent_at')
            ->limit(5)
            ->get();

        // For new_exception_class, attach the per-class occurrence count so
        // the email can show "3 occurrences in window" next to each class.
        $occurrencesById = $this->extractOccurrencesIndex($ruleType, $context);

        return $exceptions->map(fn (HubException $e) => [
            'exception_class' => (string) $e->exception_class,
            'message' => $this->truncate((string) $e->message, 160),
            'file' => $e->file,
            'line' => $e->line ? (int) $e->line : null,
            'severity' => $e->severity,
            'occurred_at' => $e->sent_at?->toDayDateTimeString() ?? '',
            'url' => url('/exceptions/'.$e->id),
            'occurrences_in_window' => $occurrencesById[(int) $e->id] ?? null,
        ])->all();
    }

    /**
     * @return list<int>
     */
    private function collectExceptionIds(string $ruleType, array $context): array
    {
        if ($ruleType === AlertRule::TYPE_ERROR_RATE) {
            return array_map('intval', $context['sample_exception_ids'] ?? []);
        }

        if ($ruleType === AlertRule::TYPE_NEW_EXCEPTION_CLASS) {
            $classes = $context['new_classes'] ?? [];
            return array_map(
                static fn ($c) => (int) ($c['first_exception_id'] ?? 0),
                is_array($classes) ? $classes : [],
            );
        }

        return [];
    }

    /**
     * Build a (first_exception_id → occurrences_in_window) lookup so we
     * can decorate new-class events with their burst size.
     *
     * @return array<int, int>
     */
    private function extractOccurrencesIndex(string $ruleType, array $context): array
    {
        if ($ruleType !== AlertRule::TYPE_NEW_EXCEPTION_CLASS) {
            return [];
        }

        $index = [];
        foreach ($context['new_classes'] ?? [] as $class) {
            $id = (int) ($class['first_exception_id'] ?? 0);
            if ($id > 0) {
                $index[$id] = (int) ($class['occurrences_in_window'] ?? 0);
            }
        }
        return $index;
    }

    private function truncate(string $value, int $max): string
    {
        return mb_strlen($value) > $max
            ? mb_substr($value, 0, $max - 1).'…'
            : $value;
    }
}
