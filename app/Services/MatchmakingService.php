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

        // Retrieve the first partner in queue
        $partnerId = Redis::lpop(self::QUEUE_KEY);

        if ($partnerId) {
            $partnerId = (string) $partnerId;

            // Prevent self-matching
            if ($partnerId === $userId) {
                Redis::rpush(self::QUEUE_KEY, $userId);

                return ['status' => 'waiting'];
            }

            // Create a unique matching room identifier (sorted alphabetically)
            $ids = [$userId, $partnerId];
            sort($ids);
            $roomId = "room_{$ids[0]}_{$ids[1]}";

            // Save active session for both matched users in Redis
            $session1 = json_encode(['room_id' => $roomId, 'partner_id' => $partnerId]);
            $session2 = json_encode(['room_id' => $roomId, 'partner_id' => $userId]);

            Redis::setex("active_speaking_session:{$userId}", 3600, $session1);
            Redis::setex("active_speaking_session:{$partnerId}", 3600, $session2);

            // Set heartbeat active for both users on match initiation
            Redis::setex("speaking_heartbeat:{$userId}", 30, 'active');
            Redis::setex("speaking_heartbeat:{$partnerId}", 30, 'active');

            // Broadcast matching status immediately
            try {
                broadcast(new UserMatched($userId, $partnerId, $roomId));
                broadcast(new UserMatched($partnerId, $userId, $roomId));
            } catch (\Exception $e) {
                logger()->error("Matchmaking broadcast failed for users {$userId} & {$partnerId}: ".$e->getMessage());
            }

            return [
                'status' => 'matched',
                'room_id' => $roomId,
                'partner_id' => $partnerId,
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

        $sessionJson = Redis::get("active_speaking_session:{$userId}");
        if ($sessionJson) {
            $session = json_decode($sessionJson, true);
            $partnerId = $session['partner_id'];

            Redis::del("active_speaking_session:{$userId}");
            Redis::del("active_speaking_session:{$partnerId}");
            Redis::del("speaking_heartbeat:{$userId}");
            Redis::del("speaking_heartbeat:{$partnerId}");
        }
    }
}
