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
        Schema::table('hub_exceptions', function (Blueprint $table) {
            //
            $table->char('fingerprint',64)->nullable()->after('severity');

            $table->boolean('is_recurrence')->default(false)->after('fingerprint');
            
            $table->foreignId('original_exception_id')                        
                ->nullable()
                ->after('is_recurrence')                                      
                ->constrained('hub_exceptions')
                ->nullOnDelete();  

            $table->unsignedInteger('recurrence_count')->default(0)->after('or
  iginal_exception_id');  

            $table->index(
                ['project_id','fingerprint','task_status','task_finished_at'],
                'hub_exceptions_recurrence_lookup_idx',
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hub_exceptions', function (Blueprint $table): void {
            $table->dropIndex('hub_exceptions_recurrence_lookup_idx');        
            $table->dropConstrainedForeignId('original_exception_id');
            $table->dropColumn(['fingerprint', 'is_recurrence',               
'recurrence_count']);
        }); 
    }
};
