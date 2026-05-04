<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Drop the unique constraint on (project_id, fingerprint) and replace it with
 * a regular composite index. The unique constraint was a race-prevention
 * fence, but it triggers a SQLSTATE error before IssueRecurrenceService gets
 * a chance to handle the duplicate at the application layer (the same way
 * ExceptionRecurrenceService does for hub_exceptions).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hub_issues', function (Blueprint $table): void {
            $table->dropUnique('hub_issues_project_fingerprint_unique');
            $table->index(['project_id', 'fingerprint'], 'hub_issues_project_fingerprint_idx');
        });
    }

    public function down(): void
    {
        Schema::table('hub_issues', function (Blueprint $table): void {
            $table->dropIndex('hub_issues_project_fingerprint_idx');
            $table->unique(['project_id', 'fingerprint'], 'hub_issues_project_fingerprint_unique');
        });
    }
};
