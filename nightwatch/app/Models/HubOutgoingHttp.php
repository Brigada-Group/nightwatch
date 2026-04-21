<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HubOutgoingHttp extends Model
{
    protected $table = 'hub_outgoing_http';

    protected $fillable = [
        'project_id',
        'environment',
        'server',
        'method',
        'url',
        'host',
        'status_code',
        'duration_ms',
        'failed',
        'error_message',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'duration_ms' => 'float',
            'failed' => 'boolean',
            'sent_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
