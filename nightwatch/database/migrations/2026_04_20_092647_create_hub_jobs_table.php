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
        Schema::create('hub_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('environment');
            $table->string('server');
            $table->string('job_class');
            $table->string('queue')->nullable();
            $table->string('connection')->nullable();
            $table->string('status');                        // 'completed' or 'failed'
            $table->float('duration_ms')->nullable();
            $table->integer('attempt')->nullable();
            $table->text('error_message')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('sent_at');
            $table->timestamps();
            
            $table->index(['project_id', 'created_at']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hub_jobs');
    }
};
