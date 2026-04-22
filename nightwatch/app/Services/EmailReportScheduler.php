<?php

namespace App\Services;

use App\Models\EmailReport;
use Carbon\CarbonImmutable;
use DateTimeZone;

class EmailReportScheduler
{
    /**
     * Compute the next UTC instant this report should fire at, based on the
     * user's configured frequency, hour, day-of-week, day-of-month, and timezone.
     *
     * We anchor to "from" so that (a) scheduling is deterministic and (b) after
     * a successful send we can pass now+1s to guarantee we advance past the
     * current boundary instead of re-firing the same slot.
     */
    public function computeNextRun(EmailReport $report, ?CarbonImmutable $from = null): CarbonImmutable
    {
        $tz = $this->safeTimezone($report->timezone);
        $from = ($from ?? CarbonImmutable::now())->setTimezone($tz);
        $hour = $this->clampHour($report->send_hour);

        $next = match ($report->frequency) {
            'daily' => $this->nextDaily($from, $hour),
            'weekly' => $this->nextWeekly($from, $hour, $report->send_day_of_week ?? 1),
            'monthly' => $this->nextMonthly($from, $hour, $report->send_day_of_month ?? 1),
            default => $this->nextDaily($from, $hour),
        };

        return $next->setTimezone('UTC');
    }

    private function nextDaily(CarbonImmutable $from, int $hour): CarbonImmutable
    {
        $candidate = $from->setTime($hour, 0, 0);

        return $candidate->lessThanOrEqualTo($from) ? $candidate->addDay() : $candidate;
    }

    private function nextWeekly(CarbonImmutable $from, int $hour, int $dayOfWeek): CarbonImmutable
    {
        $dayOfWeek = max(0, min(6, $dayOfWeek));

        $candidate = $from->setTime($hour, 0, 0);
        $diff = ($dayOfWeek - (int) $candidate->dayOfWeek + 7) % 7;
        $candidate = $candidate->addDays($diff);

        return $candidate->lessThanOrEqualTo($from) ? $candidate->addWeek() : $candidate;
    }

    private function nextMonthly(CarbonImmutable $from, int $hour, int $dayOfMonth): CarbonImmutable
    {
        $dayOfMonth = max(1, min(28, $dayOfMonth));

        $candidate = $from->setTime($hour, 0, 0)->day($dayOfMonth);

        return $candidate->lessThanOrEqualTo($from) ? $candidate->addMonthNoOverflow() : $candidate;
    }

    private function clampHour(?int $hour): int
    {
        $hour ??= 8;

        return max(0, min(23, $hour));
    }

    private function safeTimezone(?string $tz): DateTimeZone
    {
        try {
            return new DateTimeZone($tz ?: 'UTC');
        } catch (\Throwable) {
            return new DateTimeZone('UTC');
        }
    }

    /**
     * Atomically claim all reports whose next_run_at has passed. Advances
     * next_run_at in the same UPDATE so concurrent workers cannot double-fire.
     *
     * @return list<int>
     */
    public function claimDueReportIds(?CarbonImmutable $now = null, int $limit = 500): array
    {
        $now ??= CarbonImmutable::now();

        $ids = EmailReport::query()
            ->where('enabled', true)
            ->whereNotNull('next_run_at')
            ->where('next_run_at', '<=', $now)
            ->orderBy('next_run_at')
            ->limit($limit)
            ->pluck('id')
            ->all();

        if ($ids === []) {
            return [];
        }

        // Parking value: far enough in the future that a concurrent dispatcher
        // skips it, close enough that the per-report advance after send brings
        // it back to its true cadence. The SendEmailReport job will overwrite
        // it with the real next_run_at once the mail succeeds.
        EmailReport::query()
            ->whereIn('id', $ids)
            ->update(['next_run_at' => $now->addHours(1)]);

        return array_map('intval', $ids);
    }
}
