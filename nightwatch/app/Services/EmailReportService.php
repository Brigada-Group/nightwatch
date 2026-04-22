<?php

namespace App\Services;

use App\Models\EmailReport;

class EmailReportService
{
    public function __construct(
        private readonly EmailReportScheduler $scheduler,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function createForUser(int $userId, array $data): EmailReport
    {
        $report = new EmailReport($this->normalise($data));
        $report->user_id = $userId;
        $report->enabled = (bool) ($data['enabled'] ?? true);
        $report->next_run_at = $this->scheduler->computeNextRun($report);
        $report->save();

        return $report;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(EmailReport $report, array $data): EmailReport
    {
        $normalised = $this->normalise($data);

        $cadenceChanged = $this->cadenceChanged($report, $normalised);

        $report->fill($normalised);
        $report->enabled = (bool) ($data['enabled'] ?? $report->enabled);

        if ($cadenceChanged || $report->enabled && $report->next_run_at === null) {
            $report->next_run_at = $this->scheduler->computeNextRun($report);
        }

        $report->save();

        return $report;
    }

    public function delete(EmailReport $report): void
    {
        $report->delete();
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalise(array $data): array
    {
        $sections = $data['sections'] ?? null;
        if (! is_array($sections) || $sections === []) {
            $sections = EmailReport::DEFAULT_SECTIONS;
        }

        $projectIds = $data['project_ids'] ?? [];
        if (! is_array($projectIds)) {
            $projectIds = [];
        }
        $projectIds = array_values(array_unique(array_map('intval', $projectIds)));

        return [
            'email' => $data['email'],
            'frequency' => $data['frequency'],
            'timezone' => $data['timezone'] ?: 'UTC',
            'send_hour' => isset($data['send_hour']) ? (int) $data['send_hour'] : 8,
            'send_day_of_week' => isset($data['send_day_of_week']) ? (int) $data['send_day_of_week'] : null,
            'send_day_of_month' => isset($data['send_day_of_month']) ? (int) $data['send_day_of_month'] : null,
            'project_scope' => $data['project_scope'],
            'project_ids' => $data['project_scope'] === 'selected' ? $projectIds : [],
            'sections' => array_values(array_unique($sections)),
        ];
    }

    /**
     * @param  array<string, mixed>  $new
     */
    private function cadenceChanged(EmailReport $report, array $new): bool
    {
        return $report->frequency !== ($new['frequency'] ?? $report->frequency)
            || $report->timezone !== ($new['timezone'] ?? $report->timezone)
            || (int) $report->send_hour !== (int) ($new['send_hour'] ?? $report->send_hour)
            || (int) $report->send_day_of_week !== (int) ($new['send_day_of_week'] ?? $report->send_day_of_week)
            || (int) $report->send_day_of_month !== (int) ($new['send_day_of_month'] ?? $report->send_day_of_month);
    }
}
