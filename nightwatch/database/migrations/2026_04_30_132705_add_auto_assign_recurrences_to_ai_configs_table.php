<?php

use Illuminate\Database\Migrations\Migration;

/**
 * Intentionally empty.
 *
 * Originally an unguarded duplicate of:
 *
 *   2026_04_30_231000_add_auto_assign_recurrences_to_ai_configs_table
 *
 * Running both on a fresh DB succeeded once and failed on the duplicate.
 * Running either one twice (e.g. after a half-failed deploy) also failed
 * because neither had idempotency guards.
 *
 * Fix: this migration is now a no-op; the companion 231000 migration is
 * guarded so it can run safely whether or not the column already exists.
 *
 * Outcomes per environment state:
 *   - fresh DB:               this no-ops, 231000 adds the column.
 *   - already-ran (recorded): no change.
 *   - half-failed:            this no-ops, 231000's guard sees existing
 *                              column and skips.
 */
return new class extends Migration
{
    public function up(): void
    {
        // no-op — see header docblock
    }

    public function down(): void
    {
        // no-op — see header docblock
    }
};
