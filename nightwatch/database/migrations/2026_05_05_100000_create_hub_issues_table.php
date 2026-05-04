<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Polymorphic "issue" sidecar table. One row per (project, fingerprint) chain
 * for slow_query and slow_request sources. Mirrors the issue lifecycle that
 * already lives inline on hub_exceptions (fingerprint, recurrence, task_status,
 * task_finished_at, assignment).
 *
 * The underlying event rows in hub_queries / hub_requests are the canonical
 * occurrence log — they are NEVER deleted by reconcile(). Only the sidecar
 * issue row is collapsed when a duplicate is detected.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hub_issues', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();

            // Polymorphic source pointer — one of: slow_query, slow_request.
            // source_id is the latest occurrence in hub_queries / hub_requests.
            // It's updated on every recurrence so the detail page reads fresh
            // data; the count of total occurrences lives on this row.
            $table->string('source_type', 20);
            $table->unsignedBigInteger('source_id');

            // Denormalized so the kanban can render without joining 9 tables.
            // Refreshed on every reconcile() update.
            $table->string('summary', 500);
            $table->string('severity', 20)->default('warning');

            // Recurrence chain identity. Same shape as hub_exceptions.
            $table->char('fingerprint', 64);
            $table->boolean('is_recurrence')->default(false);
            $table->foreignId('original_issue_id')
                ->nullable()
                ->constrained('hub_issues')
                ->nullOnDelete();
            $table->unsignedInteger('recurrence_count')->default(0);

            // Lifecycle timestamps.
            $table->timestamp('first_seen_at')->nullable();
            $table->timestamp('last_seen_at')->nullable();

            // Assignment fields — exactly mirroring hub_exceptions.
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('assigned_at')->nullable();
            $table->string('task_status', 20)->nullable();
            $table->timestamp('task_finished_at')->nullable();

            $table->timestamps();

            // One issue per (project, fingerprint). Prevents the parallel-row
            // race the recurrence service is designed to avoid.
            $table->unique(['project_id', 'fingerprint'], 'hub_issues_project_fingerprint_unique');

            // Kanban hot-path index: "all my open tasks in this project".
            $table->index(
                ['project_id', 'task_status', 'assigned_to'],
                'hub_issues_project_status_assignee_idx',
            );
            $table->index('assigned_by', 'hub_issues_assigned_by_idx');
            $table->index(['source_type', 'source_id'], 'hub_issues_source_idx');
            $table->index('last_seen_at', 'hub_issues_last_seen_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hub_issues');
    }
};
