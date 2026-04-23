<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasSubscription
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasActiveSubscription()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'An active subscription is required to access this resource.',
                ], 403);
            }

            return redirect('/#pricing');
        }

        return $next($request);
    }
}
