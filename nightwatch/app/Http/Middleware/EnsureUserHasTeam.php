<?php

namespace App\Http\Middleware;

use App\Models\TeamMember;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasTeam
{
    /**
     * Redirect authenticated users without an accepted team membership to the
     * team onboarding screen so they create a team before entering the app.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            return $next($request);
        }

        $hasTeam = $user->teamMemberships()
            ->where('status', TeamMember::STATUS_ACCEPTED)
            ->exists();

        if (! $hasTeam) {
            return redirect()->route('teams.create');
        }

        return $next($request);
    }
}
