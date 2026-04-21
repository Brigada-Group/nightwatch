<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hub_composer_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('environment');
            $table->string('server');
            $table->unsignedInteger('advisories_count')->default(0);
            $table->unsignedInteger('abandoned_count')->default(0);
            $table->json('advisories')->nullable();
            $table->json('abandoned')->nullable();
            $table->timestamp('sent_at');
            $table->timestamps();

            $table->index(['project_id', 'sent_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hub_composer_audits');
    }
};
