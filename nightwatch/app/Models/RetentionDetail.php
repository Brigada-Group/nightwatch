<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RetentionDetail extends Model
{
    public const SUPPORTED_TABLES = [
        'hub_logs',
        'hub_cache',
        'hub_queries',
        'hub_requests',
    ];

    protected $fillable = [
        'table_name',
        'is_enabled',
        'run_interval_days',
        'retention_days',
    ];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'run_interval_days' => 'integer',
            'retention_days' => 'integer',
        ];
    }

    public static function supportedTables(): array
    {
        return self::SUPPORTED_TABLES;
    }

    public function scopeInstances($query)
    {
        return $query->whereIn('table_name', self::SUPPORTED_TABLES);
    }
}
