<?php

namespace App\Console\Commands;

use App\Models\HubException;
use App\Services\ExceptionFingerprintService;
use Illuminate\Console\Command;

class BackfillExceptionFingerprintsCommand extends Command
{
    protected $signature = 'exceptions:backfill-fingerprints {--batch=500}';

    protected $description = 'Compute fingerprints for hub_exceptions rows that are missing them.';

    public function handle(ExceptionFingerprintService $fingerprints): int
    {
        $batch = (int) $this->option('batch');
        $totalUpdated = 0;
        $count = 0;

        do {
            $rows = HubException::query()
                ->whereNull('fingerprint')
                ->orderBy('id')
                ->limit($batch)
                ->get(['id', 'project_id', 'exception_class', 'message', 'file', 'line']);

            foreach ($rows as $row) {
                HubException::query()->where('id', $row->id)->update([
                    'fingerprint' => $fingerprints->compute(
                        (int) $row->project_id,
                        (string) $row->exception_class,
                        $row->message,
                        $row->file,
                        $row->line,
                    ),
                ]);
            }

            $count = $rows->count();
            $totalUpdated += $count;
            $this->info("Updated {$count} (running total: {$totalUpdated})");

            if ($count === $batch) {
                usleep(200_000);
            }
        } while ($count === $batch);

        $this->info("Done. Total updated: {$totalUpdated}");

        return self::SUCCESS;
    }
}
