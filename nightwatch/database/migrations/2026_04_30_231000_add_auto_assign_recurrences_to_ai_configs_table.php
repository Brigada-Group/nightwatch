<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds the auto_assign_recurrences flag on ai_configs. Guarded so it's
 * safe to run on any environment state — fresh, already-applied, or
 * half-failed (where the unguarded duplicate at 132705 may have committed
 * before being neutralized).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('ai_configs', 'auto_assign_recurrences')) {
            return;
        }

        Schema::table('ai_configs', function (Blueprint $table): void {
            $table->boolean('auto_assign_recurrences')
                ->default(true)
                ->after('self_heal');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('ai_configs', 'auto_assign_recurrences')) {
            return;
        }

        Schema::table('ai_configs', function (Blueprint $table): void {
            $table->dropColumn('auto_assign_recurrences');
        });
    }
};
