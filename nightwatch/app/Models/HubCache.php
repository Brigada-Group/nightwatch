<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HubCache extends Model
{
    protected $table = 'hub_cache';

    protected $fillable = [
        'project_id',
        'environment',
        'server',
        'trace_id',
        'store',
        'hits',
        'misses',
        'writes',
        'forgets',
        'hit_rate',
        'period_start',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'hit_rate' => 'float',
            'period_start' => 'datetime',
            'sent_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
