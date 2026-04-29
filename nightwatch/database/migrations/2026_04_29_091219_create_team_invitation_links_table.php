<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('team_invitation_links', function (Blueprint $table) {
            $table->id();

            $table->foreignId('team_id')
                ->constrained('teams')
                ->cascadeOnDelete();
            $table->foreignId('role_id')
                ->constrained('roles')
                ->restrictOnDelete();

            $table->string('token_hash', 64)->unique();
            $table->string('token_prefix', 12);

            $table->unsignedInteger('max_uses')->nullable();
            $table->unsignedInteger('uses_count')->default(0);

            $table->timestamp('revoked_at')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at');

            $table->timestamps();

            $table->index(['team_id', 'expires_at']);
            $table->index(['team_id', 'revoked_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('team_invitation_links');
    }
};
