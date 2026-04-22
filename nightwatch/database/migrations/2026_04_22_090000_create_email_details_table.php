<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('email');
            $table->enum('frequency', ['daily', 'weekly', 'monthly']);
            $table->string('timezone', 64)->default('UTC');
            $table->unsignedTinyInteger('send_hour')->default(8);
            $table->unsignedTinyInteger('send_day_of_week')->nullable();
            $table->unsignedTinyInteger('send_day_of_month')->nullable();
            $table->enum('project_scope', ['all', 'selected'])->default('all');
            $table->json('project_ids')->nullable();
            $table->json('sections')->nullable();
            $table->boolean('enabled')->default(true);
            $table->timestamp('last_sent_at')->nullable();
            $table->timestamp('next_run_at')->nullable();
            $table->timestamps();

            $table->index(['enabled', 'next_run_at'], 'email_details_due_idx');
            $table->index('user_id', 'email_details_user_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_details');
    }
};
