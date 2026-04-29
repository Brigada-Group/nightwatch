<?php

namespace App\Console\Commands;

use App\Services\SuperAdminAnalyticsService;
use Illuminate\Console\Command;

class RecordPlatformMetrics extends Command
{
    protected $signature = 'nightwatch:platform:record-metrics';

    protected $description = 'Record daily platform metric snapshots (for super-admin growth charts)';

    public function handle(SuperAdminAnalyticsService $analytics): int
    {
        $analytics->recordDailySnapshots();
        $this->info('Platform metric snapshots updated for today.');

        return self::SUCCESS;
    }
}
