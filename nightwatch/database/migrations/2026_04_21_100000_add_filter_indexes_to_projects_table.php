<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->index('name', 'projects_name_idx');
            $table->index('status', 'projects_status_idx');
            $table->index('environment', 'projects_environment_idx');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropIndex('projects_name_idx');
            $table->dropIndex('projects_status_idx');
            $table->dropIndex('projects_environment_idx');
        });
    }
};
