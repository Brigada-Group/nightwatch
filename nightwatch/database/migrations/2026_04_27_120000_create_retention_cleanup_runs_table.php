<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('retention_cleanup_runs', function (Blueprint $table) {
            $table->id();
            $table->string('cleanup_key', 120)->unique();
            $table->timestamp('last_ran_at')->nullable();
            $table->unsignedInteger('last_deleted_rows')->default(0);
            $table->unsignedInteger('last_retention_days')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('retention_cleanup_runs');
    }
};
