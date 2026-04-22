<?php

namespace App\Console\Commands;

use App\Mail\EmailReportMail;
use App\Models\EmailReport;
use App\Models\User;
use App\Services\EmailReportDataCollector;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Mail;

class SendEmailReportPreview extends Command
{
    protected $signature = 'nightwatch:email-reports:send
                            {--email= : Destination email (ignored when --id is used)}
                            {--id= : Send an existing EmailReport by id}
                            {--frequency=daily : daily|weekly|monthly window of data to include}
                            {--scope=all : all|selected}
                            {--projects=* : Project ids to include when --scope=selected}
                            {--preview : Write the rendered HTML to storage/app/email-report-preview.html and skip sending}';

    protected $description = 'Send (or preview) a single Nightwatch email report using current monitoring data';

    public function handle(EmailReportDataCollector $collector): int
    {
        $report = $this->option('id')
            ? $this->loadExisting((int) $this->option('id'))
            : $this->buildEphemeral();

        if ($report === null) {
            return self::FAILURE;
        }

        $data = $collector->collect($report);
        $mailable = new EmailReportMail($report, $data);

        if ($this->option('preview')) {
            $path = storage_path('app/email-report-preview.html');
            File::ensureDirectoryExists(dirname($path));
            File::put($path, $mailable->render());
            $this->info('Rendered preview written to '.$path);
            $this->comment('Open it in a browser: file://'.$path);

            return self::SUCCESS;
        }

        Mail::to($report->email)->send($mailable);

        $this->info("Report sent to {$report->email} (frequency: {$report->frequency}).");
        $this->line(sprintf(
            '  Summary: %d exceptions · %d requests · %d failed jobs · %d slow queries',
            $data['summary']['total_exceptions'] ?? 0,
            $data['summary']['total_requests'] ?? 0,
            $data['summary']['failed_jobs'] ?? 0,
            $data['summary']['slow_queries'] ?? 0,
        ));

        if (config('mail.default') === 'log') {
            $this->comment('MAIL_MAILER=log — email written to the Laravel log, not delivered to an inbox.');
        }

        return self::SUCCESS;
    }

    private function loadExisting(int $id): ?EmailReport
    {
        $report = EmailReport::find($id);

        if ($report === null) {
            $this->error("No EmailReport found with id {$id}.");

            return null;
        }

        return $report;
    }

    private function buildEphemeral(): ?EmailReport
    {
        $email = $this->option('email');

        if (! is_string($email) || $email === '') {
            $this->error('Provide --email=<address> or --id=<existing report id>.');

            return null;
        }

        $frequency = (string) $this->option('frequency');
        if (! in_array($frequency, EmailReport::FREQUENCIES, true)) {
            $this->error('Invalid --frequency. Use one of: '.implode(', ', EmailReport::FREQUENCIES));

            return null;
        }

        $scope = $this->option('scope') === 'selected' ? 'selected' : 'all';
        $projectIds = array_map('intval', (array) $this->option('projects'));

        $user = User::query()->orderBy('id')->first();

        $report = new EmailReport([
            'email' => $email,
            'frequency' => $frequency,
            'timezone' => 'UTC',
            'send_hour' => 8,
            'send_day_of_week' => 1,
            'send_day_of_month' => 1,
            'project_scope' => $scope,
            'project_ids' => $scope === 'selected' ? $projectIds : [],
            'sections' => EmailReport::DEFAULT_SECTIONS,
            'enabled' => true,
        ]);
        $report->user_id = $user?->id ?? 0;

        return $report;
    }
}
