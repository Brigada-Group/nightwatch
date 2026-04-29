<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('team_invitation_links', function (Blueprint $table): void {
            $table->foreignId('created_by')->nullable()->after('role_id')
                ->constrained('users')->nullOnDelete();

            $table->index('created_by');
        });
    }

    public function down(): void
    {
        Schema::table('team_invitation_links', function (Blueprint $table): void {
            $table->dropForeign(['created_by']);
            $table->dropIndex(['created_by']);
            $table->dropColumn('created_by');
        });
    }
};
