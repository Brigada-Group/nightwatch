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
        Schema::create('platform_metric_snapshots', function (Blueprint $table) {
            $table->id();

            $table->date('recorded_on');
            $table->string('metric_key', 64);
            $table->decimal('value', 24, 4);

            $table->timestamps();
            $table->unique(['recorded_on', 'metric_key']);
            $table->index('recorded_on');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('platform_metric_snapshots');
    }
};
