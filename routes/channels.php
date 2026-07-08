<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('user.match.{userId}', function ($user, $userId) {
    return (string) $user->id === (string) $userId;
});

Broadcast::channel('matchroom.{roomId}', function ($user, $roomId) {
    if (auth()->check()) {
        return [
            'id' => $user->id,
            'full_name' => $user->full_name,
        ];
    }
    return false;
});
