<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HubCommand extends Model
{
    protected $fillable = [
        'project_id',
        'environment',
        'server',
        'command',
        'exit_code',
        'duration_ms',
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
