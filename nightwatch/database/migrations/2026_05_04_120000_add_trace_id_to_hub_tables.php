<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const TABLES = [
        'hub_requests',
        'hub_queries',
        'hub_jobs',
        'hub_outgoing_http',
        'hub_logs',
        'hub_mails',
        'hub_notifications',
        'hub_cache',
        'hub_exceptions',
    ];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            Schema::table($table, function (Blueprint $t) use ($table) {
                if (! Schema::hasColumn($table, 'trace_id')) {
                    $t->char('trace_id', 32)->nullable()->after('server');
                }
                $t->index(['project_id', 'trace_id'], "{$table}_project_trace_idx");
            });
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            Schema::table($table, function (Blueprint $t) use ($table) {
                $t->dropIndex("{$table}_project_trace_idx");
                if (Schema::hasColumn($table, 'trace_id')) {
                    $t->dropColumn('trace_id');
                }
            });
        }
    }
};
