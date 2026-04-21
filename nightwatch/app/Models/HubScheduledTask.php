<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HubScheduledTask extends Model
{
    protected $fillable = [
        'project_id',
        'environment',
        'server',
        'task',
        'description',
        'expression',
        'status',
        'duration_ms',
        'output',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'duration_ms' => 'float',
            'sent_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
