<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Three-table alerting schema:
 *
 * 1. alert_rules — declarative rule definitions. Each row is one rule the
 *    cron evaluator runs every minute. Rules are team-scoped; project_id is
 *    nullable so a rule can target every project in the team.
 *
 * 2. alert_rule_destinations — fan-out targets when a rule fires. Phase 1
 *    only supports webhook destinations (reuses the existing
 *    webhook_destinations table). Email + in-app rows can land later
 *    without schema changes — destination_type discriminates.
 *
 * 3. alert_rule_firings — append-only log of every fire. Each fire row is
 *    closed (resolved_at set) when the rule transitions back to not-firing.
 *    The "currently firing" state lives ON THE RULE (is_currently_firing +
 *    last_fired_at) so the cron can decide cheaply without a join.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alert_rules', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('team_id')->constrained('teams')->cascadeOnDelete();
            // Null = applies to every project in the team. Otherwise scoped.
            $table->foreignId('project_id')
                ->nullable()
                ->constrained('projects')
                ->cascadeOnDelete();
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('name', 120);
            // 'error_rate' | 'new_exception_class' | future types.
            $table->string('type', 40);
            // Type-specific configuration (threshold, operator, class pattern...).
            $table->json('params');

            // How far back the evaluator looks. Aggregate rules need this.
            $table->unsignedInteger('window_seconds')->default(300);
            // Minimum gap between repeat fires after a resolve.
            $table->unsignedInteger('cooldown_seconds')->default(300);
            // Routed downstream (Slack/Discord/email severity rendering).
            $table->string('severity', 20)->default('warning');

            $table->boolean('is_enabled')->default(true);

            // Sticky firing state — flipped by the engine, NOT the user.
            $table->boolean('is_currently_firing')->default(false);
            $table->timestamp('last_fired_at')->nullable();
            $table->timestamp('last_resolved_at')->nullable();
            // The latest open firing's id (or last closed one, depending on
            // is_currently_firing). Lets the engine update resolved_at without
            // a search.
            $table->unsignedBigInteger('last_firing_id')->nullable();

            $table->timestamps();

            $table->index(['team_id', 'is_enabled'], 'alert_rules_team_enabled_idx');
            $table->index('project_id', 'alert_rules_project_idx');
            $table->index('is_currently_firing', 'alert_rules_firing_idx');
        });

        Schema::create('alert_rule_destinations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('alert_rule_id')
                ->constrained('alert_rules')
                ->cascadeOnDelete();

            // 'webhook' for phase 1. Phase 3: 'email', 'in-app'.
            $table->string('destination_type', 20);

            $table->foreignId('webhook_destination_id')
                ->nullable()
                ->constrained('webhook_destinations')
                ->cascadeOnDelete();
            $table->string('email', 255)->nullable();

            $table->timestamps();

            $table->index('alert_rule_id', 'alert_rule_destinations_rule_idx');
        });

        Schema::create('alert_rule_firings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('alert_rule_id')
                ->constrained('alert_rules')
                ->cascadeOnDelete();

            $table->timestamp('fired_at');
            $table->timestamp('resolved_at')->nullable();

            // Aggregate count of matched rows when the rule fired (e.g. 12
            // exceptions within window). Useful for Slack/email rendering.
            $table->unsignedInteger('matched_count')->default(0);

            // Type-specific evaluation context (e.g. exception_class for
            // new_exception_class rules, sample exception ids for error_rate).
            $table->json('context')->nullable();

            // Per-destination success/failure summary. Lets the UI surface
            // "1 of 2 webhooks failed" without re-fetching from the receiver.
            $table->json('notification_status')->nullable();

            $table->timestamps();

            $table->index(['alert_rule_id', 'fired_at'], 'alert_rule_firings_rule_fired_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alert_rule_firings');
        Schema::dropIfExists('alert_rule_destinations');
        Schema::dropIfExists('alert_rules');
    }
};
