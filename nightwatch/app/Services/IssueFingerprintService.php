<?php

namespace App\Services;

use App\Models\HubQuery;
use App\Models\HubRequest;
use App\Models\HubIssue;
use InvalidArgumentException;

/**
 * Computes a stable fingerprint for slow_query and slow_request issues. Two
 * occurrences with the same fingerprint collapse into one chain in
 * IssueRecurrenceService.
 *
 * The shape mirrors ExceptionFingerprintService::compute() — same hashing
 * primitive (sha256 over a "key:value|" wire) and the same normalization
 * approach for free-text fields (collapse digits → <num>, strip UUIDs).
 */
class IssueFingerprintService
{
    public function forSource(string $sourceType, object $source): string
    {
        return match ($sourceType) {
            HubIssue::SOURCE_SLOW_QUERY => $this->forSlowQuery($source),
            HubIssue::SOURCE_SLOW_REQUEST => $this->forSlowRequest($source),
            default => throw new InvalidArgumentException("Unknown source_type: {$sourceType}"),
        };
    }

    public function forSlowQuery(HubQuery $query): string
    {
        $parts = [
            't:'.HubIssue::SOURCE_SLOW_QUERY,
            'p:'.$query->project_id,
            'c:'.($query->connection ?? ''),
            'f:'.($query->file ?? ''),
            'l:'.($query->line ?? ''),
            's:'.$this->normalizeSql((string) $query->sql),
        ];

        return hash('sha256', implode('|', $parts));
    }

    public function forSlowRequest(HubRequest $request): string
    {
        // Routes are the strongest grouping key when present; fall back to
        // (method + normalized URI). Status bucket (5xx vs 4xx) is included so
        // a route's success and error variants don't collapse into one issue.
        $key = $request->route_name
            ?: ($request->method.' '.$this->normalizeUri((string) $request->uri));

        $parts = [
            't:'.HubIssue::SOURCE_SLOW_REQUEST,
            'p:'.$request->project_id,
            'k:'.$key,
            'b:'.$this->statusBucket((int) $request->status_code),
        ];

        return hash('sha256', implode('|', $parts));
    }

    /**
     * Normalize SQL so semantically-identical queries collapse:
     *   - lowercase keywords
     *   - strip bound-parameter placeholders (?, :name, $1)
     *   - replace numeric literals with <num>
     *   - replace UUIDs with <uuid>
     *   - collapse whitespace
     */
    private function normalizeSql(string $sql): string
    {
        $sql = preg_replace(
            '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i',
            '<uuid>',
            $sql,
        );

        $sql = preg_replace('/\b\d+\b/', '<num>', (string) $sql);
        $sql = preg_replace('/:\w+|\$\d+/', '?', (string) $sql);
        $sql = preg_replace('/\s+/', ' ', (string) $sql);

        return trim(strtolower((string) $sql));
    }

    /**
     * Normalize URIs: collapse numeric path segments to :id so /users/42 and
     * /users/9001 fingerprint identically.
     */
    private function normalizeUri(string $uri): string
    {
        $uri = preg_replace('/\?.*$/', '', $uri);
        $uri = preg_replace(
            '#/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=/|$)#i',
            '/:uuid',
            (string) $uri,
        );
        $uri = preg_replace('#/\d+(?=/|$)#', '/:id', (string) $uri);

        return strtolower((string) $uri);
    }

    private function statusBucket(int $code): string
    {
        return match (true) {
            $code >= 500 => '5xx',
            $code >= 400 => '4xx',
            $code >= 300 => '3xx',
            $code >= 200 => '2xx',
            default => 'other',
        };
    }
}
