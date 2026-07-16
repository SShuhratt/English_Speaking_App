<?php

namespace App\Services;

use App\Events\UserMatched;
use App\Models\User;
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

    /**
     * Mark a pupil as active/online on the speaking page.
     */
    public function setPupilOnline(string $userId): void
    {
        Redis::zadd('speaking_online_pupils', time(), $userId);
        Redis::zremrangebyscore('speaking_online_pupils', '-inf', time() - 35);
    }

    /**
     * Mark a pupil as offline from the speaking page.
     */
    public function setPupilOffline(string $userId): void
    {
        Redis::zrem('speaking_online_pupils', $userId);
    }

    /**
     * Get list of other online pupils.
     */
    public function getOnlinePupils(string $currentUserId): array
    {
        Redis::zremrangebyscore('speaking_online_pupils', '-inf', time() - 35);
        $onlineIds = Redis::zrange('speaking_online_pupils', 0, -1);
        $onlineIds = array_diff($onlineIds, [$currentUserId]);

        if (empty($onlineIds)) {
            return [];
        }

        return User::whereIn('id', $onlineIds)
            ->where('role', 'pupil')
            ->with('pupilProfile')
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->full_name,
                'headline' => $u->pupilProfile?->headline ?? '',
                'target_overall_band' => $u->pupilProfile?->target_overall_band ?? '',
                'target_speaking_band' => $u->pupilProfile?->target_speaking_band ?? '',
                'avatar_url' => $u->avatar,
            ])
            ->toArray();
    }

    /**
     * Send direct speaking request to a pupil.
     */
    public function sendDirectRequest(string $senderId, string $receiverId): void
    {
        Redis::hset("speaking_direct_requests:{$receiverId}", $senderId, time());
        Redis::expire("speaking_direct_requests:{$receiverId}", 60);
    }

    /**
     * Get active incoming speaking requests for a pupil.
     */
    public function getIncomingRequests(string $receiverId): array
    {
        $requests = Redis::hgetall("speaking_direct_requests:{$receiverId}");
        if (empty($requests)) {
            return [];
        }

        $senderIds = [];
        $now = time();
        foreach ($requests as $senderId => $timestamp) {
            if ($now - $timestamp > 30) {
                Redis::hdel("speaking_direct_requests:{$receiverId}", $senderId);
            } else {
                $senderIds[] = $senderId;
            }
        }

        if (empty($senderIds)) {
            return [];
        }

        return User::whereIn('id', $senderIds)
            ->where('role', 'pupil')
            ->with('pupilProfile')
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->full_name,
                'headline' => $u->pupilProfile?->headline ?? '',
                'target_overall_band' => $u->pupilProfile?->target_overall_band ?? '',
                'target_speaking_band' => $u->pupilProfile?->target_speaking_band ?? '',
                'avatar_url' => $u->avatar,
            ])
            ->toArray();
    }

    /**
     * Decline a direct speaking request.
     */
    public function declineDirectRequest(string $senderId, string $receiverId): void
    {
        Redis::hdel("speaking_direct_requests:{$receiverId}", $senderId);
    }

    /**
     * Accept a direct speaking request and establish a match.
     */
    public function acceptDirectRequest(string $senderId, string $receiverId): ?array
    {
        Redis::hdel("speaking_direct_requests:{$receiverId}", $senderId);

        if (! Redis::zscore('speaking_online_pupils', $senderId)) {
            return null;
        }

        if (Redis::exists("active_speaking_session:{$senderId}") || Redis::exists("active_speaking_session:{$receiverId}")) {
            return null;
        }

        Redis::lrem('speaking_matchmaking_queue', 0, $senderId);
        Redis::lrem('speaking_matchmaking_queue', 0, $receiverId);

        $ids = [$senderId, $receiverId];
        sort($ids);
        $roomId = "room_{$ids[0]}_{$ids[1]}";

        $session1 = json_encode(['room_id' => $roomId, 'partner_id' => $receiverId]);
        $session2 = json_encode(['room_id' => $roomId, 'partner_id' => $senderId]);

        Redis::setex("active_speaking_session:{$senderId}", 3600, $session1);
        Redis::setex("active_speaking_session:{$receiverId}", 3600, $session2);

        Redis::setex("speaking_heartbeat:{$senderId}", 30, 'active');
        Redis::setex("speaking_heartbeat:{$receiverId}", 30, 'active');

        try {
            broadcast(new UserMatched($senderId, $receiverId, $roomId));
            broadcast(new UserMatched($receiverId, $senderId, $roomId));
        } catch (\Exception $e) {
            logger()->error("Matchmaking direct request broadcast failed for users {$senderId} & {$receiverId}: ".$e->getMessage());
        }

        return [
            'status' => 'matched',
            'room_id' => $roomId,
            'partner_id' => $senderId,
        ];
    }
}
