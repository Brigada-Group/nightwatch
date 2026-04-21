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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->uuid('project_uuid')->unique();        
            $table->string('name');                         
            $table->string('api_token', 80)->unique();      
            $table->string('environment')->default('production');
            $table->enum('status', ['normal', 'warning', 'critical', 'unknown'])->default('unknown');
            $table->timestamp('last_heartbeat_at')->nullable();
            $table->json('metadata')->nullable();            // php_version, laravel_version from heartbeat
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
