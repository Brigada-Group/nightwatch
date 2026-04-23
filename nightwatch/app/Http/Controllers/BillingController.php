<?php

namespace App\Http\Controllers;

use App\Services\PaddleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class BillingController extends Controller
{
    public function subscribeCheckout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'price_id' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (! $user) {
            return response()->json([
                'ok' => false,
                'message' => 'Authentication required.',
            ], 401);
        }

        $checkout = $user
            ->checkout($validated['price_id'])
            ->returnTo(route('dashboard'));

        $checkoutOptions = $checkout->options();
        $checkoutOptions['settings']['displayMode'] = 'overlay';
        unset($checkoutOptions['settings']['frameStyle']);

        return response()->json([
            'ok' => true,
            'checkout' => $checkoutOptions,
        ]);
    }

    public function checkout(Request $request, PaddleService $paddle): JsonResponse
    {
        $validated = $request->validate([
            'price_id' => ['required', 'string'],
            'email' => ['required', 'email'],
        ]);

        try {
            $data = $paddle->createTransaction(
                $validated['price_id'],
                $validated['email']
            );

            return response()->json([
                'ok' => true,
                'transaction_id' => data_get($data, 'transaction_id'),
                'status' => data_get($data, 'status'),
                'checkout_url' => data_get($data, 'checkout_url'),
                'has_checkout_url' => (bool) data_get($data, 'has_checkout_url'),
            ]);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'ok' => false,
                'message' => 'Unable to create Paddle checkout.',
                'error' => 'Please try again later.',
            ], 422);
        }
    }
}
