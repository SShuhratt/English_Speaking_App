<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Conversation;
use App\Models\User;
use Carbon\Carbon;

class StreakService
{
    /**
     * Calculate consecutive active day streak for a pupil or teacher.
     */
    public static function calculateForUser(?User $user): int
    {
        if (! $user || $user->role === 'admin') {
            return 0;
        }

        $userId = $user->id;
        $isPupil = $user->role === 'pupil';

        // 1. Appointment Dates (where meeting_started = true OR status in ['confirmed', 'completed'])
        $appointmentQuery = Appointment::query();

        if ($isPupil) {
            $appointmentQuery->where('pupil_id', $userId);
        } else {
            $appointmentQuery->where('teacher_id', $userId);
        }

        $appointmentDates = $appointmentQuery
            ->where(function ($q) {
                $q->where('meeting_started', true)
                    ->orWhereIn('status', ['confirmed', 'completed']);
            })
            ->pluck('start_at')
            ->map(fn ($dt) => Carbon::parse($dt)->toDateString());

        // 2. Conversation Dates
        $conversationQuery = Conversation::query();

        if ($isPupil) {
            $conversationQuery->where(function ($q) use ($userId) {
                $q->where('pupil_id', $userId)
                    ->orWhere('teacher_id', $userId);
            });
        } else {
            $conversationQuery->where('teacher_id', $userId);
        }

        $conversationDates = $conversationQuery
            ->pluck('started_at')
            ->map(fn ($dt) => Carbon::parse($dt)->toDateString());

        // 3. Combine unique active dates
        $allDates = $appointmentDates
            ->concat($conversationDates)
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        if (empty($allDates)) {
            return 0;
        }

        $dateLookup = array_flip($allDates);

        $today = Carbon::today()->toDateString();
        $yesterday = Carbon::yesterday()->toDateString();

        if (isset($dateLookup[$today])) {
            $cursor = Carbon::today();
        } elseif (isset($dateLookup[$yesterday])) {
            $cursor = Carbon::yesterday();
        } else {
            return 0;
        }

        $streak = 0;
        while (isset($dateLookup[$cursor->toDateString()])) {
            $streak++;
            $cursor->subDay();
        }

        return $streak;
    }
}
