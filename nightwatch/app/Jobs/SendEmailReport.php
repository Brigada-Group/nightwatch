<?php

namespace App\Jobs;

use App\Mail\EmailReportMail;
use App\Models\EmailReport;
use App\Services\EmailReportDataCollector;
use App\Services\EmailReportScheduler;
use Carbon\CarbonImmutable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendEmailReport implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public int $backoff = 60;

    public function __construct(public int $reportId) {}

    public function handle(
        EmailReportDataCollector $collector,
        EmailReportScheduler $scheduler,
    ): void {
        $report = EmailReport::find($this->reportId);

        if ($report === null || ! $report->enabled) {
            return;
        }

        $payload = $collector->collect($report);

        Mail::to($report->email)->send(new EmailReportMail($report, $payload));

        $now = CarbonImmutable::now();
        $report->forceFill([
            'last_sent_at' => $now,
            'next_run_at' => $scheduler->computeNextRun($report, $now->addMinute()),
        ])->save();

        Log::info('EmailReport sent', [
            'report_id' => $report->id,
            'email' => $report->email,
            'frequency' => $report->frequency,
            'next_run_at' => $report->next_run_at?->toIso8601String(),
        ]);
    }
}
