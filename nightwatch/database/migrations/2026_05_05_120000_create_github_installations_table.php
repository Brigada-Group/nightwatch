<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('github_installations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('team_id')
                ->constrained('teams')
                ->cascadeOnDelete();
            $table->foreignId('installed_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->unsignedBigInteger('installation_id')->unique();
            $table->unsignedBigInteger('account_id');
            $table->string('account_login');
            $table->string('account_type');
            $table->string('target_type');
            $table->string('repository_selection')->default('selected');
            $table->json('permissions')->nullable();
            $table->json('events')->nullable();
            $table->text('access_token')->nullable();
            $table->timestamp('access_token_expires_at')->nullable();
            $table->timestamp('suspended_at')->nullable();
            $table->timestamps();

            $table->index('team_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('github_installations');
    }
};
