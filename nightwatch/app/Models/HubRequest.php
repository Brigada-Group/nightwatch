<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HubRequest extends Model
{
    protected $fillable = [
        'project_id',
        'environment',
        'server',
        'trace_id',
        'method',
        'uri',
        'route_name',
        'status_code',
        'duration_ms',
        'ip',
        'user_id',
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
