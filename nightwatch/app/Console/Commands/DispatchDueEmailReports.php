<?php

namespace App\Console\Commands;

use App\Jobs\SendEmailReport;
use App\Services\EmailReportScheduler;
use Illuminate\Console\Command;

class DispatchDueEmailReports extends Command
{
    protected $signature = 'nightwatch:email-reports:dispatch';

    protected $description = 'Dispatches queued email reports whose next_run_at is due';

    public function handle(EmailReportScheduler $scheduler): int
    {
        $ids = $scheduler->claimDueReportIds();

        if ($ids === []) {
            return self::SUCCESS;
        }

        foreach ($ids as $id) {
            SendEmailReport::dispatch($id);
        }

        $this->info('Dispatched '.count($ids).' email report job(s).');

        return self::SUCCESS;
    }
}
