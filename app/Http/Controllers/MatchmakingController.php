<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\MatchmakingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;

class MatchmakingController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(
        protected MatchmakingService $matchmakingService
    ) {}

    /**
     * Join the matchmaking queue.
     */
    public function join(Request $request): JsonResponse
    {
        $userId = (string) auth()->id();
        $result = $this->matchmakingService->enterQueue($userId);

        return response()->json($result);
    }

    /**
     * Leave the matchmaking queue.
     */
    public function leave(Request $request): JsonResponse
    {
        $userId = (string) auth()->id();
        $this->matchmakingService->leaveQueue($userId);
        $this->matchmakingService->setPupilOffline($userId);

        return response()->json(['status' => 'left']);
    }

    /**
     * Check if there is an active speaking session for the user.
     */
    public function activeSession(Request $request): JsonResponse
    {
        $userId = (string) $request->user()->id;
        $sessionJson = Redis::get("active_speaking_session:{$userId}");

        if (! $sessionJson) {
            return response()->json(null);
        }

        $session = json_decode($sessionJson, true);
        $partner = User::find($session['partner_id']);

        return response()->json([
            'room_id' => $session['room_id'],
            'partner_id' => $session['partner_id'],
            'partner_name' => $partner ? $partner->full_name : 'Speaking Partner',
        ]);
    }

    /**
     * Record a heartbeat from a user and monitor partner connection presence.
     */
    public function heartbeat(Request $request): JsonResponse
    {
        $userId = (string) $request->user()->id;

        // Set user's heartbeat as active for another 30 seconds
        Redis::setex("speaking_heartbeat:{$userId}", 30, 'active');

        // Track presence
        $this->matchmakingService->setPupilOnline($userId);

        // Fetch online users & incoming requests
        $onlinePupils = $this->matchmakingService->getOnlinePupils($userId);
        $incomingRequests = $this->matchmakingService->getIncomingRequests($userId);

        // Check if user is in an active session
        $sessionJson = Redis::get("active_speaking_session:{$userId}");
        if ($sessionJson) {
            $session = json_decode($sessionJson, true);
            $partnerId = $session['partner_id'];

            // Check if partner's heartbeat has expired
            if (! Redis::exists("speaking_heartbeat:{$partnerId}")) {
                // Partner has been offline for > 30 seconds, terminate session
                Redis::del("active_speaking_session:{$userId}");
                Redis::del("active_speaking_session:{$partnerId}");

                return response()->json([
                    'status' => 'terminated',
                    'reason' => 'partner_offline',
                    'online_pupils' => $onlinePupils,
                    'incoming_requests' => $incomingRequests,
                ]);
            }
        }

        return response()->json([
            'status' => 'alive',
            'online_pupils' => $onlinePupils,
            'incoming_requests' => $incomingRequests,
        ]);
    }

    /**
     * Send direct speaking request.
     */
    public function sendRequest(Request $request): JsonResponse
    {
        $senderId = (string) auth()->id();
        $receiverId = (string) $request->input('receiver_id');

        if (! $receiverId || $senderId === $receiverId) {
            return response()->json(['error' => 'Invalid receiver.'], 400);
        }

        $this->matchmakingService->sendDirectRequest($senderId, $receiverId);

        return response()->json(['status' => 'requested']);
    }

    /**
     * Accept incoming direct speaking request.
     */
    public function acceptRequest(Request $request): JsonResponse
    {
        $receiverId = (string) auth()->id();
        $senderId = (string) $request->input('sender_id');

        if (! $senderId) {
            return response()->json(['error' => 'Invalid sender.'], 400);
        }

        $result = $this->matchmakingService->acceptDirectRequest($senderId, $receiverId);

        if (! $result) {
            return response()->json(['error' => 'Sender went offline or request expired.'], 400);
        }

        return response()->json($result);
    }

    /**
     * Decline incoming direct speaking request.
     */
    public function declineRequest(Request $request): JsonResponse
    {
        $receiverId = (string) auth()->id();
        $senderId = (string) $request->input('sender_id');

        if (! $senderId) {
            return response()->json(['error' => 'Invalid sender.'], 400);
        }

        $this->matchmakingService->declineDirectRequest($senderId, $receiverId);

        return response()->json(['status' => 'declined']);
    }
}
