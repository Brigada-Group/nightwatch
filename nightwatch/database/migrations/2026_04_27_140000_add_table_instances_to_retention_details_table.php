<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const TABLES = [
        'hub_logs',
        'hub_cache',
        'hub_queries',
        'hub_requests',
    ];

    public function up(): void
    {
        if (! Schema::hasTable('retention_details')) {
            return;
        }

        Schema::table('retention_details', function (Blueprint $table): void {
            if (! Schema::hasColumn('retention_details', 'table_name')) {
                $table->string('table_name', 64)->nullable()->after('id');
            }

            if (! Schema::hasColumn('retention_details', 'is_enabled')) {
                $table->boolean('is_enabled')->default(true)->after('table_name');
            }

            if (! Schema::hasColumn('retention_details', 'run_interval_days')) {
                $table->unsignedInteger('run_interval_days')->default(1)->after('is_enabled');
            }

            if (! Schema::hasColumn('retention_details', 'retention_days')) {
                $table->unsignedInteger('retention_days')->default(14)->after('run_interval_days');
            }
        });

        $global = DB::table('retention_details')->where('singleton_key', 'global')->first();

        foreach (self::TABLES as $tableName) {
            $retentionDays = 14;
            if ($global !== null) {
                $legacyCol = match ($tableName) {
                    'hub_logs' => 'hub_logs_days',
                    'hub_cache' => 'hub_caches_days',
                    'hub_queries' => 'hub_queries_days',
                    'hub_requests' => 'hub_requests_days',
                    default => null,
                };

                $retentionDays = max(1, (int) (($legacyCol && isset($global->{$legacyCol})) ? $global->{$legacyCol} : ($global->retention_global_days ?? 14)));
            }

            DB::table('retention_details')->updateOrInsert(
                ['table_name' => $tableName],
                [
                    'singleton_key' => 'table:'.$tableName,
                    'is_enabled' => (bool) ($global->retention_enabled ?? true),
                    'run_interval_days' => max(1, (int) ($global->retention_run_interval_days ?? 1)),
                    'retention_days' => $retentionDays,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        Schema::table('retention_details', function (Blueprint $table): void {
            $table->unique('table_name', 'retention_details_table_name_unique');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('retention_details')) {
            return;
        }

        Schema::table('retention_details', function (Blueprint $table): void {
            if (Schema::hasColumn('retention_details', 'table_name')) {
                $table->dropUnique('retention_details_table_name_unique');
                $table->dropColumn(['table_name', 'is_enabled', 'run_interval_days', 'retention_days']);
            }
        });
    }
};
