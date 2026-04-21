<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HubNpmAudit extends Model
{
    protected $fillable = [
        'project_id',
        'environment',
        'server',
        'total_vulnerabilities',
        'info_count',
        'low_count',
        'moderate_count',
        'high_count',
        'critical_count',
        'vulnerabilities',
        'audit_metadata',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'vulnerabilities' => 'array',
            'audit_metadata' => 'array',
            'sent_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
