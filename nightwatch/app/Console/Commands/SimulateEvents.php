<?php

namespace App\Console\Commands;

use App\Models\Project;
use App\Services\IngestService;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class SimulateEvents extends Command
{
    /** @var list<string> */
    private const BURST_TYPES = [
        'exception',
        'request',
        'log',
        'job',
        'heartbeat',
        'query',
        'health',
        'cache',
        'mail',
        'notification',
        'outgoing-http',
        'command',
        'scheduled-task',
    ];

    protected $signature = 'nightwatch:simulate
                            {--type=all : Event type (all, exception, request, log, job, heartbeat, query, health, cache, mail, notification, outgoing-http, command, scheduled-task)}
                            {--count=3 : Number of simulation rounds}
                            {--interval=1 : Seconds between rounds}';

    protected $description = 'Simulate ingest events across all hub types for dashboards, broadcasting, and list UIs';

    public function handle(IngestService $ingest): int
    {
        $type = str_replace('_', '-', strtolower((string) $this->option('type')));

        if ($type !== 'all' && ! in_array($type, self::BURST_TYPES, true)) {
            $this->error('Unknown --type. Use all or: '.implode(', ', self::BURST_TYPES));

            return self::FAILURE;
        }

        $project = $this->resolveTargetProject();
        $count = max(1, (int) $this->option('count'));
        $interval = max(0, (int) $this->option('interval'));

        $this->info("Using project: {$project->name} (ID: {$project->id})");
        $this->info("Running {$count} round(s); type={$type}; {$interval}s between rounds.");
        if ($type === 'all') {
            $this->comment('Each "all" round ingests heartbeats, HTTP traffic, exceptions, queries, jobs, logs, outgoing calls, mail, notifications, cache stats, artisan commands, scheduled tasks, and health probes.');
        }
        $this->newLine();

        for ($i = 1; $i <= $count; $i++) {
            if ($type === 'all') {
                $this->simulateFullBurst($ingest, $project, $i);
            } else {
                $this->simulateTypedBurst($ingest, $project, $type, $i);
            }
            $this->info("[{$i}/{$count}] Round complete");

            if ($i < $count && $interval > 0) {
                sleep($interval);
            }
        }

        $this->newLine();
        $this->info('Done. Open the dashboard and monitoring sidebar pages to see fresh data.');

        return self::SUCCESS;
    }

    private function resolveTargetProject(): Project
    {
        $existingCount = Project::count();

        if ($existingCount > 0) {
            $project = Project::query()->inRandomOrder()->first();
            if ($project !== null) {
                if ($existingCount > 1) {
                    $this->comment("Selected at random from {$existingCount} projects.");
                }

                return $project;
            }
        }

        $project = Project::create([
            'project_uuid' => Str::uuid()->toString(),
            'name' => 'Demo App',
            'api_token' => Str::random(40),
            'environment' => 'production',
            'status' => 'normal',
            'last_heartbeat_at' => now(),
            'metadata' => [
                'php_version' => '8.5.1',
                'laravel_version' => '13.5.0',
            ],
        ]);

        $this->warn("No projects found — created test project: {$project->name}");

        return $project;
    }

    private function randomSentAt(int $maxSecondsBack = 900): string
    {
        return now()->subSeconds(random_int(0, $maxSecondsBack))->toIso8601String();
    }

    private function pickServer(): string
    {
        return collect(['web-01', 'web-02', 'worker-01', 'horizon-01', 'scheduler-01'])->random();
    }

    private function pickEnv(): string
    {
        return collect(['production', 'staging', 'local'])->random();
    }

    private function simulateFullBurst(IngestService $ingest, Project $project, int $round): void
    {
        $env = $this->pickEnv();
        $server = $this->pickServer();

        $ingest->recordHeartbeat($project, [
            'php_version' => '8.5.1',
            'laravel_version' => '13.5.0',
        ]);

        $uris = ['/api/users', '/api/orders', '/dashboard', '/api/products', '/webhooks/stripe', '/api/search', '/admin/reports', '/health'];
        $methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

        for ($r = 0; $r < random_int(12, 28); $r++) {
            $ingest->recordRequest($project, [
                'environment' => $env,
                'server' => $this->pickServer(),
                'method' => $methods[array_rand($methods)],
                'uri' => $uris[array_rand($uris)],
                'route_name' => collect(['api.resource', 'web.dashboard', 'webhook.handler'])->random(),
                'status_code' => collect([200, 201, 204, 301, 302, 400, 401, 404, 422, 429, 500, 502, 503])->random(),
                'duration_ms' => random_int(5, 4200) / 10,
                'ip' => '192.168.'.random_int(1, 40).'.'.random_int(1, 254),
                'sent_at' => $this->randomSentAt(),
            ]);
        }

        $exceptionClasses = [
            'App\\Exceptions\\PaymentFailedException',
            'Illuminate\\Database\\QueryException',
            'Symfony\\Component\\HttpKernel\\Exception\\NotFoundHttpException',
            'RuntimeException',
            'TypeError',
            'Illuminate\\Validation\\ValidationException',
            'GuzzleHttp\\Exception\\ConnectException',
        ];

        for ($e = 0; $e < random_int(4, 10); $e++) {
            $ingest->recordException($project, [
                'environment' => $env,
                'server' => $this->pickServer(),
                'exception_class' => $exceptionClasses[array_rand($exceptionClasses)],
                'message' => "Simulated burst #{$round} · ".Str::random(24).' · '.now()->format('H:i:s'),
                'file' => collect(['app/Http/Controllers/OrderController.php', 'app/Services/BillingService.php', 'routes/api.php'])->random(),
                'line' => random_int(12, 240),
                'url' => '/api/orders/'.random_int(1, 9999),
                'status_code' => collect([500, 404, 422, 503, 419])->random(),
                'severity' => collect(['error', 'critical', 'warning', 'warning', 'info', 'debug'])->random(),
                'sent_at' => $this->randomSentAt(),
            ]);
        }

        $sqlSnippets = [
            'SELECT * FROM users WHERE id = ?',
            'SELECT o.*, c.name FROM orders o JOIN customers c ON c.id = o.customer_id WHERE o.status = ?',
            'UPDATE inventory SET qty = qty - ? WHERE sku = ?',
            'INSERT INTO audit_log (user_id, action, meta) VALUES (?, ?, ?)',
            'DELETE FROM sessions WHERE last_activity < ?',
            'SELECT COUNT(*) FROM events WHERE created_at > ?',
        ];

        for ($q = 0; $q < random_int(10, 22); $q++) {
            $slow = random_int(1, 100) <= 18;
            $ingest->recordQuery($project, [
                'environment' => $env,
                'server' => $this->pickServer(),
                'sql' => $sqlSnippets[array_rand($sqlSnippets)],
                'duration_ms' => $slow ? random_int(450, 4800) / 10 : random_int(2, 380) / 10,
                'connection' => collect(['sqlite', 'mysql', 'pgsql', 'redis'])->random(),
                'file' => 'app/Models/User.php',
                'line' => random_int(20, 180),
                'is_slow' => $slow,
                'is_n_plus_one' => random_int(1, 100) <= 8,
                'sent_at' => $this->randomSentAt(),
            ]);
        }

        $jobClasses = [
            'App\\Jobs\\SendWelcomeEmail',
            'App\\Jobs\\ProcessPayment',
            'App\\Jobs\\GenerateReport',
            'App\\Jobs\\SyncInventory',
            'App\\Jobs\\PushSegmentEvent',
            'App\\Jobs\\ReindexSearch',
        ];

        for ($j = 0; $j < random_int(6, 14); $j++) {
            $status = collect(['completed', 'completed', 'completed', 'failed', 'processing', 'pending'])->random();
            $ingest->recordJob($project, [
                'environment' => $env,
                'server' => $this->pickServer(),
                'job_class' => $jobClasses[array_rand($jobClasses)],
                'queue' => collect(['default', 'emails', 'payments', 'reports', 'low'])->random(),
                'connection' => 'database',
                'status' => $status,
                'duration_ms' => random_int(40, 12000) / 10,
                'attempt' => $status === 'failed' ? random_int(1, 3) : 1,
                'error_message' => $status === 'failed' ? 'Connection timed out after 30s' : null,
                'sent_at' => $this->randomSentAt(),
            ]);
        }

        $logMessages = [
            'User login successful',
            'Cache miss for key: user_profile_'.random_int(1, 500),
            'Slow query detected (1200ms)',
            'Payment webhook received',
            'Rate limit exceeded for IP 10.0.0.1',
            'Queue worker processing batch',
            'External API latency spike',
        ];
        $levels = ['debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency'];

        for ($l = 0; $l < random_int(14, 28); $l++) {
            $ingest->recordLog($project, [
                'environment' => $env,
                'server' => $this->pickServer(),
                'level' => $levels[array_rand($levels)],
                'message' => $logMessages[array_rand($logMessages)],
                'channel' => collect(['application', 'payments', 'security', 'default'])->random(),
                'sent_at' => $this->randomSentAt(),
            ]);
        }

        $hosts = [
            ['https://api.stripe.com/v1/charges', 'api.stripe.com'],
            ['https://hooks.slack.com/services/XXX', 'hooks.slack.com'],
            ['https://api.segment.io/v1/track', 'api.segment.io'],
            ['https://example.com/api/ping', 'example.com'],
        ];

        for ($h = 0; $h < random_int(8, 16); $h++) {
            [$url, $host] = $hosts[array_rand($hosts)];
            $failed = random_int(1, 100) <= 12;
            $code = $failed ? collect([0, 408, 500, 502, 503])->random() : collect([200, 201, 204])->random();
            $ingest->recordOutgoingHttp($project, [
                'environment' => $env,
                'server' => $this->pickServer(),
                'method' => collect(['GET', 'POST', 'PUT'])->random(),
                'url' => $url.'?r='.random_int(1, 99999),
                'host' => $host,
                'status_code' => $code ?: null,
                'duration_ms' => random_int(30, 3500) / 10,
                'failed' => $failed,
                'error_message' => $failed ? 'Upstream timeout' : null,
                'sent_at' => $this->randomSentAt(),
            ]);
        }

        $mailables = [
            'App\\Mail\\OrderShipped',
            'App\\Mail\\InvoiceReady',
            'App\\Mail\\PasswordReset',
        ];

        for ($m = 0; $m < random_int(4, 9); $m++) {
            $ok = random_int(1, 100) <= 82;
            $ingest->recordMail($project, [
                'environment' => $env,
                'server' => $this->pickServer(),
                'mailable' => $mailables[array_rand($mailables)],
                'subject' => $ok ? 'Your order #'.random_int(1000, 9999).' shipped' : 'Mail transport failure',
                'to' => 'customer'.random_int(1, 500).'@example.test',
                'status' => $ok ? 'sent' : 'failed',
                'error_message' => $ok ? null : 'SMTP relay rejected message',
                'sent_at' => $this->randomSentAt(),
            ]);
        }

        $notifClasses = [
            'App\\Notifications\\PaymentReceived',
            'App\\Notifications\\SecurityAlert',
            'App\\Notifications\\TeamInvite',
        ];

        for ($ni = 0; $ni < random_int(4, 9); $ni++) {
            $ok = random_int(1, 100) <= 80;
            $ingest->recordNotification($project, [
                'environment' => $env,
                'server' => $this->pickServer(),
                'notification_class' => $notifClasses[array_rand($notifClasses)],
                'channel' => collect(['mail', 'database', 'slack', 'vonage'])->random(),
                'notifiable_type' => 'App\\Models\\User',
                'notifiable_id' => random_int(1, 10_000),
                'status' => $ok ? 'sent' : 'failed',
                'error_message' => $ok ? null : 'Channel misconfigured',
                'sent_at' => $this->randomSentAt(),
            ]);
        }

        $stores = ['redis', 'memcached', 'array', 'database', 'octane'];

        for ($c = 0; $c < random_int(4, 8); $c++) {
            $hits = random_int(800, 80_000);
            $misses = random_int(0, 4000);
            $writes = random_int(0, 2000);
            $forgets = random_int(0, 800);
            $total = max(1, $hits + $misses);
            $hitRate = round($hits / $total, 4);

            $ingest->recordCache($project, [
                'environment' => $env,
                'server' => $this->pickServer(),
                'store' => $stores[array_rand($stores)],
                'hits' => $hits,
                'misses' => $misses,
                'writes' => $writes,
                'forgets' => $forgets,
                'hit_rate' => $hitRate,
                'period_start' => now()->subMinutes(random_int(1, 45))->toIso8601String(),
                'sent_at' => $this->randomSentAt(120),
            ]);
        }

        $commands = [
            'php artisan queue:work --once',
            'php artisan schedule:run',
            'php artisan nightwatch:simulate --type=all --count=1',
            'php artisan migrate --force',
            'php artisan config:cache',
        ];

        for ($cmd = 0; $cmd < random_int(5, 12); $cmd++) {
            $exit = random_int(1, 100) <= 88 ? 0 : random_int(1, 127);
            $ingest->recordCommand($project, [
                'environment' => $env,
                'server' => $this->pickServer(),
                'command' => $commands[array_rand($commands)],
                'exit_code' => $exit,
                'duration_ms' => random_int(20, 8000),
                'sent_at' => $this->randomSentAt(),
            ]);
        }

        $tasks = [
            ['task' => 'artisan invoices:send', 'description' => 'Email due invoices', 'expression' => '0 * * * *'],
            ['task' => 'artisan reports:daily', 'description' => 'Aggregate KPIs', 'expression' => '15 6 * * *'],
            ['task' => 'artisan backup:database', 'description' => 'Nightly DB dump', 'expression' => '30 2 * * *'],
            ['task' => 'artisan scout:import', 'description' => 'Search index refresh', 'expression' => '*/20 * * * *'],
        ];

        for ($t = 0; $t < random_int(5, 11); $t++) {
            $pick = $tasks[array_rand($tasks)];
            $st = collect(['completed', 'completed', 'failed', 'skipped'])->random();
            $ingest->recordScheduledTask($project, [
                'environment' => $env,
                'server' => $this->pickServer(),
                'task' => $pick['task'],
                'description' => $pick['description'],
                'expression' => $pick['expression'],
                'status' => $st,
                'duration_ms' => random_int(100, 45_000) / 10,
                'output' => $st === 'failed' ? 'Non-zero exit' : 'OK',
                'sent_at' => $this->randomSentAt(),
            ]);
        }

        $checkNames = ['database', 'redis', 'queue', 'disk', 'memory', 'stripe', 'search', 'mail', 'cache', 'sessions'];
        $checks = [];
        for ($hc = 0; $hc < random_int(10, 20); $hc++) {
            $checks[] = [
                'name' => $checkNames[array_rand($checkNames)].'-'.Str::lower(Str::random(3)),
                'status' => collect(['ok', 'ok', 'ok', 'warning', 'error', 'critical'])->random(),
                'message' => collect(['Within SLA', 'Elevated latency', 'Probe failed', 'Degraded dependency'])->random(),
                'metadata' => ['round' => $round, 'region' => collect(['eu-west', 'us-east'])->random()],
            ];
        }

        $ingest->recordHealthChecks($project, [
            'environment' => $env,
            'server' => $server,
            'sent_at' => $this->randomSentAt(180),
            'checks' => $checks,
        ]);
    }

    private function simulateTypedBurst(IngestService $ingest, Project $project, string $type, int $round): void
    {
        $env = $this->pickEnv();
        $server = $this->pickServer();
        $times = match ($type) {
            'health' => 1,
            'heartbeat' => 1,
            default => random_int(10, 24),
        };

        for ($n = 0; $n < $times; $n++) {
            $now = $this->randomSentAt();
            match ($type) {
                'heartbeat' => $ingest->recordHeartbeat($project, [
                    'php_version' => '8.5.1',
                    'laravel_version' => '13.5.0',
                ]),
                'exception' => $ingest->recordException($project, [
                    'environment' => $env,
                    'server' => $this->pickServer(),
                    'exception_class' => collect([
                        'App\\Exceptions\\PaymentFailedException',
                        'Illuminate\\Database\\QueryException',
                        'RuntimeException',
                    ])->random(),
                    'message' => "Single-type exception r{$round}#{$n}",
                    'file' => 'app/Http/Controllers/DemoController.php',
                    'line' => random_int(10, 200),
                    'url' => '/demo/'.random_int(1, 999),
                    'status_code' => collect([500, 404, 422])->random(),
                    'severity' => collect(['error', 'critical', 'warning', 'info'])->random(),
                    'sent_at' => $now,
                ]),
                'request' => $ingest->recordRequest($project, [
                    'environment' => $env,
                    'server' => $this->pickServer(),
                    'method' => collect(['GET', 'POST', 'PUT', 'DELETE'])->random(),
                    'uri' => collect(['/api/users', '/api/orders', '/dashboard'])->random(),
                    'route_name' => 'api.demo',
                    'status_code' => collect([200, 201, 404, 500])->random(),
                    'duration_ms' => random_int(5, 2500) / 10,
                    'ip' => '10.0.0.'.random_int(1, 200),
                    'sent_at' => $now,
                ]),
                'log' => $ingest->recordLog($project, [
                    'environment' => $env,
                    'server' => $this->pickServer(),
                    'level' => collect(['info', 'warning', 'error', 'critical', 'debug'])->random(),
                    'message' => "Simulated log r{$round}#{$n}",
                    'channel' => 'application',
                    'sent_at' => $now,
                ]),
                'job' => $ingest->recordJob($project, [
                    'environment' => $env,
                    'server' => $this->pickServer(),
                    'job_class' => collect([
                        'App\\Jobs\\SendWelcomeEmail',
                        'App\\Jobs\\ProcessPayment',
                    ])->random(),
                    'queue' => collect(['default', 'emails'])->random(),
                    'connection' => 'database',
                    'status' => collect(['completed', 'failed'])->random(),
                    'duration_ms' => random_int(50, 4000) / 10,
                    'attempt' => 1,
                    'sent_at' => $now,
                ]),
                'query' => $ingest->recordQuery($project, [
                    'environment' => $env,
                    'server' => $this->pickServer(),
                    'sql' => collect([
                        'SELECT * FROM users WHERE id = ?',
                        'UPDATE carts SET data = ? WHERE id = ?',
                    ])->random(),
                    'duration_ms' => random_int(1, 800) / 10,
                    'connection' => 'sqlite',
                    'is_slow' => random_int(1, 100) > 75,
                    'is_n_plus_one' => random_int(1, 100) > 90,
                    'sent_at' => $now,
                ]),
                'cache' => $ingest->recordCache($project, [
                    'environment' => $env,
                    'server' => $this->pickServer(),
                    'store' => collect(['redis', 'memcached', 'array'])->random(),
                    'hits' => random_int(100, 10_000),
                    'misses' => random_int(0, 500),
                    'writes' => random_int(0, 200),
                    'forgets' => random_int(0, 100),
                    'hit_rate' => round(random_int(70, 99) / 100, 4),
                    'period_start' => now()->subHour()->toIso8601String(),
                    'sent_at' => $now,
                ]),
                'mail' => $ingest->recordMail($project, [
                    'environment' => $env,
                    'server' => $this->pickServer(),
                    'mailable' => 'App\\Mail\\DemoMail',
                    'subject' => 'Simulated subject #'.$n,
                    'to' => "user{$n}@example.test",
                    'status' => ($mailStatus = collect(['sent', 'failed'])->random()),
                    'error_message' => $mailStatus === 'failed' ? 'SMTP error' : null,
                    'sent_at' => $now,
                ]),
                'notification' => $ingest->recordNotification($project, [
                    'environment' => $env,
                    'server' => $this->pickServer(),
                    'notification_class' => 'App\\Notifications\\DemoNotification',
                    'channel' => 'mail',
                    'notifiable_type' => 'App\\Models\\User',
                    'notifiable_id' => random_int(1, 9999),
                    'status' => ($notifStatus = collect(['sent', 'failed'])->random()),
                    'error_message' => $notifStatus === 'failed' ? 'Channel error' : null,
                    'sent_at' => $now,
                ]),
                'outgoing-http' => $ingest->recordOutgoingHttp($project, [
                    'environment' => $env,
                    'server' => $this->pickServer(),
                    'method' => 'POST',
                    'url' => 'https://api.example.com/v1/events',
                    'host' => 'api.example.com',
                    'status_code' => collect([200, 201, 500])->random(),
                    'duration_ms' => random_int(20, 900) / 10,
                    'failed' => false,
                    'sent_at' => $now,
                ]),
                'command' => $ingest->recordCommand($project, [
                    'environment' => $env,
                    'server' => $this->pickServer(),
                    'command' => 'php artisan inspire',
                    'exit_code' => collect([0, 0, 0, 1])->random(),
                    'duration_ms' => random_int(10, 500),
                    'sent_at' => $now,
                ]),
                'scheduled-task' => $ingest->recordScheduledTask($project, [
                    'environment' => $env,
                    'server' => $this->pickServer(),
                    'task' => 'artisan demo:task',
                    'description' => 'Simulated scheduler run',
                    'expression' => '*/5 * * * *',
                    'status' => collect(['completed', 'failed', 'skipped'])->random(),
                    'duration_ms' => random_int(50, 2000) / 10,
                    'output' => 'done',
                    'sent_at' => $now,
                ]),
                'health' => $ingest->recordHealthChecks($project, [
                    'environment' => $env,
                    'server' => $server,
                    'sent_at' => $now,
                    'checks' => collect(range(1, random_int(8, 14)))->map(fn () => [
                        'name' => collect(['database', 'redis', 'queue', 'disk'])->random(),
                        'status' => collect(['ok', 'ok', 'warning', 'error'])->random(),
                        'message' => 'Synthetic probe',
                        'metadata' => [],
                    ])->all(),
                ]),
            };
        }
    }
}
