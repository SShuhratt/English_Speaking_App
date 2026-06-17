<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\TeacherAvailability;
use Carbon\Carbon;
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
        return array_values(array_filter($slots, function ($slot) {
            return Carbon::parse($slot['start_at'])->gt(Carbon::now());
        }));
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

        return $slots
            ->filter(function ($slot) use ($appointments) {

                foreach ($appointments as $appointment) {

                    if (
                        $appointment->start_at < $slot['end_at']
                        &&
                        $appointment->end_at > $slot['start_at']
                    ) {
                        return false;
                    }
                }

                return true;
            })
            ->map(function ($slot) {
                return [
                    'start_at' => $slot['start_at']->toIso8601String(),
                    'end_at' => $slot['end_at']->toIso8601String(),
                ];
            })
            ->values()
            ->toArray();
    }
}
