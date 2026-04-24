<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('team_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')
                ->constrained('teams')
                ->cascadeOnDelete();
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->cascadeOnDelete();
            $table->foreignId('role_id')
                ->constrained('roles')
                ->restrictOnDelete();
            $table->enum('status', ['pending', 'accepted', 'declined', 'revoked'])
                ->default('pending');
            $table->string('invitation_email')->nullable();
            $table->string('invitation_token', 64)->nullable()->unique();
            $table->foreignId('invited_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('invited_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('declined_at')->nullable();
            $table->timestamps();

            $table->unique(['team_id', 'user_id']);
            $table->index(['team_id', 'status']);
            $table->index('invitation_email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('team_members');
    }
};
