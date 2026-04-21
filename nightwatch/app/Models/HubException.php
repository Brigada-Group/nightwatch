<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HubException extends Model
{
    protected $fillable = [
        'project_id',
        'environment',
        'server',
        'exception_class',
        'message',
        'file',
        'line',
        'url',
        'status_code',
        'user',
        'ip',
        'headers',
        'stack_trace',
        'severity',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
