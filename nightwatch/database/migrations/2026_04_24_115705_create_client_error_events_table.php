<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_error_events', function (Blueprint $table) {
            $table->id();
            $table->uuid('public_id')->unique();

            $table->string('project_id', 64);
            $table->string('environment', 64);
            $table->string('server', 255);
            $table->timestampTz('sent_at');

            $table->string('runtime', 32)->default('javascript');
            $table->string('exception_class', 255);
            $table->text('message');

            $table->text('source_file')->nullable();
            $table->integer('line')->default(0);
            $table->integer('colno')->nullable();

            $table->text('request_url')->nullable();
            $table->integer('status_code')->default(0);

            $table->string('ip', 45)->nullable();
            $table->text('headers')->nullable();
            $table->text('stack_trace')->nullable();
            $table->text('component_stack')->nullable();

            $table->string('severity', 32)->default('error');
            $table->json('user_payload');
            $table->string('fingerprint', 64)->nullable();

            $table->timestampTz('occurred_at');
            $table->timestampTz('received_at')->useCurrent();
            $table->jsonb('raw_payload');

            $table->index(['project_id', 'environment', 'occurred_at'], 'idx_client_errors_project_env_time');
            $table->index(['project_id', 'fingerprint', 'occurred_at'], 'idx_client_errors_fingerprint');
            $table->index(['project_id', 'exception_class', 'occurred_at'], 'idx_client_errors_exception_class');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_error_events');
    }
};
