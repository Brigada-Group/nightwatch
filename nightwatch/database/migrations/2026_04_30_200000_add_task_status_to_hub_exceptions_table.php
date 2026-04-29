<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hub_exceptions', function (Blueprint $table): void {
            $table->string('task_status', 20)->nullable()->after('assigned_at');
            $table->index('task_status');
        });
    }

    public function down(): void
    {
        Schema::table('hub_exceptions', function (Blueprint $table): void {
            $table->dropIndex(['task_status']);
            $table->dropColumn('task_status');
        });
    }
};
