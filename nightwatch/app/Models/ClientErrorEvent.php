<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ClientErrorEvent extends Model
{
    public $timestamps = false;

    protected static function booted(): void
    {
        static::creating(function (ClientErrorEvent $event): void {
            if (! $event->public_id) {
                $event->public_id = (string) Str::uuid();
            }
        });
    }

    protected $fillable = [
        'public_id',
        'project_id',
        'environment',
        'server',
        'sent_at',
        'runtime',
        'exception_class',
        'message',
        'source_file',
        'line',
        'colno',
        'request_url',
        'status_code',
        'ip',
        'headers',
        'stack_trace',
        'component_stack',
        'severity',
        'user_payload',
        'fingerprint',
        'occurred_at',
        'received_at',
        'raw_payload',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'occurred_at' => 'datetime',
        'received_at' => 'datetime',
        'user_payload' => 'array',
        'raw_payload' => 'array',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id', 'project_uuid');
    }
}
