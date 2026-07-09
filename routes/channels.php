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

Broadcast::channel('teacher.{teacherId}', function ($user, $teacherId) {
    return (string) $user->id === (string) $teacherId;
});

Broadcast::channel('pupil.{pupilId}', function ($user, $pupilId) {
    return (string) $user->id === (string) $pupilId;
});
