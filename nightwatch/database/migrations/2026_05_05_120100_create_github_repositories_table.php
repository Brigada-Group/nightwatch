<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('github_repositories', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('github_installation_id')
                ->constrained('github_installations')
                ->cascadeOnDelete();
            $table->foreignId('project_id')
                ->nullable()
                ->constrained('projects')
                ->nullOnDelete();
            $table->unsignedBigInteger('github_repo_id');
            $table->string('full_name');
            $table->string('name');
            $table->string('default_branch')->nullable();
            $table->boolean('private')->default(false);
            $table->timestamp('pushed_at')->nullable();
            $table->timestamps();

            $table->unique(['github_installation_id', 'github_repo_id']);
            $table->index('project_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('github_repositories');
    }
};
