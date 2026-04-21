<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HubJob extends Model
{
    protected $fillable = [
        'project_id',
        'environment',
        'server',
        'job_class',
        'queue',
        'connection',
        'status',
        'duration_ms',
        'attempt',
        'error_message',
        'metadata',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'duration_ms' => 'float',
            'metadata' => 'array',
            'sent_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
