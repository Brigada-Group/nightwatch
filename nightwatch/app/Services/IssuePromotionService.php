<?php

namespace App\Services;

use App\Models\HubIssue;
use App\Models\HubQuery;
use App\Models\HubRequest;

/**
 * Decides whether an ingested event row deserves to become an issue, then
 * creates the hub_issues row + runs IssueRecurrenceService::reconcile() to
 * collapse duplicates.
 *
 * Thresholds are intentionally simple for phase 1:
 *   - slow_query:   is_slow OR is_n_plus_one (already flagged by ingest)
 *   - slow_request: 5xx status OR duration_ms > SLOW_REQUEST_THRESHOLD_MS
 *
 * Per-project thresholds can be added later via AiConfig or a dedicated
 * issue_thresholds table without changing this surface area.
 */
class IssuePromotionService
{
    private const SLOW_REQUEST_THRESHOLD_MS = 2000;

    public function __construct(
        private readonly IssueFingerprintService $fingerprints,
        private readonly IssueRecurrenceService $recurrence,
    ) {}

    /**
     * @return HubIssue|null The issue (kept or merged into chain anchor),
     *                       or null if the event didn't meet promotion criteria.
     *                       When null, no issue exists for this event.
     */
    public function promoteSlowQuery(HubQuery $query): ?HubIssue
    {
        if (! $this->qualifiesForSlowQuery($query)) {
            return null;
        }

        $fingerprint = $this->fingerprints->forSlowQuery($query);

        $issue = HubIssue::create([
            'project_id' => $query->project_id,
            'source_type' => HubIssue::SOURCE_SLOW_QUERY,
            'source_id' => $query->id,
            'summary' => $this->summaryForSlowQuery($query),
            'severity' => $query->is_n_plus_one ? 'error' : 'warning',
            'fingerprint' => $fingerprint,
            'is_recurrence' => false,
            'recurrence_count' => 0,
            'first_seen_at' => $query->sent_at ?? now(),
            'last_seen_at' => $query->sent_at ?? now(),
        ]);

        $this->recurrence->reconcile($issue);

        // After reconcile() the row may be deleted (duplicate). Always re-read
        // by fingerprint so callers get the canonical chain anchor.
        return HubIssue::query()
            ->where('project_id', $query->project_id)
            ->where('fingerprint', $fingerprint)
            ->first();
    }

    public function promoteSlowRequest(HubRequest $request): ?HubIssue
    {
        if (! $this->qualifiesForSlowRequest($request)) {
            return null;
        }

        $fingerprint = $this->fingerprints->forSlowRequest($request);

        $issue = HubIssue::create([
            'project_id' => $request->project_id,
            'source_type' => HubIssue::SOURCE_SLOW_REQUEST,
            'source_id' => $request->id,
            'summary' => $this->summaryForSlowRequest($request),
            'severity' => $request->status_code >= 500 ? 'error' : 'warning',
            'fingerprint' => $fingerprint,
            'is_recurrence' => false,
            'recurrence_count' => 0,
            'first_seen_at' => $request->sent_at ?? now(),
            'last_seen_at' => $request->sent_at ?? now(),
        ]);

        $this->recurrence->reconcile($issue);

        return HubIssue::query()
            ->where('project_id', $request->project_id)
            ->where('fingerprint', $fingerprint)
            ->first();
    }

    private function qualifiesForSlowQuery(HubQuery $query): bool
    {
        return (bool) $query->is_slow || (bool) $query->is_n_plus_one;
    }

    private function qualifiesForSlowRequest(HubRequest $request): bool
    {
        if ((int) $request->status_code >= 500) {
            return true;
        }

        return (float) ($request->duration_ms ?? 0) > self::SLOW_REQUEST_THRESHOLD_MS;
    }

    private function summaryForSlowQuery(HubQuery $query): string
    {
        $sql = trim((string) $query->sql);
        $sql = preg_replace('/\s+/', ' ', $sql) ?? $sql;

        if (mb_strlen($sql) > 240) {
            $sql = mb_substr($sql, 0, 239).'…';
        }

        $tags = [];
        if ($query->is_n_plus_one) $tags[] = 'N+1';
        if ($query->is_slow) $tags[] = 'slow';

        $duration = number_format((float) ($query->duration_ms ?? 0), 0);

        return sprintf(
            '%s (%sms%s)',
            $sql,
            $duration,
            $tags === [] ? '' : ' · '.implode(' · ', $tags),
        );
    }

    private function summaryForSlowRequest(HubRequest $request): string
    {
        $duration = number_format((float) ($request->duration_ms ?? 0), 0);

        return sprintf(
            '%s %s → %d (%sms)',
            $request->method,
            mb_substr((string) $request->uri, 0, 200),
            (int) $request->status_code,
            $duration,
        );
    }
}
