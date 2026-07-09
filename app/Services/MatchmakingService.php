<?php

namespace App\Services;

use App\Events\UserMatched;
use Illuminate\Support\Facades\Redis;

class MatchmakingService
{
    private const QUEUE_KEY = 'speaking_matchmaking_queue';

    /**
     * Enter the matchmaking queue.
     */
    public function enterQueue(string $userId): array
    {
        // Prevent duplicate instances of this user in the queue
        Redis::lrem(self::QUEUE_KEY, 0, $userId);

        // Retrieve the first opponent in queue
        $opponentId = Redis::lpop(self::QUEUE_KEY);

        if ($opponentId) {
            $opponentId = (string) $opponentId;

            // Prevent self-matching
            if ($opponentId === $userId) {
                Redis::rpush(self::QUEUE_KEY, $userId);

                return ['status' => 'waiting'];
            }

            // Create a unique matching room identifier (sorted alphabetically)
            $ids = [$userId, $opponentId];
            sort($ids);
            $roomId = "room_{$ids[0]}_{$ids[1]}";

            // Broadcast matching status immediately
            try {
                broadcast(new UserMatched($userId, $opponentId, $roomId));
                broadcast(new UserMatched($opponentId, $userId, $roomId));
            } catch (\Exception $e) {
                logger()->error("Matchmaking broadcast failed for users {$userId} & {$opponentId}: ".$e->getMessage());
            }

            return [
                'status' => 'matched',
                'room_id' => $roomId,
                'opponent_id' => $opponentId,
            ];
        }

        // Add the current user to the queue
        Redis::rpush(self::QUEUE_KEY, $userId);

        return ['status' => 'waiting'];
    }

    /**
     * Leave the matchmaking queue.
     */
    public function leaveQueue(string $userId): void
    {
        Redis::lrem(self::QUEUE_KEY, 0, $userId);
    }
}
