<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hub_exceptions', function (Blueprint $table): void {
            $table->timestamp('task_finished_at')->nullable()->after('task_status');
            $table->index('task_finished_at');
        });
    }

    public function down(): void
    {
        Schema::table('hub_exceptions', function (Blueprint $table): void {
            $table->dropIndex(['task_finished_at']);
            $table->dropColumn('task_finished_at');
        });
    }
};
