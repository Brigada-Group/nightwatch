<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTeamInvitationLinkRequest;
use App\Mail\TeamInvitationJoinLinkMail;
use App\Models\TeamInvitationLink;
use App\Services\CurrentTeam;
use App\Services\TeamInvitationLinkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class TeamInvitationLinksController extends Controller
{
    public function __construct(
        private readonly CurrentTeam $currentTeam,
        private readonly TeamInvitationLinkService $invitationLinks,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $team = $this->currentTeam->for($user);
        abort_unless($team !== null, 403);
        abort_unless($this->currentTeam->userCanManageProjects($user, $team), 403);

        $links = TeamInvitationLink::query()
            ->where('team_id', $team->id)
            ->with(['role:id,slug,name'])
            ->orderByDesc('id')
            ->get();

        return Inertia::render('team/invitation-links', [
            'invitationLinks' => $links,
            'teamProjects' => $team->projects()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(StoreTeamInvitationLinkRequest $request): JsonResponse|RedirectResponse
    {
        $user = $request->user();
        $team = $this->currentTeam->for($user);
        abort_unless($team !== null, 403);
        abort_unless($this->currentTeam->userCanManageProjects($user, $team), 403);

        $data = $request->validated();

        $result = $this->invitationLinks->createForTeam(
            $team,
            $data['role_slug'],
            (int) $data['expires_in_days'],
            isset($data['max_uses']) ? (int) $data['max_uses'] : null,
            $data['project_ids'] ?? null,
            $user,
        );

        $result['link']->load('role:id,slug,name');

        $projectNames = [];
        if (is_array($result['link']->project_ids) && $result['link']->project_ids !== []) {
            $projectNames = $team->projects()
                ->whereIn('id', $result['link']->project_ids)
                ->orderBy('name')
                ->pluck('name')
                ->all();
        }

        $emailSent = false;
        $notifyEmails = collect($data['notify_emails'] ?? [])
            ->map(fn ($e) => trim((string) $e))
            ->filter()
            ->unique(fn ($e) => mb_strtolower($e))
            ->values()
            ->all();

        $emailsSent = 0;
        $emailsAttempted = count($notifyEmails);

        foreach ($notifyEmails as $recipient) {
            try {
                Mail::to($recipient)->send(new TeamInvitationJoinLinkMail(
                    $user,
                    $team,
                    (string) $result['link']->role->name,
                    $result['join_url'],
                    $projectNames,
                ));
                $emailsSent++;
            } catch (\Throwable $exception) {
                report($exception);
            }
        }

        $emailSent = $emailsSent > 0;

        if ($request->wantsJson()) {
            return response()->json([
                'join_url' => $result['join_url'],
                'plain_token' => $result['plain_token'],
                'link' => $result['link'],
                'email_sent' => $emailSent,
                'emails_sent' => $emailsSent,
                'emails_attempted' => $emailsAttempted,
            ]);
        }

        $toastMessage = __('Invitation link created.');

        if ($emailsAttempted > 0) {
            $toastMessage = match (true) {
                $emailsSent === 0 => __('Invitation link created, but no invitation emails could be sent. Share the link manually or check your mail configuration.'),
                $emailsSent === $emailsAttempted && $emailsAttempted === 1 => __('Invitation link created and an email was sent to :email.', ['email' => $notifyEmails[0]]),
                $emailsSent === $emailsAttempted => __('Invitation link created and invitation emails were sent to :count recipients.', ['count' => $emailsSent]),
                default => __('Invitation link created. Invitation emails sent: :sent of :total (some deliveries may have failed).', ['sent' => $emailsSent, 'total' => $emailsAttempted]),
            };
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $toastMessage,
        ]);

        return back()->with('invitationLinkCreated', [
            'join_url' => $result['join_url'],
            'plain_token' => $result['plain_token'],
        ]);
    }

    public function destroy(Request $request, TeamInvitationLink $teamInvitationLink): RedirectResponse
    {
        $user = $request->user();
        $team = $this->currentTeam->for($user);
        abort_unless($team !== null, 403);
        abort_unless($team->id === $teamInvitationLink->team_id, 404);
        abort_unless($this->currentTeam->userCanManageProjects($user, $team), 403);

        $this->invitationLinks->revoke($teamInvitationLink);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Invitation link revoked.'),
        ]);

        return back();
    }

    public function purgeRevoked(Request $request, TeamInvitationLink $teamInvitationLink): RedirectResponse
    {
        $user = $request->user();
        $team = $this->currentTeam->for($user);
        abort_unless($team !== null, 403);
        abort_unless($team->id === $teamInvitationLink->team_id, 404);
        abort_unless($this->currentTeam->userCanManageProjects($user, $team), 403);
        abort_unless($teamInvitationLink->revoked_at !== null, 403);

        $teamInvitationLink->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Revoked link removed from the list.'),
        ]);

        return back();
    }
}
