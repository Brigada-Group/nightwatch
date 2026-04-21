<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HubComposerAudit extends Model
{
    protected $fillable = [
        'project_id',
        'environment',
        'server',
        'advisories_count',
        'abandoned_count',
        'advisories',
        'abandoned',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'advisories' => 'array',
            'abandoned' => 'array',
            'sent_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
