<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('retention_details', function (Blueprint $table): void {
            $table->id();
            $table->string('singleton_key', 50)->unique()->default('global');
            $table->boolean('retention_enabled')->default(true);
            $table->unsignedInteger('retention_run_interval_days')->default(1);
            $table->unsignedInteger('retention_global_days')->default(14);
            $table->unsignedInteger('hub_logs_days')->default(14);
            $table->unsignedInteger('hub_caches_days')->default(14);
            $table->unsignedInteger('hub_queries_days')->default(14);
            $table->unsignedInteger('hub_requests_days')->default(14);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('retention_details');
    }
};
