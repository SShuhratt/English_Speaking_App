<?php

namespace App\Http\Controllers;

use App\Services\HumoPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class HumoWebhookController extends Controller
{
    public function __construct(
        protected HumoPaymentService $humoPaymentService
    ) {}

    /**
     * Handle incoming Humo payment notifications from listener/webhook.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $expectedSecret = (string) config('services.humo.webhook_secret');
        $providedSecret = (string) $request->header('X-Humo-Secret', '');

        if (empty($expectedSecret) || ! hash_equals($expectedSecret, $providedSecret)) {
            Log::warning('Unauthorized Humo webhook attempt', [
                'ip' => $request->ip(),
                'provided_secret_len' => strlen($providedSecret),
            ]);

            return response()->json([
                'error' => 'Unauthorized',
            ], 401);
        }

        $text = (string) $request->input('text', '');

        if (trim($text) === '') {
            return response()->json([
                'status' => 'ignored',
                'message' => 'Empty message content.',
            ], 200);
        }

        $result = $this->humoPaymentService->process($text);

        return response()->json($result);
    }
}
