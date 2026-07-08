<?php

namespace App\Http\Controllers;

use App\Services\MatchmakingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MatchmakingController extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @param \App\Services\MatchmakingService $matchmakingService
     */
    public function __construct(
        protected MatchmakingService $matchmakingService
    ) {}

    /**
     * Join the matchmaking queue.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function join(Request $request): JsonResponse
    {
        $userId = (string) auth()->id();
        $result = $this->matchmakingService->enterQueue($userId);

        return response()->json($result);
    }

    /**
     * Leave the matchmaking queue.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function leave(Request $request): JsonResponse
    {
        $userId = (string) auth()->id();
        $this->matchmakingService->leaveQueue($userId);

        return response()->json(['status' => 'left']);
    }
}
