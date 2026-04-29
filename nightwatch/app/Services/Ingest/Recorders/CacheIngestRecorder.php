<?php

namespace App\Services\Ingest\Recorders;

use App\Events\CacheReceived;
use App\Models\HubCache;
use App\Models\Project;
use App\Services\Ingest\Contracts\IngestRecorderInterface;

final class CacheIngestRecorder implements IngestRecorderInterface
{
    public function record(Project $project, array $data): void
    {
        $cache = HubCache::create([
            'project_id' => $project->id,
            'environment' => $data['environment'],
            'server' => $data['server'],
            'store' => $data['store'],
            'hits' => $data['hits'],
            'misses' => $data['misses'],
            'writes' => $data['writes'],
            'forgets' => $data['forgets'],
            'hit_rate' => $data['hit_rate'] ?? null,
            'period_start' => $data['period_start'] ?? null,
            'sent_at' => $data['sent_at'],
        ]);

        broadcast(new CacheReceived([
            'id' => $cache->id,
            'project_id' => $project->id,
            'store' => $cache->store,
            'hits' => $cache->hits,
            'misses' => $cache->misses,
            'writes' => $cache->writes,
            'forgets' => $cache->forgets,
            'hit_rate' => $cache->hit_rate,
            'period_start' => $cache->period_start,
            'environment' => $cache->environment,
            'sent_at' => $data['sent_at'],
        ]));
    }
}
