<?php

use App\Http\Controllers\BillingController;
use App\Http\Controllers\IngestController;
use Illuminate\Support\Facades\Route;

Route::post('billing/checkout', [BillingController::class, 'checkout'])->name('billing.checkout');

Route::middleware('guardian')
    ->prefix('ingest')
    ->group(function () {
        Route::post('heartbeat', [IngestController::class, 'heartbeat'])->name('ingest.heartbeat');
        Route::post('exceptions', [IngestController::class, 'exceptions'])->name('ingest.exceptions');
        Route::post('requests', [IngestController::class, 'requests'])->name('ingest.requests');
        Route::post('queries', [IngestController::class, 'queries'])->name('ingest.queries');
        Route::post('jobs', [IngestController::class, 'jobs'])->name('ingest.jobs');
        Route::post('logs', [IngestController::class, 'logs'])->name('ingest.logs');
        Route::post('outgoing-http', [IngestController::class, 'outgoingHttp'])->name('ingest.outgoingHttp');
        Route::post('mail', [IngestController::class, 'mail'])->name('ingest.mail');
        Route::post('notifications', [IngestController::class, 'notifications'])->name('ingest.notifications');
        Route::post('cache', [IngestController::class, 'cache'])->name('ingest.cache');
        Route::post('commands', [IngestController::class, 'commands'])->name('ingest.commands');
        Route::post('scheduled-tasks', [IngestController::class, 'scheduledTasks'])->name('ingest.scheduledTasks');
        Route::post('health', [IngestController::class, 'health'])->name('ingest.health');
        Route::post('composer-audit', [IngestController::class, 'composerAudit'])->name('ingest.composerAudit');
        Route::post('npm-audit', [IngestController::class, 'npmAudit'])->name('ingest.npmAudit');
    });
