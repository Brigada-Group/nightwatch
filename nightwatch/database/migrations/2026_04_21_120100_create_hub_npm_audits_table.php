<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hub_npm_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('environment');
            $table->string('server');
            $table->unsignedInteger('total_vulnerabilities')->default(0);
            $table->unsignedInteger('info_count')->default(0);
            $table->unsignedInteger('low_count')->default(0);
            $table->unsignedInteger('moderate_count')->default(0);
            $table->unsignedInteger('high_count')->default(0);
            $table->unsignedInteger('critical_count')->default(0);
            $table->json('vulnerabilities')->nullable();
            $table->json('audit_metadata')->nullable();
            $table->timestamp('sent_at');
            $table->timestamps();

            $table->index(['project_id', 'sent_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hub_npm_audits');
    }
};
