<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! $this->indexExists('hub_outgoing_http', 'hub_outgoing_http_project_sent_at_idx')) {
            Schema::table('hub_outgoing_http', function (Blueprint $table): void {
                $table->index(['project_id', 'sent_at'], 'hub_outgoing_http_project_sent_at_idx');
            });
        }

        if (! $this->indexExists('hub_cache', 'hub_cache_project_sent_at_idx')) {
            Schema::table('hub_cache', function (Blueprint $table): void {
                $table->index(['project_id', 'sent_at'], 'hub_cache_project_sent_at_idx');
            });
        }
    }

    public function down(): void
    {
        if ($this->indexExists('hub_outgoing_http', 'hub_outgoing_http_project_sent_at_idx')) {
            Schema::table('hub_outgoing_http', function (Blueprint $table): void {
                $table->dropIndex('hub_outgoing_http_project_sent_at_idx');
            });
        }

        if ($this->indexExists('hub_cache', 'hub_cache_project_sent_at_idx')) {
            Schema::table('hub_cache', function (Blueprint $table): void {
                $table->dropIndex('hub_cache_project_sent_at_idx');
            });
        }
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
