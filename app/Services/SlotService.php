<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\TeacherAvailability;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class SlotService
{
    public function getNextAvailableSlot(string $teacherId): ?array
    {
        $today = Carbon::now('Asia/Tashkent');
        for ($i = 0; $i < 7; $i++) {
            $dateStr = $today->copy()->addDays($i)->format('Y-m-d');
            $slots = $this->getAvailableSlots($teacherId, $dateStr);
            if (! empty($slots)) {
                return $slots[0];
            }
        }

        return null;
    }

    public function getAvailableSlots(
        string $teacherId,
        string $date
    ): array {

        $cacheKey = sprintf(
            'teacher:%s:slots:%s',
            $teacherId,
            $date
        );

        $slots = Cache::remember(
            $cacheKey,
            now()->addHour(),
            function () use (
                $teacherId,
                $date
            ) {
                // Delete expired custom availabilities from the DB
                TeacherAvailability::where('teacher_id', $teacherId)
                    ->where('type', 'custom')
                    ->where('end_at', '<', Carbon::now())
                    ->delete();

                $day = Carbon::parse($date);
                $slots = collect();

                $slots = $slots->merge(
                    $this->generateRecurringSlots(
                        $teacherId,
                        $day
                    )
                );

                $slots = $slots->merge(
                    $this->generateCustomSlots(
                        $teacherId,
                        $day
                    )
                );

                $allSlots = $this->removeBookedSlots(
                    $teacherId,
                    $day,
                    $slots
                );

                return collect($allSlots)->unique('start_at')->values()->toArray();
            }
        );

        // Filter out past slots after cache retrieval to ensure accuracy to the current minute
        $now = Carbon::now();
        $filtered = [];
        foreach ($slots as $slot) {
            $start = Carbon::parse($slot['start_at']);
            $end = Carbon::parse($slot['end_at']);
            $isAllTime = $slot['is_all_time'] ?? false;

            if ($isAllTime) {
                if ($end->lte($now)) {
                    continue;
                }
                if ($start->lt($now)) {
                    $start = $now->copy()->addMinutes(5)->startOfMinute();
                    if ($start->diffInMinutes($end) < 5) {
                        continue;
                    }
                }
                $filtered[] = [
                    'start_at' => $start->toIso8601String(),
                    'end_at' => $end->toIso8601String(),
                    'is_all_time' => true,
                ];
            } else {
                if ($start->gt($now)) {
                    $filtered[] = $slot;
                }
            }
        }

        return array_values(collect($filtered)->unique('start_at')->toArray());
    }

    protected function generateRecurringSlots(
        string $teacherId,
        Carbon $date
    ): Collection {

        $slots = collect();
        $dateStr = $date->format('Y-m-d');

        // Generate recurring slots for yesterday, today, and tomorrow to handle timezone shifts
        foreach ([$date->copy()->subDay(), $date, $date->copy()->addDay()] as $targetDate) {
            $availabilities = TeacherAvailability::query()
                ->where('teacher_id', $teacherId)
                ->where('type', 'recurring')
                ->where('is_active', true)
                ->where(
                    'day_of_week',
                    strtolower($targetDate->format('l'))
                )
                ->get();

            $slots = $slots->merge(
                $this->buildRecurringSlots(
                    $availabilities,
                    $targetDate
                )
            );
        }

        return $slots->filter(function ($slot) use ($dateStr) {
            $startTz = $slot['start_at']->copy()->setTimezone('Asia/Tashkent');

            return $startTz->format('Y-m-d') === $dateStr;
        });
    }

    protected function generateCustomSlots(
        string $teacherId,
        Carbon $date
    ): Collection {

        $dateStr = $date->format('Y-m-d');
        $startOfDay = $date->copy()->subDay()->startOfDay();
        $endOfDay = $date->copy()->addDay()->endOfDay();

        $availabilities = TeacherAvailability::query()
            ->where('teacher_id', $teacherId)
            ->where('type', 'custom')
            ->where('is_active', true)
            ->where('start_at', '<=', $endOfDay)
            ->where('end_at', '>=', $startOfDay)
            ->get();

        $slots = $this->buildCustomSlots(
            $availabilities
        );

        return $slots->filter(function ($slot) use ($dateStr) {
            $startTz = $slot['start_at']->copy()->setTimezone('Asia/Tashkent');

            return $startTz->format('Y-m-d') === $dateStr;
        });
    }

    protected function buildRecurringSlots(
        Collection $availabilities,
        Carbon $date
    ): Collection {

        $slots = collect();

        foreach ($availabilities as $availability) {
            $tz = $availability->timezone ?: 'Asia/Tashkent';

            $current = Carbon::parse(
                $date->format('Y-m-d')
                .' '
                .$availability->start_time,
                $tz
            );

            $end = Carbon::parse(
                $date->format('Y-m-d')
                .' '
                .$availability->end_time,
                $tz
            );

            $slotDur = ($availability->slot_duration && (int) $availability->slot_duration > 0) ? (int) $availability->slot_duration : 30;

            while (
                $current
                    ->copy()
                    ->addMinutes($slotDur)
                    ->lte($end)
            ) {
                $slots->push([
                    'start_at' => $current->copy(),
                    'end_at' => $current->copy()->addMinutes($slotDur),
                ]);

                $current = $current->addMinutes($slotDur);
            }
        }

        return $slots;
    }

    protected function buildCustomSlots(
        Collection $availabilities
    ): Collection {

        $slots = collect();

        foreach ($availabilities as $availability) {

            $current = $availability->start_at->copy();
            $end = $availability->end_at->copy();
            $slotDur = ($availability->slot_duration && (int) $availability->slot_duration > 0) ? (int) $availability->slot_duration : 30;

            while (
                $current
                    ->copy()
                    ->addMinutes($slotDur)
                    ->lte($end)
            ) {
                $slots->push([
                    'start_at' => $current->copy(),
                    'end_at' => $current->copy()->addMinutes($slotDur),
                ]);

                $current = $current->addMinutes($slotDur);
            }
        }

        return $slots;
    }

    protected function subtractIntervals(array $freeIntervals, CarbonInterface $bStart, CarbonInterface $bEnd): array
    {
        $bStart = $bStart->copy()->setTimezone('Asia/Tashkent');
        $bEnd = $bEnd->copy()->setTimezone('Asia/Tashkent');
        $result = [];
        foreach ($freeIntervals as $interval) {
            $fStart = $interval['start_at'];
            $fEnd = $interval['end_at'];

            if ($bStart >= $fEnd || $bEnd <= $fStart) {
                $result[] = $interval;
            } elseif ($bStart <= $fStart && $bEnd >= $fEnd) {
                // Completely covered, swallowed
            } elseif ($bStart > $fStart && $bEnd < $fEnd) {
                $result[] = ['start_at' => $fStart, 'end_at' => $bStart, 'is_all_time' => true];
                $result[] = ['start_at' => $bEnd, 'end_at' => $fEnd, 'is_all_time' => true];
            } elseif ($bStart <= $fStart && $bEnd > $fStart && $bEnd < $fEnd) {
                $result[] = ['start_at' => $bEnd, 'end_at' => $fEnd, 'is_all_time' => true];
            } elseif ($bStart > $fStart && $bStart < $fEnd && $bEnd >= $fEnd) {
                $result[] = ['start_at' => $fStart, 'end_at' => $bStart, 'is_all_time' => true];
            }
        }

        return $result;
    }

    protected function removeBookedSlots(
        string $teacherId,
        Carbon $date,
        Collection $slots
    ): array {

        $startOfDay = $date->copy()->subDay()->startOfDay();
        $endOfDay = $date->copy()->addDay()->endOfDay();

        $appointments = Appointment::query()
            ->where('teacher_id', $teacherId)
            ->whereIn('status', [
                'pending',
                'accepted',
                'confirmed',
                'cancelled',
            ])
            ->where(function ($query) use (
                $startOfDay,
                $endOfDay
            ) {
                $query
                    ->where('start_at', '<', $endOfDay)
                    ->where('end_at', '>', $startOfDay);
            })
            ->get();

        $finalSlots = collect();

        foreach ($slots as $slot) {
            $slotStart = Carbon::parse($slot['start_at']);
            $slotEnd = Carbon::parse($slot['end_at']);
            $isBooked = false;

            foreach ($appointments as $appointment) {
                if ($appointment->status === 'cancelled') {
                    $cancelledAt = $appointment->updated_at ?? now();
                    // If cancelled before or at start time, all slots are freed up
                    if ($cancelledAt->lte($appointment->start_at)) {
                        continue;
                    }
                    // If cancelled mid-session, slots starting before cancelledAt remain unavailable
                    if ($slotStart < $cancelledAt && $appointment->start_at < $slotEnd && $appointment->end_at > $slotStart) {
                        $isBooked = true;
                        break;
                    }
                } else {
                    // Active appointment (pending, accepted, confirmed)
                    if ($appointment->start_at < $slotEnd && $appointment->end_at > $slotStart) {
                        $isBooked = true;
                        break;
                    }
                }
            }

            if (! $isBooked) {
                $finalSlots->push($slot);
            }
        }

        return $finalSlots
            ->map(function ($slot) {
                $sStart = $slot['start_at'] instanceof Carbon ? $slot['start_at']->toIso8601String() : (string) $slot['start_at'];
                $sEnd = $slot['end_at'] instanceof Carbon ? $slot['end_at']->toIso8601String() : (string) $slot['end_at'];

                return [
                    'start_at' => $sStart,
                    'end_at' => $sEnd,
                    'is_all_time' => false,
                ];
            })
            ->values()
            ->toArray();
    }
}
