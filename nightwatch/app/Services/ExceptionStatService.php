<?php

namespace App\Services;

use App\Models\HubException;
use App\Models\Team;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Manager-side analytics for the /tasks page. Each public method answers a
 * single question and returns plain arrays that serialize cleanly into Inertia
 * props — no Eloquent collections leaking out, no view concerns. The
 * controller composes these for the page.
 */
class ExceptionStatService
{
    /**
     * Aggregate counts for the kanban statuses, plus a derived resolution
     * rate. NULL task_status values are bucketed as 'started' for backwards
     * compatibility with rows assigned before the feature shipped.
     *
     * @return array{
     *     started: int,
     *     ongoing: int,
     *     finished: int,
     *     total: int,
     *     resolution_rate: float
     * }
     */
    public function statusCounts(Team $team): array
    {
        $teamProjectIds = $this->teamProjectIds($team);

        if ($teamProjectIds === []) {
            return $this->emptyStatusCounts();
        }

        $rows = HubException::query()
            ->whereIn('project_id', $teamProjectIds)
            ->whereNotNull('assigned_to')
            ->selectRaw(
                "COALESCE(task_status, ?) AS bucket, COUNT(*) AS total",
                [HubException::TASK_STATUS_STARTED],
            )
            ->groupBy('bucket')
            ->pluck('total', 'bucket');

        $started = (int) ($rows[HubException::TASK_STATUS_STARTED] ?? 0);
        $ongoing = (int) ($rows[HubException::TASK_STATUS_ONGOING] ?? 0);
        $finished = (int) ($rows[HubException::TASK_STATUS_FINISHED] ?? 0);
        $total = $started + $ongoing + $finished;

        return [
            'started' => $started,
            'ongoing' => $ongoing,
            'finished' => $finished,
            'total' => $total,
            'resolution_rate' => $total > 0 ? round($finished / $total, 4) : 0.0,
        ];
    }

    /**
     * Top-N developers by resolved exception count within the team. Useful
     * for celebrating throughput without exposing every contributor.
     *
     * @return list<array{user: array{id: int, name: string, email: string}, resolved_count: int}>
     */
    public function topResolvers(Team $team, int $limit = 5): array
    {
        $teamProjectIds = $this->teamProjectIds($team);

        if ($teamProjectIds === []) {
            return [];
        }

        $rows = HubException::query()
            ->join('users', 'users.id', '=', 'hub_exceptions.assigned_to')
            ->whereIn('hub_exceptions.project_id', $teamProjectIds)
            ->where('hub_exceptions.task_status', HubException::TASK_STATUS_FINISHED)
            ->select(
                'users.id as user_id',
                'users.name as user_name',
                'users.email as user_email',
                DB::raw('COUNT(hub_exceptions.id) as resolved_count'),
            )
            ->groupBy('users.id', 'users.name', 'users.email')
            ->orderByDesc('resolved_count')
            ->limit(max(1, $limit))
            ->get();

        return $rows->map(fn ($row): array => [
            'user' => [
                'id' => (int) $row->user_id,
                'name' => (string) $row->user_name,
                'email' => (string) $row->user_email,
            ],
            'resolved_count' => (int) $row->resolved_count,
        ])->all();
    }

    /**
     * Resolutions grouped by ISO week for the trailing $weeks weeks (inclusive
     * of the current week). Always returns exactly $weeks entries — gaps are
     * filled with zero-counts so the chart renders a continuous timeline.
     *
     * @return list<array{week_start: string, label: string, count: int}>
     */
    public function weeklyResolutions(Team $team, int $weeks = 8): array
    {
        $weeks = max(1, $weeks);
        $teamProjectIds = $this->teamProjectIds($team);
        $startOfWindow = CarbonImmutable::now()->startOfWeek()->subWeeks($weeks - 1);

        $skeleton = $this->buildWeekSkeleton($startOfWindow, $weeks);

        if ($teamProjectIds === []) {
            return array_values($skeleton);
        }

        $finishedRows = HubException::query()
            ->whereIn('project_id', $teamProjectIds)
            ->where('task_status', HubException::TASK_STATUS_FINISHED)
            ->whereNotNull('task_finished_at')
            ->where('task_finished_at', '>=', $startOfWindow)
            ->get(['task_finished_at']);

        foreach ($finishedRows as $row) {
            $weekStart = CarbonImmutable::parse($row->task_finished_at)
                ->startOfWeek()
                ->toDateString();

            if (isset($skeleton[$weekStart])) {
                $skeleton[$weekStart]['count']++;
            }
        }

        return array_values($skeleton);
    }

    /**
     * @return array<string, array{week_start: string, label: string, count: int}>
     */
    private function buildWeekSkeleton(CarbonImmutable $start, int $weeks): array
    {
        $skeleton = [];

        for ($i = 0; $i < $weeks; $i++) {
            $weekStart = $start->addWeeks($i);
            $key = $weekStart->toDateString();
            $skeleton[$key] = [
                'week_start' => $key,
                'label' => $weekStart->format('M j'),
                'count' => 0,
            ];
        }

        return $skeleton;
    }

    /**
     * @return list<int>
     */
    private function teamProjectIds(Team $team): array
    {
        return $team->projects()
            ->pluck('projects.id')
            ->map(static fn ($id) => (int) $id)
            ->all();
    }

    /**
     * @return array{
     *     started: int,
     *     ongoing: int,
     *     finished: int,
     *     total: int,
     *     resolution_rate: float
     * }
     */
    private function emptyStatusCounts(): array
    {
        return [
            'started' => 0,
            'ongoing' => 0,
            'finished' => 0,
            'total' => 0,
            'resolution_rate' => 0.0,
        ];
    }
}
