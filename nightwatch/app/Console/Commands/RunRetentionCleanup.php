<?php

namespace App\Console\Commands;

use App\Models\RetentionCleanupRun;
use App\Models\RetentionDetail;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RunRetentionCleanup extends Command
{
    protected $signature = 'nightwatch:retention:cleanup';

    protected $description = 'Cleans telemetry tables using database-driven retention settings';

    public function handle(): int
    {
        $instances = RetentionDetail::query()
            ->instances()
            ->where('is_enabled', true)
            ->get();

        if ($instances->isEmpty()) {
            $this->info('No enabled retention instances configured.');

            return self::SUCCESS;
        }

        foreach ($instances as $instance) {
            $table = (string) $instance->table_name;
            $runIntervalDays = max(1, (int) $instance->run_interval_days);
            $retentionDays = max(1, (int) $instance->retention_days);

            if (! Schema::hasTable($table)) {
                $this->warn("Skipping {$table}: table not found.");

                continue;
            }

            $cleanupKey = 'table:'.$table;
            $run = RetentionCleanupRun::query()->firstOrCreate(
                ['cleanup_key' => $cleanupKey],
                [
                    'last_ran_at' => null,
                    'last_deleted_rows' => 0,
                    'last_retention_days' => $retentionDays,
                ]
            );

            $nextEligibleRunAt = $run->last_ran_at?->copy()->addDays($runIntervalDays);
            if ($nextEligibleRunAt && Carbon::now()->lt($nextEligibleRunAt)) {
                $this->line("Skipping {$table}: next eligible run at {$nextEligibleRunAt->toDateTimeString()}");

                continue;
            }

            $cutoff = Carbon::now()->subDays($retentionDays);
            $deletedRows = DB::table($table)
                ->where('sent_at', '<', $cutoff)
                ->delete();

            $run->forceFill([
                'last_ran_at' => Carbon::now(),
                'last_deleted_rows' => $deletedRows,
                'last_retention_days' => $retentionDays,
                'notes' => sprintf(
                    'cutoff=%s interval_days=%d',
                    $cutoff->toDateTimeString(),
                    $runIntervalDays
                ),
            ])->save();

            $this->info("{$table}: deleted {$deletedRows} row(s) older than {$retentionDays} day(s).");
        }

        return self::SUCCESS;
    }
}
