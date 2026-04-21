<?php

namespace App\Http\Controllers;

use App\Http\Requests\CacheRequest;
use App\Http\Requests\CommandRequest;
use App\Http\Requests\ComposerAuditRequest;
use App\Http\Requests\ExceptionRequest;
use App\Http\Requests\HeartbeatRequest;
use App\Http\Requests\HealthCheckRequest;
use App\Http\Requests\IngestRequestRequest;
use App\Http\Requests\JobRequest;
use App\Http\Requests\LogRequest;
use App\Http\Requests\MailRequest;
use App\Http\Requests\NotificationRequest;
use App\Http\Requests\NpmAuditRequest;
use App\Http\Requests\OutgoingHttpRequest;
use App\Http\Requests\QueryRequest;
use App\Http\Requests\ScheduledTaskRequest;
use App\Services\IngestService;
use Illuminate\Http\JsonResponse;

class IngestController extends Controller
{
    public function __construct(
        private readonly IngestService $ingestService,
    ) {}

    public function heartbeat(HeartbeatRequest $request): JsonResponse
    {
        $this->ingestService->recordHeartbeat(
            $request->input('_project'),
            $request->validated(),
        );

        return response()->json(['status' => 'ok']);
    }

    public function exceptions(ExceptionRequest $request): JsonResponse
    {
        $this->ingestService->recordException(
            $request->input('_project'),
            $request->validated(),
        );

        return response()->json(['status' => 'ok']);
    }

    public function requests(IngestRequestRequest $request): JsonResponse
    {
        $this->ingestService->recordRequest(
            $request->input('_project'),
            $request->validated(),
        );

        return response()->json(['status' => 'ok']);
    }

    public function queries(QueryRequest $request): JsonResponse
    {
        $this->ingestService->recordQuery(
            $request->input('_project'),
            $request->validated(),
        );

        return response()->json(['status' => 'ok']);
    }

    public function jobs(JobRequest $request): JsonResponse
    {
        $this->ingestService->recordJob(
            $request->input('_project'),
            $request->validated(),
        );

        return response()->json(['status' => 'ok']);
    }

    public function logs(LogRequest $request): JsonResponse
    {
        $this->ingestService->recordLog(
            $request->input('_project'),
            $request->validated(),
        );

        return response()->json(['status' => 'ok']);
    }

    public function outgoingHttp(OutgoingHttpRequest $request): JsonResponse
    {
        $this->ingestService->recordOutgoingHttp(
            $request->input('_project'),
            $request->validated(),
        );

        return response()->json(['status' => 'ok']);
    }

    public function mail(MailRequest $request): JsonResponse
    {
        $this->ingestService->recordMail(
            $request->input('_project'),
            $request->validated(),
        );

        return response()->json(['status' => 'ok']);
    }

    public function notifications(NotificationRequest $request): JsonResponse
    {
        $this->ingestService->recordNotification(
            $request->input('_project'),
            $request->validated(),
        );

        return response()->json(['status' => 'ok']);
    }

    public function cache(CacheRequest $request): JsonResponse
    {
        $this->ingestService->recordCache(
            $request->input('_project'),
            $request->validated(),
        );

        return response()->json(['status' => 'ok']);
    }

    public function commands(CommandRequest $request): JsonResponse
    {
        $this->ingestService->recordCommand(
            $request->input('_project'),
            $request->validated(),
        );

        return response()->json(['status' => 'ok']);
    }

    public function scheduledTasks(ScheduledTaskRequest $request): JsonResponse
    {
        $this->ingestService->recordScheduledTask(
            $request->input('_project'),
            $request->validated(),
        );

        return response()->json(['status' => 'ok']);
    }

    public function health(HealthCheckRequest $request): JsonResponse
    {
        $this->ingestService->recordHealthChecks(
            $request->input('_project'),
            $request->validated(),
        );

        return response()->json(['status' => 'ok']);
    }

    public function composerAudit(ComposerAuditRequest $request): JsonResponse
    {
        $this->ingestService->recordComposerAudit(
            $request->input('_project'),
            $request->validated(),
        );

        return response()->json(['status' => 'ok']);
    }

    public function npmAudit(NpmAuditRequest $request): JsonResponse
    {
        $this->ingestService->recordNpmAudit(
            $request->input('_project'),
            $request->validated(),
        );

        return response()->json(['status' => 'ok']);
    }
}
