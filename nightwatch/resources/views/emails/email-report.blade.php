@php
    use Illuminate\Support\Carbon;
    use Illuminate\Support\Str;

    $summary = $report['summary'] ?? [];
    $sections = $report['sections'] ?? [];
    $window = $report['window'] ?? [];
    $scope = $report['scope'] ?? ['all' => true, 'projects' => []];

    $windowLabels = [
        'daily' => 'last 24 hours',
        'weekly' => 'last 7 days',
        'monthly' => 'last 30 days',
    ];
    $windowLabel = $windowLabels[$window['label'] ?? 'daily'] ?? 'recent activity';

    $fromLabel = isset($window['from']) ? Carbon::parse($window['from'])->format('M j, Y H:i \U\T\C') : '';
    $toLabel = isset($window['to']) ? Carbon::parse($window['to'])->format('M j, Y H:i \U\T\C') : '';

    $fmtNumber = static fn ($n) => number_format((int) $n);

    $tableCss = 'width:100%;border-collapse:collapse;margin-top:8px;font-size:14px;';
    $thCss = 'text-align:left;padding:8px 10px;border-bottom:1px solid #dddddd;font-weight:600;color:#333333;background-color:#f5f5f5;';
    $tdCss = 'padding:8px 10px;border-bottom:1px solid #eeeeee;color:#333333;vertical-align:top;';
    $numCss = 'padding:8px 10px;border-bottom:1px solid #eeeeee;color:#333333;text-align:right;';
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $appName }} {{ ucfirst($window['label'] ?? 'daily') }} report</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#333333;line-height:1.5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
        <tr>
            <td align="center" style="padding:24px 16px;">
                <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:640px;">

                    {{-- Heading --}}
                    <tr>
                        <td style="padding-bottom:8px;border-bottom:2px solid #333333;">
                            <h1 style="margin:0;font-size:20px;color:#111111;">{{ $appName }} {{ ucfirst($window['label'] ?? 'daily') }} Report</h1>
                            <p style="margin:4px 0 0 0;font-size:13px;color:#666666;">Period: {{ $fromLabel }} &ndash; {{ $toLabel }} ({{ $windowLabel }})</p>
                        </td>
                    </tr>

                    {{-- Scope --}}
                    <tr>
                        <td style="padding:16px 0 0 0;">
                            <p style="margin:0;font-size:14px;color:#333333;">
                                <strong>Projects included:</strong>
                                @if ($scope['all'] ?? true)
                                    All monitored projects
                                @else
                                    @if (empty($scope['projects']))
                                        <em>No projects selected.</em>
                                    @else
                                        {{ collect($scope['projects'])->pluck('name')->implode(', ') }}
                                    @endif
                                @endif
                            </p>
                        </td>
                    </tr>

                    {{-- Summary --}}
                    <tr>
                        <td style="padding-top:20px;">
                            <h2 style="margin:0 0 4px 0;font-size:16px;color:#111111;">Summary</h2>
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="{{ $tableCss }}">
                                <tbody>
                                    <tr>
                                        <td style="{{ $tdCss }}">Total exceptions</td>
                                        <td style="{{ $numCss }}">{{ $fmtNumber($summary['total_exceptions'] ?? 0) }}</td>
                                    </tr>
                                    <tr>
                                        <td style="{{ $tdCss }}">Critical exceptions</td>
                                        <td style="{{ $numCss }}">{{ $fmtNumber($summary['critical_exceptions'] ?? 0) }}</td>
                                    </tr>
                                    <tr>
                                        <td style="{{ $tdCss }}">Total requests</td>
                                        <td style="{{ $numCss }}">{{ $fmtNumber($summary['total_requests'] ?? 0) }}</td>
                                    </tr>
                                    <tr>
                                        <td style="{{ $tdCss }}">5xx responses</td>
                                        <td style="{{ $numCss }}">{{ $fmtNumber($summary['failed_requests'] ?? 0) }}</td>
                                    </tr>
                                    <tr>
                                        <td style="{{ $tdCss }}">Average response time</td>
                                        <td style="{{ $numCss }}">{{ $fmtNumber($summary['avg_response_time_ms'] ?? 0) }} ms</td>
                                    </tr>
                                    <tr>
                                        <td style="{{ $tdCss }}">Failed jobs</td>
                                        <td style="{{ $numCss }}">{{ $fmtNumber($summary['failed_jobs'] ?? 0) }}</td>
                                    </tr>
                                    <tr>
                                        <td style="{{ $tdCss }}">Slow queries</td>
                                        <td style="{{ $numCss }}">{{ $fmtNumber($summary['slow_queries'] ?? 0) }}</td>
                                    </tr>
                                    <tr>
                                        <td style="{{ $tdCss }}">Outgoing HTTP failures</td>
                                        <td style="{{ $numCss }}">{{ $fmtNumber($summary['failed_outgoing_http'] ?? 0) }}</td>
                                    </tr>
                                    <tr>
                                        <td style="{{ $tdCss }}">Health check failures</td>
                                        <td style="{{ $numCss }}">{{ $fmtNumber($summary['health_failures'] ?? 0) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>

                    {{-- Exceptions --}}
                    @if (!empty($sections['exceptions']))
                        <tr>
                            <td style="padding-top:24px;">
                                <h2 style="margin:0 0 4px 0;font-size:16px;color:#111111;">Top exceptions</h2>
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="{{ $tableCss }}">
                                    <thead>
                                        <tr>
                                            <th style="{{ $thCss }}">Class</th>
                                            <th style="{{ $thCss }}">Severity</th>
                                            <th style="{{ $thCss }};text-align:right;">Count</th>
                                            <th style="{{ $thCss }};text-align:right;">Last seen</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @foreach ($sections['exceptions'] as $row)
                                            <tr>
                                                <td style="{{ $tdCss }};font-family:Consolas,Menlo,monospace;font-size:13px;">{{ $row['exception_class'] }}</td>
                                                <td style="{{ $tdCss }}">{{ strtoupper($row['severity']) }}</td>
                                                <td style="{{ $numCss }}">{{ $fmtNumber($row['count']) }}</td>
                                                <td style="{{ $numCss }}">{{ $row['last_seen'] ? Carbon::parse($row['last_seen'])->format('M j, H:i') : '-' }}</td>
                                            </tr>
                                        @endforeach
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    @endif

                    {{-- Requests --}}
                    @if (!empty($sections['requests']))
                        <tr>
                            <td style="padding-top:24px;">
                                <h2 style="margin:0 0 4px 0;font-size:16px;color:#111111;">Slowest requests</h2>
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="{{ $tableCss }}">
                                    <thead>
                                        <tr>
                                            <th style="{{ $thCss }}">Method</th>
                                            <th style="{{ $thCss }}">URI</th>
                                            <th style="{{ $thCss }};text-align:right;">Status</th>
                                            <th style="{{ $thCss }};text-align:right;">Duration</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @foreach ($sections['requests'] as $row)
                                            <tr>
                                                <td style="{{ $tdCss }}">{{ $row['method'] }}</td>
                                                <td style="{{ $tdCss }};font-family:Consolas,Menlo,monospace;font-size:13px;">{{ $row['uri'] }}</td>
                                                <td style="{{ $numCss }}">{{ $row['status_code'] ?? '-' }}</td>
                                                <td style="{{ $numCss }}">{{ number_format($row['duration_ms'], 1) }} ms</td>
                                            </tr>
                                        @endforeach
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    @endif

                    {{-- Queries --}}
                    @if (!empty($sections['queries']))
                        <tr>
                            <td style="padding-top:24px;">
                                <h2 style="margin:0 0 4px 0;font-size:16px;color:#111111;">Slowest queries</h2>
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="{{ $tableCss }}">
                                    <thead>
                                        <tr>
                                            <th style="{{ $thCss }}">SQL</th>
                                            <th style="{{ $thCss }}">Connection</th>
                                            <th style="{{ $thCss }};text-align:right;">Duration</th>
                                            <th style="{{ $thCss }}">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @foreach ($sections['queries'] as $row)
                                            <tr>
                                                <td style="{{ $tdCss }};font-family:Consolas,Menlo,monospace;font-size:13px;">{{ Str::limit($row['sql'], 200) }}</td>
                                                <td style="{{ $tdCss }}">{{ $row['connection'] }}</td>
                                                <td style="{{ $numCss }}">{{ number_format($row['duration_ms'], 1) }} ms</td>
                                                <td style="{{ $tdCss }}">{{ $row['is_n_plus_one'] ? 'N+1' : '' }}</td>
                                            </tr>
                                        @endforeach
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    @endif

                    {{-- Failed jobs --}}
                    @if (!empty($sections['jobs']))
                        <tr>
                            <td style="padding-top:24px;">
                                <h2 style="margin:0 0 4px 0;font-size:16px;color:#111111;">Failed jobs</h2>
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="{{ $tableCss }}">
                                    <thead>
                                        <tr>
                                            <th style="{{ $thCss }}">Job class</th>
                                            <th style="{{ $thCss }}">Queue</th>
                                            <th style="{{ $thCss }};text-align:right;">Failures</th>
                                            <th style="{{ $thCss }};text-align:right;">Last seen</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @foreach ($sections['jobs'] as $row)
                                            <tr>
                                                <td style="{{ $tdCss }};font-family:Consolas,Menlo,monospace;font-size:13px;">{{ $row['job_class'] }}</td>
                                                <td style="{{ $tdCss }}">{{ $row['queue'] }}</td>
                                                <td style="{{ $numCss }}">{{ $fmtNumber($row['count']) }}</td>
                                                <td style="{{ $numCss }}">{{ $row['last_seen'] ? Carbon::parse($row['last_seen'])->format('M j, H:i') : '-' }}</td>
                                            </tr>
                                        @endforeach
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    @endif

                    {{-- Audits --}}
                    @if (!empty($sections['audits']))
                        @php $audits = $sections['audits']; @endphp
                        <tr>
                            <td style="padding-top:24px;">
                                <h2 style="margin:0 0 4px 0;font-size:16px;color:#111111;">Dependency audits</h2>
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="{{ $tableCss }}">
                                    <thead>
                                        <tr>
                                            <th style="{{ $thCss }}">Ecosystem</th>
                                            <th style="{{ $thCss }};text-align:right;">Runs</th>
                                            <th style="{{ $thCss }};text-align:right;">Advisories / Total</th>
                                            <th style="{{ $thCss }}">Breakdown</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style="{{ $tdCss }}">Composer</td>
                                            <td style="{{ $numCss }}">{{ $fmtNumber($audits['composer']['runs'] ?? 0) }}</td>
                                            <td style="{{ $numCss }}">{{ $fmtNumber($audits['composer']['advisories'] ?? 0) }}</td>
                                            <td style="{{ $tdCss }}">{{ $fmtNumber($audits['composer']['abandoned'] ?? 0) }} abandoned</td>
                                        </tr>
                                        <tr>
                                            <td style="{{ $tdCss }}">npm</td>
                                            <td style="{{ $numCss }}">{{ $fmtNumber($audits['npm']['runs'] ?? 0) }}</td>
                                            <td style="{{ $numCss }}">{{ $fmtNumber($audits['npm']['total'] ?? 0) }}</td>
                                            <td style="{{ $tdCss }}">
                                                crit {{ $fmtNumber($audits['npm']['critical'] ?? 0) }},
                                                high {{ $fmtNumber($audits['npm']['high'] ?? 0) }},
                                                mod {{ $fmtNumber($audits['npm']['moderate'] ?? 0) }},
                                                low {{ $fmtNumber($audits['npm']['low'] ?? 0) }}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    @endif

                    {{-- Health checks --}}
                    @if (!empty($sections['health_checks']))
                        <tr>
                            <td style="padding-top:24px;">
                                <h2 style="margin:0 0 4px 0;font-size:16px;color:#111111;">Health check failures</h2>
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="{{ $tableCss }}">
                                    <thead>
                                        <tr>
                                            <th style="{{ $thCss }}">Check</th>
                                            <th style="{{ $thCss }}">Status</th>
                                            <th style="{{ $thCss }};text-align:right;">Failures</th>
                                            <th style="{{ $thCss }};text-align:right;">Last seen</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @foreach ($sections['health_checks'] as $row)
                                            <tr>
                                                <td style="{{ $tdCss }};font-family:Consolas,Menlo,monospace;font-size:13px;">{{ $row['check_name'] }}</td>
                                                <td style="{{ $tdCss }}">{{ strtoupper($row['status']) }}</td>
                                                <td style="{{ $numCss }}">{{ $fmtNumber($row['count']) }}</td>
                                                <td style="{{ $numCss }}">{{ $row['last_seen'] ? Carbon::parse($row['last_seen'])->format('M j, H:i') : '-' }}</td>
                                            </tr>
                                        @endforeach
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    @endif

                    {{-- Outgoing HTTP --}}
                    @if (!empty($sections['outgoing_http']))
                        <tr>
                            <td style="padding-top:24px;">
                                <h2 style="margin:0 0 4px 0;font-size:16px;color:#111111;">Outgoing HTTP failures</h2>
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="{{ $tableCss }}">
                                    <thead>
                                        <tr>
                                            <th style="{{ $thCss }}">Host</th>
                                            <th style="{{ $thCss }};text-align:right;">Failures</th>
                                            <th style="{{ $thCss }};text-align:right;">Last seen</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @foreach ($sections['outgoing_http'] as $row)
                                            <tr>
                                                <td style="{{ $tdCss }};font-family:Consolas,Menlo,monospace;font-size:13px;">{{ $row['host'] }}</td>
                                                <td style="{{ $numCss }}">{{ $fmtNumber($row['count']) }}</td>
                                                <td style="{{ $numCss }}">{{ $row['last_seen'] ? Carbon::parse($row['last_seen'])->format('M j, H:i') : '-' }}</td>
                                            </tr>
                                        @endforeach
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    @endif

                    {{-- Dashboard link --}}
                    <tr>
                        <td style="padding-top:28px;">
                            <p style="margin:0;font-size:14px;color:#333333;">
                                Open the full dashboard: <a href="{{ $dashboardUrl }}" style="color:#1a73e8;text-decoration:underline;">{{ $dashboardUrl }}</a>
                            </p>
                        </td>
                    </tr>

                    {{-- Footer --}}
                    <tr>
                        <td style="padding-top:24px;padding-bottom:8px;border-top:1px solid #dddddd;margin-top:12px;">
                            <p style="margin:12px 0 0 0;font-size:12px;color:#888888;line-height:1.5;">
                                You are receiving this {{ $window['label'] ?? 'daily' }} report because
                                <strong style="color:#555555;">{{ $config->email }}</strong>
                                is configured for {{ $appName }} notifications.
                                Manage this report from the Email Reports page in {{ $appName }}.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
