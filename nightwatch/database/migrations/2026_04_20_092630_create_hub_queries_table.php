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
        Schema::create('hub_queries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('environment');
            $table->string('server');
            $table->text('sql');
            $table->float('duration_ms');
            $table->string('connection')->nullable();
            $table->string('file')->nullable();
            $table->integer('line')->nullable();
            $table->boolean('is_slow')->default(false);
            $table->boolean('is_n_plus_one')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamp('sent_at');
            $table->timestamps();
            
            $table->index(['project_id', 'created_at']);
            $table->index('is_slow');
            $table->index('is_n_plus_one');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hub_queries');
    }
};
