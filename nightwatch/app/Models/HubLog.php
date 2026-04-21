<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HubLog extends Model
{
    protected $fillable = [
        'project_id',
        'environment',
        'server',
        'level',
        'message',
        'channel',
        'context',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'context' => 'array',
            'sent_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
