<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_configs', function (Blueprint $table): void {
            $table->boolean('auto_assign_recurrences')
                ->default(true)
                ->after('self_heal');
        });
    }

    public function down(): void
    {
        Schema::table('ai_configs', function (Blueprint $table): void {
            $table->dropColumn('auto_assign_recurrences');
        });
    }
};
