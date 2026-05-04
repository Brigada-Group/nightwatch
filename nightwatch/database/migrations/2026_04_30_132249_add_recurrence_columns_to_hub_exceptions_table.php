<?php

use Illuminate\Database\Migrations\Migration;

/**
 * Intentionally empty.
 *
 * The original body of this migration had two issues that broke deploys:
 *   1. A literal newline accidentally embedded in the 'original_exception_id'
 *      column name passed to ->after(...), producing SQLSTATE[42S22] on
 *      MySQL ("Unknown column 'or\n  iginal_exception_id'").
 *   2. No idempotency guards — re-runs against a database where the columns
 *      already existed would fail with duplicate-column errors.
 *
 * Rather than fix both in place (which doesn't help environments where this
 * file already ran successfully and is recorded in the migrations table),
 * this migration is now a no-op and the actual work moved to the guarded
 * companion migration that runs immediately after:
 *
 *   2026_04_30_230000_add_recurrence_columns_to_hub_exceptions_table
 *
 * Outcomes per environment state:
 *   - fresh DB:               this migration no-ops, 230000 creates columns.
 *   - already-ran (recorded): no change; 230000's guards see existing columns.
 *   - half-failed:            this no-ops, 230000 fills in what's missing.
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
