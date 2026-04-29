<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('retention_details') && Schema::hasColumn('retention_details', 'batch_size')) {
            Schema::table('retention_details', function (Blueprint $table): void {
                $table->dropColumn('batch_size');
            });
        }

        if (Schema::hasTable('retention_details') && Schema::hasColumn('retention_details', 'retention_batch_size')) {
            Schema::table('retention_details', function (Blueprint $table): void {
                $table->dropColumn('retention_batch_size');
            });
        }

        if (Schema::hasTable('retention_cleanup_runs') && Schema::hasColumn('retention_cleanup_runs', 'last_batch_size')) {
            Schema::table('retention_cleanup_runs', function (Blueprint $table): void {
                $table->dropColumn('last_batch_size');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('retention_details') && ! Schema::hasColumn('retention_details', 'batch_size')) {
            Schema::table('retention_details', function (Blueprint $table): void {
                $table->unsignedInteger('batch_size')->default(500)->after('is_enabled');
            });
        }

        if (Schema::hasTable('retention_details') && ! Schema::hasColumn('retention_details', 'retention_batch_size')) {
            Schema::table('retention_details', function (Blueprint $table): void {
                $table->unsignedInteger('retention_batch_size')->default(500)->after('retention_enabled');
            });
        }

        if (Schema::hasTable('retention_cleanup_runs') && ! Schema::hasColumn('retention_cleanup_runs', 'last_batch_size')) {
            Schema::table('retention_cleanup_runs', function (Blueprint $table): void {
                $table->unsignedInteger('last_batch_size')->default(0)->after('last_deleted_rows');
            });
        }
    }
};
