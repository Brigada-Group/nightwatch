<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hub_exceptions', function (Blueprint $table): void {
            if (! Schema::hasColumn('hub_exceptions', 'fingerprint')) {
                $table->char('fingerprint', 64)->nullable()->after('severity');
            }

            if (! Schema::hasColumn('hub_exceptions', 'is_recurrence')) {
                $table->boolean('is_recurrence')->default(false)->after('fingerprint');
            }

            if (! Schema::hasColumn('hub_exceptions', 'original_exception_id')) {
                $table->foreignId('original_exception_id')
                    ->nullable()
                    ->after('is_recurrence')
                    ->constrained('hub_exceptions')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('hub_exceptions', 'recurrence_count')) {
                $table->unsignedInteger('recurrence_count')->default(0)->after('original_exception_id');
            }
        });

        if (! $this->indexExists('hub_exceptions', 'hub_exceptions_recurrence_lookup_idx')) {
            Schema::table('hub_exceptions', function (Blueprint $table): void {
                $table->index(
                    ['project_id', 'fingerprint', 'task_status', 'task_finished_at'],
                    'hub_exceptions_recurrence_lookup_idx',
                );
            });
        }
    }

    public function down(): void
    {
        Schema::table('hub_exceptions', function (Blueprint $table): void {
            if ($this->indexExists('hub_exceptions', 'hub_exceptions_recurrence_lookup_idx')) {
                $table->dropIndex('hub_exceptions_recurrence_lookup_idx');
            }
            if (Schema::hasColumn('hub_exceptions', 'original_exception_id')) {
                $table->dropConstrainedForeignId('original_exception_id');
            }
            $columns = array_filter(
                ['fingerprint', 'is_recurrence', 'recurrence_count'],
                fn (string $col) => Schema::hasColumn('hub_exceptions', $col),
            );
            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }

    private function indexExists(string $table, string $indexName): bool
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            return DB::selectOne(
                "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = ? AND name = ?",
                [$table, $indexName],
            ) !== null;
        }

        if ($driver === 'mysql' || $driver === 'mariadb') {
            return DB::selectOne(
                "SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?",
                [$table, $indexName],
            ) !== null;
        }

        if ($driver === 'pgsql') {
            return DB::selectOne(
                'SELECT indexname FROM pg_indexes WHERE tablename = ? AND indexname = ?',
                [$table, $indexName],
            ) !== null;
        }

        return false;
    }
};
