<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformMetricSnapshot extends Model
{
    //

    public const USERS = 'users_count';

    public const TEAMS = 'teams_count';

    public const PROJECTS = 'projects_count';

    public const DB_BYTES = 'database_bytes';

    public const TELEMETRY_ROWS = 'telemetry_rows_total';

    protected $fillable = ['recorded_on', 'metric_key', 'value'];

    protected function casts(): array
    {
        return [
            'recorded_on' => 'date',
            'value' => 'string',
        ];
    }
}
