<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiConfig extends Model
{
    protected $fillable = [
        'project_id',
        'use_ai',
        'self_heal',
    ];

    protected function casts(): array
    {
        return [
            'use_ai' => 'boolean',
            'self_heal' => 'boolean',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
