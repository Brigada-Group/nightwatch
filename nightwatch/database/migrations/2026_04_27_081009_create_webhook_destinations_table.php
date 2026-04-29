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
        Schema::create('webhook_destinations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('team_id')
                ->constrained('teams')
                ->cascadeOnDelete();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('name', 120);
            $table->string('provider', 32)->default('generic'); // generic|slack|discord
            $table->text('url');
            $table->string('secret', 255)->nullable();
            $table->boolean('enabled')->default(true);

            $table->json('subscribed_events');
            $table->json('filters')->nullable();

            $table->timestampTz('last_tested_at')->nullable();
            $table->unsignedSmallInteger('last_test_status')->nullable();
            $table->text('last_test_error')->nullable();

            $table->timestamps();

            $table->index(['team_id', 'enabled']);
            $table->index(['team_id', 'provider']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('webhook_destinations');
    }
};
