<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_fix_attempts', function (Blueprint $table): void {
            $table->id();
            // Polymorphic to either HubException or HubIssue. The standard
            // Eloquent morph map uses fully-qualified class names; that's fine
            // — it keeps the table self-describing without a global morph
            // map registration that could collide with future polymorphics.
            $table->morphs('task');
            $table->foreignId('project_id')
                ->constrained('projects')
                ->cascadeOnDelete();
            $table->foreignId('requested_by_user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            // queued | running | succeeded | failed
            $table->string('status', 20)->default('queued');
            $table->json('result')->nullable();
            $table->text('error')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            // The "find an active attempt for this task" hot path:
            // controller checks for queued/running before dispatching a new
            // run, so this composite covers it.
            $table->index(['task_type', 'task_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_fix_attempts');
    }
};
