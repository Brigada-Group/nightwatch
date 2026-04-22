<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

/**
 * DB-portable date-part expressions for insights aggregations.
 * Reuses the same dialect switch DashboardMetricsService already uses for
 * hourly/daily buckets. Day-of-week output is normalised to 0 = Sunday .. 6 = Saturday.
 */
final class InsightsSqlDialect
{
    public static function hourlyBucket(string $column): string
    {
        return match (DB::connection()->getDriverName()) {
            'sqlite' => "strftime('%Y-%m-%d %H', {$column})",
            'mysql', 'mariadb' => "DATE_FORMAT({$column}, '%Y-%m-%d %H')",
            'pgsql' => "to_char({$column}, 'YYYY-MM-DD HH24')",
            'sqlsrv' => "FORMAT({$column}, 'yyyy-MM-dd HH')",
            default => "strftime('%Y-%m-%d %H', {$column})",
        };
    }

    public static function dayOfWeek(string $column): string
    {
        return match (DB::connection()->getDriverName()) {
            'sqlite' => "CAST(strftime('%w', {$column}) AS INTEGER)",
            'mysql', 'mariadb' => "DAYOFWEEK({$column}) - 1",
            'pgsql' => "EXTRACT(DOW FROM {$column})::int",
            'sqlsrv' => "DATEPART(weekday, {$column}) - 1",
            default => "CAST(strftime('%w', {$column}) AS INTEGER)",
        };
    }

    public static function hourOfDay(string $column): string
    {
        return match (DB::connection()->getDriverName()) {
            'sqlite' => "CAST(strftime('%H', {$column}) AS INTEGER)",
            'mysql', 'mariadb' => "HOUR({$column})",
            'pgsql' => "EXTRACT(HOUR FROM {$column})::int",
            'sqlsrv' => "DATEPART(hour, {$column})",
            default => "CAST(strftime('%H', {$column}) AS INTEGER)",
        };
    }
}
