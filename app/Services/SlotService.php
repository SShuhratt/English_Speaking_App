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

                return $this->removeBookedSlots(
                    $teacherId,
                    $day,
                    $slots
                );
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

        return $filtered;
    }

    protected function generateRecurringSlots(
        string $teacherId,
        Carbon $date
    ): Collection {

        $slots = collect();

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

        return $slots;
    }

    protected function generateCustomSlots(
        string $teacherId,
        Carbon $date
    ): Collection {

        $startOfDay = $date->copy()->subDay()->startOfDay();
        $endOfDay = $date->copy()->addDay()->endOfDay();

        $availabilities = TeacherAvailability::query()
            ->where('teacher_id', $teacherId)
            ->where('type', 'custom')
            ->where('is_active', true)
            ->where('start_at', '<=', $endOfDay)
            ->where('end_at', '>=', $startOfDay)
            ->get();

        return $this->buildCustomSlots(
            $availabilities
        );
    }

    protected function buildRecurringSlots(
        Collection $availabilities,
        Carbon $date
    ): Collection {

        $slots = collect();

        foreach ($availabilities as $availability) {

            $current = Carbon::parse(
                $date->format('Y-m-d')
                .' '
                .$availability->start_time
            );

            $end = Carbon::parse(
                $date->format('Y-m-d')
                .' '
                .$availability->end_time
            );

            if ($availability->slot_duration === 0) {
                $slots->push([
                    'start_at' => $current->copy(),
                    'end_at' => $end->copy(),
                    'is_all_time' => true,
                ]);

                continue;
            }

            while (
                $current
                    ->copy()
                    ->addMinutes(
                        $availability->slot_duration
                    )
                    ->lte($end)
            ) {

                $slots->push([
                    'start_at' => $current->copy(),
                    'end_at' => $current
                        ->copy()
                        ->addMinutes(
                            $availability->slot_duration
                        ),
                ]);

                $current = $current->addMinutes(
                    $availability->slot_duration
                );
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

            if ($availability->slot_duration === 0) {
                $slots->push([
                    'start_at' => $current,
                    'end_at' => $end,
                    'is_all_time' => true,
                ]);

                continue;
            }

            while (
                $current
                    ->copy()
                    ->addMinutes(
                        $availability->slot_duration
                    )
                    ->lte($availability->end_at)
            ) {

                $slots->push([
                    'start_at' => $current->copy(),
                    'end_at' => $current
                        ->copy()
                        ->addMinutes(
                            $availability->slot_duration
                        ),
                ]);

                $current = $current->addMinutes(
                    $availability->slot_duration
                );
            }
        }

        return $slots;
    }

    protected function subtractIntervals(array $freeIntervals, CarbonInterface $bStart, CarbonInterface $bEnd): array
    {
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
                'confirmed',
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
            if (isset($slot['is_all_time']) && $slot['is_all_time'] === true) {
                $freeIntervals = [$slot];
                foreach ($appointments as $appointment) {
                    $freeIntervals = $this->subtractIntervals($freeIntervals, $appointment->start_at, $appointment->end_at);
                }
                foreach ($freeIntervals as $interval) {
                    if ($interval['start_at']->diffInMinutes($interval['end_at']) >= 5) {
                        $finalSlots->push($interval);
                    }
                }
            } else {
                $isBooked = false;
                foreach ($appointments as $appointment) {
                    if (
                        $appointment->start_at < $slot['end_at']
                        &&
                        $appointment->end_at > $slot['start_at']
                    ) {
                        $isBooked = true;
                        break;
                    }
                }
                if (! $isBooked) {
                    $finalSlots->push($slot);
                }
            }
        }

        return $finalSlots
            ->map(function ($slot) {
                return [
                    'start_at' => $slot['start_at']->toIso8601String(),
                    'end_at' => $slot['end_at']->toIso8601String(),
                    'is_all_time' => $slot['is_all_time'] ?? false,
                ];
            })
            ->values()
            ->toArray();
    }
}
