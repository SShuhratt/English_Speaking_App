<?php

namespace App\Http\Controllers;

use App\Services\WritingMentorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class WritingMentorController extends Controller
{
    public function __construct(
        protected WritingMentorService $writingMentorService
    ) {}

    /**
     * Redirect an authenticated ConvoMate user into WritingMentor using a signed SSO payload.
     */
    public function launch(Request $request): RedirectResponse|JsonResponse
    {
        if (! $this->writingMentorService->isEnabled()) {
            return response()->json([
                'message' => 'WritingMentor integration is not enabled yet.',
            ], 503);
        }

        $url = $this->writingMentorService->buildSsoLaunchUrl($request->user());

        if ($request->wantsJson() && ! $request->hasHeader('X-Inertia')) {
            return response()->json(['launch_url' => $url]);
        }

        return redirect()->away($url);
    }

    /**
     * Process an inbound HMAC-signed webhook event from WritingMentor.
     */
    public function webhook(Request $request): JsonResponse
    {
        $rawBody = $request->getContent();
        $signature = $request->header('X-WritingMentor-Signature');
        $timestamp = $request->header('X-WritingMentor-Timestamp');

        if (! $this->writingMentorService->verifyWebhookSignature($rawBody, $signature, $timestamp)) {
            return response()->json([
                'message' => 'Invalid or expired webhook signature.',
            ], 401);
        }

        $payload = json_decode($rawBody, true);
        if (! is_array($payload)) {
            return response()->json(['message' => 'Malformed JSON payload.'], 422);
        }

        try {
            $event = $this->writingMentorService->handleWebhookPayload($payload);

            return response()->json([
                'status' => 'processed',
                'event_id' => $event->event_id,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
