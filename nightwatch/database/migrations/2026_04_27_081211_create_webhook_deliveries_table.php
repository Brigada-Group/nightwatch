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
        Schema::create('webhook_deliveries', function (Blueprint $table) {
            $table->id();

            $table->foreignId('destination_id')
                ->constrained('webhook_destinations')
                ->cascadeOnDelete();

            $table->string('event_type', 80);

            $table->uuid('event_id');

            $table->unsignedSmallInteger('attempt')->default(1);

            $table->json('request_headers')->nullable();
            $table->json('request_body');

            $table->unsignedSmallInteger('response_status')->nullable();
            $table->text('response_body')->nullable();

            $table->timestampTz('next_retry_at')->nullable();
            $table->timestampTz('delivered_at')->nullable();
            $table->timestampTz('failed_at')->nullable();

            $table->text('error_message')->nullable();

            $table->timestamps();

            $table->index(['destination_id', 'created_at']);
            $table->index(['event_type', 'created_at']);
            $table->index(['event_id', 'attempt']);
            $table->index(['next_retry_at']);

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('webhook_deliveries');
    }
};
