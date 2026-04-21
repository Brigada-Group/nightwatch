<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('hub_scheduled_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('environment');
            $table->string('server');
            $table->string('task');
            $table->string('description')->nullable();
            $table->string('expression')->nullable();
            $table->string('status');                        // 'completed', 'failed', 'skipped'
            $table->float('duration_ms')->nullable();
            $table->text('output')->nullable();
            $table->timestamp('sent_at');
            $table->timestamps();
            
            $table->index(['project_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hub_scheduled_tasks');
    }
};
