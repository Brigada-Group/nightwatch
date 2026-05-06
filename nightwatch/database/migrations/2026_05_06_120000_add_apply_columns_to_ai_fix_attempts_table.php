<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_fix_attempts', function (Blueprint $table): void {
            // Apply-flow bookkeeping. Populated when the assignee accepts the
            // AI's proposal and the GithubChangesetWriter successfully creates
            // a branch + PR. Null on attempts that were never accepted (or
            // that failed to apply — `apply_error` captures the reason).
            $table->timestamp('applied_at')->nullable()->after('completed_at');
            $table->string('apply_branch_name')->nullable()->after('applied_at');
            $table->string('apply_commit_sha', 40)->nullable()->after('apply_branch_name');
            $table->string('apply_pr_url')->nullable()->after('apply_commit_sha');
            $table->unsignedInteger('apply_pr_number')->nullable()->after('apply_pr_url');
            $table->text('apply_error')->nullable()->after('apply_pr_number');
        });
    }

    public function down(): void
    {
        Schema::table('ai_fix_attempts', function (Blueprint $table): void {
            $table->dropColumn([
                'applied_at',
                'apply_branch_name',
                'apply_commit_sha',
                'apply_pr_url',
                'apply_pr_number',
                'apply_error',
            ]);
        });
    }
};
