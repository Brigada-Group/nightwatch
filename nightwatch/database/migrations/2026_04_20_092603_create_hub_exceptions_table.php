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
        Schema::create('hub_exceptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('environment');
            $table->string('server');
            $table->string('exception_class');
            $table->text('message');
            $table->string('file')->nullable();
            $table->integer('line')->nullable();
            $table->string('url', 2048)->nullable();
            $table->integer('status_code')->nullable();
            $table->string('user')->nullable();
            $table->string('ip')->nullable();
            $table->text('headers')->nullable();
            $table->text('stack_trace')->nullable();
            $table->string('severity')->default('error');
            $table->timestamp('sent_at');
            $table->timestamps();
            
            $table->index(['project_id', 'created_at']);
            $table->index('severity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hub_exceptions');
    }
};
