<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HubQuery extends Model
{
    protected $fillable = [
        'project_id',
        'environment',
        'server',
        'trace_id',
        'sql',
        'duration_ms',
        'connection',
        'file',
        'line',
        'is_slow',
        'is_n_plus_one',
        'metadata',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'duration_ms' => 'float',
            'is_slow' => 'boolean',
            'is_n_plus_one' => 'boolean',
            'metadata' => 'array',
            'sent_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
