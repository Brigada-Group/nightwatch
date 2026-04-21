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
        Schema::create('hub_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('environment');
            $table->string('server');
            $table->string('method', 10);
            $table->string('uri', 2048);
            $table->string('route_name')->nullable();
            $table->integer('status_code');
            $table->float('duration_ms');
            $table->string('ip')->nullable();
            $table->string('user_id')->nullable();
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
        Schema::dropIfExists('hub_requests');
    }
};
