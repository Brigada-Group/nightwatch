<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWebhookDestinationRequest;
use App\Http\Requests\UpdateWebhookDestinationRequest;
use App\Models\WebhookDestination;
use App\Services\CurrentTeam;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WebhookDestinationsController extends Controller
{
    private const EVENT_TYPES = [
        'exception.created',
        'job.failed',
        'health.failed',
        'log.critical',
        'client_error.created',
        'request.server_error',
        'request.client_error',
        'query.slow',
        'query.n_plus_one',
        'outgoing_http.failed',
        'mail.failed',
        'notification.failed',
        'command.failed',
        'scheduled_task.failed',
        'composer_audit.issues_found',
        'npm_audit.issues_found',
    ];

    public function __construct(
        private readonly CurrentTeam $currentTeam,
    ) {}

    public function index(Request $request): Response
    {
        $team = $this->currentTeam->for($request->user());
        abort_unless($team !== null, 403);

        $destinations = WebhookDestination::query()
            ->where('team_id', $team->id)
            ->orderBy('id')
            ->get();

        return Inertia::render('webhooks/index', [
            'destinations' => $destinations,
            'eventTypes' => self::EVENT_TYPES,
            'providers' => [
                WebhookDestination::PROVIDER_GENERIC,
                WebhookDestination::PROVIDER_SLACK,
                WebhookDestination::PROVIDER_DISCORD,
            ],
        ]);
    }

    public function store(StoreWebhookDestinationRequest $request): RedirectResponse
    {
        $team = $this->currentTeam->for($request->user());
        abort_unless($team !== null, 403);

        WebhookDestination::create([
            ...$request->validated(),
            'team_id' => $team->id,
            'created_by' => $request->user()->id,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Webhook destination created.')]);

        return to_route('webhooks.index');
    }

    public function update(
        UpdateWebhookDestinationRequest $request,
        WebhookDestination $webhookDestination
    ): RedirectResponse {
        $team = $this->currentTeam->for($request->user());
        abort_unless($team !== null, 403);
        abort_unless($webhookDestination->team_id === $team->id, 404);

        $webhookDestination->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Webhook destination updated.')]);

        return to_route('webhooks.index');
    }

    public function destroy(Request $request, WebhookDestination $webhookDestination): RedirectResponse
    {
        $team = $this->currentTeam->for($request->user());
        abort_unless($team !== null, 403);
        abort_unless($webhookDestination->team_id === $team->id, 404);

        $webhookDestination->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Webhook destination removed.')]);

        return to_route('webhooks.index');
    }
}
