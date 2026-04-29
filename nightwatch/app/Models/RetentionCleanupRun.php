<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RetentionCleanupRun extends Model
{
    protected $fillable = [
        'cleanup_key',
        'last_ran_at',
        'last_deleted_rows',
        'last_retention_days',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'last_ran_at' => 'datetime',
            'last_deleted_rows' => 'integer',
            'last_retention_days' => 'integer',
        ];
    }
}
