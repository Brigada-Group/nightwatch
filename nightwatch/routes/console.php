<?php

use App\Console\Commands\DispatchDueEmailReports;
use App\Console\Commands\EvaluateAlertRulesCommand;
use App\Console\Commands\RecordPlatformMetrics;
use App\Console\Commands\RunRetentionCleanup;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command(DispatchDueEmailReports::class)
    ->everyMinute()
    ->withoutOverlapping()
    ->runInBackground();

Schedule::command(EvaluateAlertRulesCommand::class)
    ->everyMinute()
    ->withoutOverlapping()
    ->runInBackground();

Schedule::command(RunRetentionCleanup::class)
    ->dailyAt('00:01')
    ->withoutOverlapping()
    ->runInBackground();

Schedule::command(RecordPlatformMetrics::class)
    ->dailyAt('00:10')
    ->withoutOverlapping();
