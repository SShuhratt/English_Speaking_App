<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\TeacherAvailability;
use App\Models\TeacherPackage;
use App\Support\PlatformTime;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class TeacherAvailabilityController extends Controller
{
    public function index(Request $request)
    {
        // Expire unpaid appointments whose scheduled conversation end time has passed
        Appointment::where('teacher_id', $request->user()->id)
            ->whereIn('status', ['pending', 'accepted'])
            ->where('payment_status', '!=', 'paid')
            ->where('end_at', '<=', PlatformTime::now())
            ->update([
                'status' => 'cancelled',
                'cancellation_reason' => 'Conversation time expired without payment',
                'payment_status' => 'rejected',
                'payment_rejection_reason' => 'Payment time expired',
            ]);

        $availabilities = TeacherAvailability::where('teacher_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $appointments = Appointment::where('teacher_id', $request->user()->id)
            ->with('pupil:id,full_name,avatar')
            ->orderBy('start_at', 'asc')
            ->get();

        try {
            $packages = TeacherPackage::where('teacher_id', $request->user()->id)
                ->orderBy('total_hours', 'asc')
                ->get();
        } catch (\Throwable $e) {
            $packages = collect();
        }

        return Inertia::render('teacher/availability', [
            'availabilities' => $availabilities,
            'appointments' => $appointments,
            'packages' => $packages,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'in:recurring,custom'],
            // Recurring fields
            'day_of_week' => ['nullable', 'string', 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday'],
            'days_of_week' => ['nullable', 'array'],
            'days_of_week.*' => ['string', 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time' => [
                'nullable',
                'date_format:H:i',
                function ($attribute, $value, $fail) use ($request) {
                    if ($request->input('start_time') && $value <= $request->input('start_time')) {
                        $fail(__('availability.end_time_after_start'));
                    }
                },
            ],
            // Custom fields
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'start_at' => ['nullable', 'date'],
            'end_at' => ['nullable', 'date', 'after:start_at'],
            // Shared fields
            'slot_duration' => ['nullable', 'integer', 'min:0', 'max:1440'],
        ]);

        $teacherId = $request->user()->id;
        $slotDuration = (isset($validated['slot_duration']) && (int) $validated['slot_duration'] > 0) ? (int) $validated['slot_duration'] : 30;
        $tz = 'Asia/Tashkent';
        $nowTz = Carbon::now($tz);

        if ($validated['type'] === 'recurring') {
            $days = ! empty($validated['days_of_week'])
                ? array_values(array_unique($validated['days_of_week']))
                : (! empty($validated['day_of_week']) ? [$validated['day_of_week']] : []);

            if (empty($days)) {
                return back()->withErrors(['day_of_week' => __('availability.select_at_least_one_day')]);
            }

            if (empty($validated['start_time']) || empty($validated['end_time'])) {
                return back()->withErrors(['start_time' => __('availability.start_end_dates_required')]);
            }

            $reqStart = $validated['start_time'];
            $reqEnd = $validated['end_time'];

            foreach ($days as $day) {
                // Strict validation: Reject if overlapping active recurring availability exists on this weekday
                $existingRecurring = TeacherAvailability::where('teacher_id', $teacherId)
                    ->where('type', 'recurring')
                    ->where('is_active', true)
                    ->where('day_of_week', $day)
                    ->get();

                foreach ($existingRecurring as $exRec) {
                    if ($reqStart < $exRec->end_time && $reqEnd > $exRec->start_time) {
                        return back()->withErrors([
                            'start_time' => __('availability.overlap_recurring', [
                                'start' => substr($reqStart, 0, 5),
                                'end' => substr($reqEnd, 0, 5),
                                'day' => __('availability.days.'.strtolower($day)),
                                'existing_start' => substr($exRec->start_time, 0, 5),
                                'existing_end' => substr($exRec->end_time, 0, 5),
                            ]),
                        ]);
                    }
                }

                // Check upcoming custom dates for clashes
                $checkDate = Carbon::now($tz);
                if (strtolower($checkDate->format('l')) !== strtolower($day)) {
                    $checkDate->next($day);
                }
                for ($w = 0; $w < 8; $w++) {
                    $dayStr = $checkDate->format('Y-m-d');
                    $dayStartUtc = PlatformTime::toUtc("{$dayStr} {$reqStart}");
                    $dayEndUtc = PlatformTime::toUtc("{$dayStr} {$reqEnd}");

                    $conflictingCustom = TeacherAvailability::where('teacher_id', $teacherId)
                        ->where('type', 'custom')
                        ->where('is_active', true)
                        ->where('start_at', '<', $dayEndUtc)
                        ->where('end_at', '>', $dayStartUtc)
                        ->first();

                    if ($conflictingCustom) {
                        return back()->withErrors([
                            'start_time' => __('availability.overlap_recurring_custom', [
                                'start' => substr($reqStart, 0, 5),
                                'end' => substr($reqEnd, 0, 5),
                                'date' => $dayStr,
                                'existing_start' => PlatformTime::toLocal($conflictingCustom->start_at)->format('H:i'),
                                'existing_end' => PlatformTime::toLocal($conflictingCustom->end_at)->format('H:i'),
                            ]),
                        ]);
                    }

                    $checkDate->addWeek();
                }
            }

            foreach ($days as $day) {
                TeacherAvailability::create([
                    'teacher_id' => $teacherId,
                    'type' => 'recurring',
                    'day_of_week' => $day,
                    'start_time' => $validated['start_time'],
                    'end_time' => $validated['end_time'],
                    'slot_duration' => $slotDuration,
                    'is_active' => true,
                ]);

                // Clear cache for next 8 weeks for this day of the week
                $current = Carbon::now($tz);
                if (strtolower($current->format('l')) !== strtolower($day)) {
                    $current->next($day);
                }
                for ($i = 0; $i < 8; $i++) {
                    $dateStr = $current->format('Y-m-d');
                    Cache::forget("teacher:{$teacherId}:slots:{$dateStr}");
                    $current->addWeek();
                }
            }

            return back()->with('success', __('availability.added_successfully'));
        }

        // Custom Availability
        $customDays = [];
        if (! empty($validated['start_date']) && ! empty($validated['end_date'])) {
            $startDate = Carbon::parse($validated['start_date'], $tz)->startOfDay();
            $endDate = Carbon::parse($validated['end_date'], $tz)->startOfDay();
            $startTimeStr = $validated['start_time'] ?? '09:00';
            $endTimeStr = $validated['end_time'] ?? '17:00';

            $cursor = $startDate->copy();
            while ($cursor->lte($endDate)) {
                $dayStr = $cursor->format('Y-m-d');
                $customDays[] = [
                    'date_str' => $dayStr,
                    'day_start' => Carbon::parse("{$dayStr} {$startTimeStr}", $tz),
                    'day_end' => Carbon::parse("{$dayStr} {$endTimeStr}", $tz),
                    'error_key' => 'start_date',
                ];
                $cursor->addDay();
            }
        } elseif (! empty($validated['start_at']) && ! empty($validated['end_at'])) {
            $startAt = Carbon::parse($validated['start_at'], $tz);
            $endAt = Carbon::parse($validated['end_at'], $tz);
            $dayStr = $startAt->format('Y-m-d');
            $customDays[] = [
                'date_str' => $dayStr,
                'day_start' => $startAt,
                'day_end' => $endAt,
                'error_key' => 'start_at',
            ];
        } else {
            return back()->withErrors(['start_at' => __('availability.start_end_dates_required')]);
        }

        // Validation across all days in custom range
        foreach ($customDays as $cDay) {
            $dayStr = $cDay['date_str'];
            $dayStart = $cDay['day_start'];
            $dayEnd = $cDay['day_end'];
            $errKey = $cDay['error_key'];
            $dayName = strtolower(Carbon::parse($dayStr, $tz)->format('l'));

            // Check if there is an active recurring rule for this weekday
            $recurringRule = TeacherAvailability::where('teacher_id', $teacherId)
                ->where('type', 'recurring')
                ->where('is_active', true)
                ->where('day_of_week', $dayName)
                ->first();

            if ($recurringRule) {
                // Must be cleared for this date first (blackout covering the recurring window or whole day)
                $recStartUtc = PlatformTime::toUtc("{$dayStr} {$recurringRule->start_time}");
                $recEndUtc = PlatformTime::toUtc("{$dayStr} {$recurringRule->end_time}");

                $isDateCleared = TeacherAvailability::where('teacher_id', $teacherId)
                    ->where('type', 'custom')
                    ->where('is_active', false)
                    ->where('start_at', '<=', $recStartUtc)
                    ->where('end_at', '>=', $recEndUtc)
                    ->exists();

                if (! $isDateCleared) {
                    return back()->withErrors([
                        $errKey => __('availability.recurring_clear_required', [
                            'day' => __('availability.days.'.$dayName),
                            'start' => substr($recurringRule->start_time, 0, 5),
                            'end' => substr($recurringRule->end_time, 0, 5),
                            'date' => $dayStr,
                        ]),
                    ]);
                }
            }

            // Check if any overlapping custom chunks have booked appointments outside the new window
            $dayStartUtc = PlatformTime::toUtc($dayStart);
            $dayEndUtc = PlatformTime::toUtc($dayEnd);

            $overlappingCustoms = TeacherAvailability::where('teacher_id', $teacherId)
                ->where('type', 'custom')
                ->where('is_active', true)
                ->where('start_at', '<', $dayEndUtc)
                ->where('end_at', '>', $dayStartUtc)
                ->get();

            if ($overlappingCustoms->isNotEmpty()) {
                $hasAppointmentsOutsideNewRange = Appointment::where('teacher_id', $teacherId)
                    ->whereIn('status', ['pending', 'accepted', 'confirmed'])
                    ->where('end_at', '>', PlatformTime::now())
                    ->where(function ($q) use ($overlappingCustoms) {
                        foreach ($overlappingCustoms as $chunk) {
                            $q->orWhere(function ($sub) use ($chunk) {
                                $sub->where('start_at', '<', $chunk->end_at)
                                    ->where('end_at', '>', $chunk->start_at);
                            });
                        }
                    })
                    ->where(function ($q) use ($dayStartUtc, $dayEndUtc) {
                        $q->where('start_at', '<', $dayStartUtc)
                            ->orWhere('end_at', '>', $dayEndUtc);
                    })
                    ->exists();

                if ($hasAppointmentsOutsideNewRange) {
                    return back()->withErrors([
                        $errKey => __('availability.has_upcoming_appointments'),
                    ]);
                }
            }
        }

        $createdCount = 0;
        foreach ($customDays as $cDay) {
            $dayStr = $cDay['date_str'];
            $dayStart = $cDay['day_start'];
            $dayEnd = $cDay['day_end'];

            // Skip if entire window on that day has passed
            if ($dayEnd->lte($nowTz)) {
                continue;
            }

            // If start time has already passed today, clamp start to current time forward
            if ($dayStart->lt($nowTz)) {
                $minute = $nowTz->minute;
                $step = ($slotDuration > 0 && $slotDuration <= 60) ? $slotDuration : 15;
                $roundedMinute = ceil($minute / $step) * $step;
                $effectiveStart = $nowTz->copy()->minute(0)->second(0)->addMinutes($roundedMinute);

                if ($effectiveStart->gte($dayEnd)) {
                    continue;
                }
                $dayStart = $effectiveStart;
            }

            $this->storeOrMergeCustomAvailability(
                $teacherId,
                PlatformTime::toUtc($dayStart),
                PlatformTime::toUtc($dayEnd),
                $slotDuration
            );

            Cache::forget("teacher:{$teacherId}:slots:{$dayStr}");
            $createdCount++;
        }

        if ($createdCount === 0) {
            $errKey = ! empty($validated['start_at']) ? 'start_at' : 'start_date';

            return back()->withErrors([$errKey => __('availability.range_passed')]);
        }

        return back()->with('success', __('availability.added_successfully'));
    }

    public function update(Request $request, string $id)
    {
        $availability = TeacherAvailability::where('teacher_id', $request->user()->id)->find($id);

        if (! $availability) {
            return back()->withErrors(['range' => __('availability.not_found')]);
        }

        $validated = $request->validate([
            'type' => ['required', 'string', 'in:recurring,custom'],
            'day_of_week' => ['required_if:type,recurring', 'nullable', 'string', 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday'],
            'start_time' => ['required_if:type,recurring', 'nullable', 'date_format:H:i'],
            'end_time' => [
                'required_if:type,recurring',
                'nullable',
                'date_format:H:i',
                function ($attribute, $value, $fail) use ($request) {
                    if ($request->input('type') === 'recurring' && $request->input('start_time') && $value <= $request->input('start_time')) {
                        $fail(__('availability.end_time_after_start'));
                    }
                },
            ],
            'start_at' => ['required_if:type,custom', 'nullable', 'date'],
            'end_at' => ['required_if:type,custom', 'nullable', 'date', 'after:start_at'],
            'slot_duration' => ['nullable', 'integer', 'min:0', 'max:1440'],
        ]);

        if ($availability->type !== $validated['type']) {
            return back()->withErrors(['range' => __('availability.type_change_not_allowed')]);
        }

        $teacherId = $request->user()->id;
        $tz = 'Asia/Tashkent';

        // Check if there are upcoming booked appointments in this availability before modifying
        if ($availability->type === 'custom' && $availability->start_at && $availability->end_at) {
            $hasBookings = Appointment::where('teacher_id', $teacherId)
                ->whereIn('status', ['pending', 'accepted', 'confirmed'])
                ->where('end_at', '>', PlatformTime::now())
                ->where(function ($query) use ($availability) {
                    $query->where('start_at', '<', $availability->end_at)
                        ->where('end_at', '>', $availability->start_at);
                })
                ->exists();

            if ($hasBookings) {
                return back()->withErrors(['range' => __('availability.has_upcoming_appointments')]);
            }
        } elseif ($availability->type === 'recurring' && $availability->day_of_week) {
            $dayOfWeek = strtolower($availability->day_of_week);

            $appointments = Appointment::where('teacher_id', $teacherId)
                ->whereIn('status', ['pending', 'accepted', 'confirmed'])
                ->where('end_at', '>', PlatformTime::now())
                ->get();

            $origStart = Carbon::parse($availability->start_time, $tz);
            $origEnd = Carbon::parse($availability->end_time, $tz);
            $startSecs = $origStart->hour * 3600 + $origStart->minute * 60 + $origStart->second;
            $endSecs = $origEnd->hour * 3600 + $origEnd->minute * 60 + $origEnd->second;

            $hasBookings = false;
            foreach ($appointments as $appt) {
                $apptStartLocal = PlatformTime::toLocal($appt->start_at);
                $apptEndLocal = PlatformTime::toLocal($appt->end_at);

                if (strtolower($apptStartLocal->format('l')) === $dayOfWeek) {
                    $apptOpen = $apptStartLocal->hour * 3600 + $apptStartLocal->minute * 60 + $apptStartLocal->second;
                    $apptClose = $apptEndLocal->hour * 3600 + $apptEndLocal->minute * 60 + $apptEndLocal->second;
                    if ($apptOpen < $endSecs && $apptClose > $startSecs) {
                        $hasBookings = true;
                        break;
                    }
                }
            }

            if ($hasBookings) {
                return back()->withErrors(['range' => __('availability.has_upcoming_appointments')]);
            }
        }

        // Overlap validation when modifying schedule
        if ($validated['type'] === 'recurring') {
            $otherRecurring = TeacherAvailability::where('teacher_id', $teacherId)
                ->where('type', 'recurring')
                ->where('is_active', true)
                ->where('id', '!=', $availability->id)
                ->where('day_of_week', $validated['day_of_week'])
                ->where('start_time', '<', $validated['end_time'])
                ->where('end_time', '>', $validated['start_time'])
                ->first();

            if ($otherRecurring) {
                return back()->withErrors([
                    'start_time' => __('availability.overlap_recurring', [
                        'start' => substr($validated['start_time'], 0, 5),
                        'end' => substr($validated['end_time'], 0, 5),
                        'day' => __('availability.days.'.strtolower($validated['day_of_week'])),
                        'existing_start' => substr($otherRecurring->start_time, 0, 5),
                        'existing_end' => substr($otherRecurring->end_time, 0, 5),
                    ]),
                ]);
            }
        } elseif ($validated['type'] === 'custom' && ! empty($validated['start_at']) && ! empty($validated['end_at'])) {
            $newStartUtc = PlatformTime::toUtc($validated['start_at']);
            $newEndUtc = PlatformTime::toUtc($validated['end_at']);
            $newStartLocal = PlatformTime::toLocal($newStartUtc);
            $newEndLocal = PlatformTime::toLocal($newEndUtc);
            $dayStr = $newStartLocal->format('Y-m-d');
            $dayName = strtolower($newStartLocal->format('l'));

            $recurringRule = TeacherAvailability::where('teacher_id', $teacherId)
                ->where('type', 'recurring')
                ->where('is_active', true)
                ->where('day_of_week', $dayName)
                ->first();

            if ($recurringRule) {
                $recStartUtc = PlatformTime::toUtc("{$dayStr} {$recurringRule->start_time}");
                $recEndUtc = PlatformTime::toUtc("{$dayStr} {$recurringRule->end_time}");

                $isDateCleared = TeacherAvailability::where('teacher_id', $teacherId)
                    ->where('type', 'custom')
                    ->where('is_active', false)
                    ->where('start_at', '<=', $recStartUtc)
                    ->where('end_at', '>=', $recEndUtc)
                    ->exists();

                if (! $isDateCleared) {
                    return back()->withErrors([
                        'start_at' => __('availability.recurring_clear_required', [
                            'day' => __('availability.days.'.$dayName),
                            'start' => substr($recurringRule->start_time, 0, 5),
                            'end' => substr($recurringRule->end_time, 0, 5),
                            'date' => $dayStr,
                        ]),
                    ]);
                }
            }

            $overlappingCustoms = TeacherAvailability::where('teacher_id', $teacherId)
                ->where('type', 'custom')
                ->where('is_active', true)
                ->where('id', '!=', $availability->id)
                ->where('start_at', '<', $newEndUtc)
                ->where('end_at', '>', $newStartUtc)
                ->get();

            if ($overlappingCustoms->isNotEmpty()) {
                $hasAppointmentsOutsideNewRange = Appointment::where('teacher_id', $teacherId)
                    ->whereIn('status', ['pending', 'accepted', 'confirmed'])
                    ->where('end_at', '>', PlatformTime::now())
                    ->where(function ($q) use ($overlappingCustoms) {
                        foreach ($overlappingCustoms as $chunk) {
                            $q->orWhere(function ($sub) use ($chunk) {
                                $sub->where('start_at', '<', $chunk->end_at)
                                    ->where('end_at', '>', $chunk->start_at);
                            });
                        }
                    })
                    ->where(function ($q) use ($newStartUtc, $newEndUtc) {
                        $q->where('start_at', '<', $newStartUtc)
                            ->orWhere('end_at', '>', $newEndUtc);
                    })
                    ->exists();

                if ($hasAppointmentsOutsideNewRange) {
                    return back()->withErrors([
                        'start_at' => __('availability.has_upcoming_appointments'),
                    ]);
                }

                // Absorb / clean up overlapping active custom chunks
                foreach ($overlappingCustoms as $chunk) {
                    $cStart = $chunk->start_at->copy()->utc();
                    $cEnd = $chunk->end_at->copy()->utc();

                    if ($cStart->gte($newStartUtc) && $cEnd->lte($newEndUtc)) {
                        // Completely covered by new range -> delete
                        $chunk->delete();
                    } elseif ($cStart->lt($newStartUtc) && $cEnd->gt($newEndUtc)) {
                        // Surrounds new range -> split
                        $chunk->update(['end_at' => $newStartUtc]);
                        TeacherAvailability::create([
                            'teacher_id' => $teacherId,
                            'type' => 'custom',
                            'start_at' => $newEndUtc,
                            'end_at' => $cEnd,
                            'slot_duration' => $chunk->slot_duration,
                            'is_active' => true,
                        ]);
                    } elseif ($cStart->lt($newStartUtc) && $cEnd->lte($newEndUtc)) {
                        // Starts before, ends inside -> trim end
                        $chunk->update(['end_at' => $newStartUtc]);
                    } elseif ($cStart->gte($newStartUtc) && $cEnd->gt($newEndUtc)) {
                        // Starts inside, ends after -> trim start
                        $chunk->update(['start_at' => $newEndUtc]);
                    }
                }
            }

            $this->resolveOverlappingBlackouts(
                $teacherId,
                $newStartUtc,
                $newEndUtc
            );
        }

        $availability->update([
            'type' => $validated['type'],
            'day_of_week' => $validated['type'] === 'recurring' ? $validated['day_of_week'] : null,
            'start_time' => $validated['type'] === 'recurring' ? $validated['start_time'] : null,
            'end_time' => $validated['type'] === 'recurring' ? $validated['end_time'] : null,
            'start_at' => $validated['type'] === 'custom' ? PlatformTime::toUtc($validated['start_at']) : null,
            'end_at' => $validated['type'] === 'custom' ? PlatformTime::toUtc($validated['end_at']) : null,
            'slot_duration' => $validated['slot_duration'] ?? $availability->slot_duration,
        ]);

        // Clear slot cache
        if ($validated['type'] === 'custom' && ! empty($validated['start_at'])) {
            $startDate = PlatformTime::toLocal($validated['start_at']);
            $endDate = PlatformTime::toLocal($validated['end_at']);
            $current = $startDate->copy()->subDay();
            $limit = $endDate->copy()->addDay();
            while ($current->lte($limit)) {
                $dateStr = $current->format('Y-m-d');
                Cache::forget("teacher:{$teacherId}:slots:{$dateStr}");
                $current->addDay();
            }
        } elseif ($validated['type'] === 'recurring' && ! empty($validated['day_of_week'])) {
            $dayOfWeek = $validated['day_of_week'];
            $current = Carbon::now($tz);
            if (strtolower($current->format('l')) !== strtolower($dayOfWeek)) {
                $current->next($dayOfWeek);
            }
            for ($i = 0; $i < 8; $i++) {
                $dateStr = $current->format('Y-m-d');
                Cache::forget("teacher:{$teacherId}:slots:{$dateStr}");
                $current->addWeek();
            }
        }

        return back()->with('success', __('availability.updated_successfully'));
    }

    public function destroy(Request $request, string $id)
    {
        $teacherId = $request->user()->id;
        $availability = TeacherAvailability::where('teacher_id', $teacherId)->find($id);

        if (! $availability) {
            return back()->withErrors(['range' => __('availability.not_found')]);
        }

        $deleteType = $request->input('delete_type', 'all');
        $scope = $request->input('scope', 'all_weeks');
        $targetDateStr = $request->input('date');
        $keepBooked = $request->boolean('keep_booked', false);
        $tz = 'Asia/Tashkent';

        // Option C: When deleting a recurring schedule for "this date only", create an inactive blackout override
        if ($availability->type === 'recurring' && $scope === 'date_only') {
            if (empty($targetDateStr)) {
                $now = Carbon::now($tz);
                $targetDateStr = strtolower($now->format('l')) === strtolower($availability->day_of_week)
                    ? $now->format('Y-m-d')
                    : $now->next($availability->day_of_week)->format('Y-m-d');
            }

            if ($deleteType === 'range') {
                $rawStart = (string) $request->input('range_start');
                $rawEnd = (string) $request->input('range_end');

                $rStart = Carbon::parse(str_contains($rawStart, ' ') || str_contains($rawStart, 'T') ? $rawStart : "{$targetDateStr} {$rawStart}", $tz);
                $rEnd = Carbon::parse(str_contains($rawEnd, ' ') || str_contains($rawEnd, 'T') ? $rawEnd : "{$targetDateStr} {$rawEnd}", $tz);

                $blackoutStart = Carbon::parse("{$targetDateStr} ".$rStart->format('H:i:s'), $tz);
                $blackoutEnd = Carbon::parse("{$targetDateStr} ".$rEnd->format('H:i:s'), $tz);
            } else {
                $blackoutStart = Carbon::parse("{$targetDateStr} {$availability->start_time}", $tz);
                $blackoutEnd = Carbon::parse("{$targetDateStr} {$availability->end_time}", $tz);
            }

            $bookedAppts = Appointment::where('teacher_id', $teacherId)
                ->whereIn('status', ['pending', 'accepted', 'confirmed'])
                ->where('end_at', '>', PlatformTime::now())
                ->where(function ($q) use ($blackoutStart, $blackoutEnd) {
                    $q->where(function ($sub) use ($blackoutStart, $blackoutEnd) {
                        $sub->where('start_at', '<', $blackoutEnd->copy()->utc())
                            ->where('end_at', '>', $blackoutStart->copy()->utc());
                    })->orWhere(function ($sub) use ($blackoutStart, $blackoutEnd) {
                        $sub->where('start_at', '<', $blackoutEnd->format('Y-m-d H:i:s'))
                            ->where('end_at', '>', $blackoutStart->format('Y-m-d H:i:s'));
                    });
                })
                ->get();

            $slotDur = $availability->slot_duration ?: 30;
            $isSingleSlot = ($deleteType === 'range') && ($blackoutEnd->diffInMinutes($blackoutStart) <= $slotDur);

            if ($bookedAppts->isNotEmpty()) {
                if ($isSingleSlot || ! $keepBooked) {
                    return back()->withErrors(['range' => __('availability.slot_has_booking')]);
                }

                $freeIntervals = $this->computeFreeIntervals($blackoutStart, $blackoutEnd, $bookedAppts);
                if (empty($freeIntervals)) {
                    return back()->with('info', __('availability.unbooked_removed_booked_preserved'));
                }

                foreach ($freeIntervals as $interval) {
                    TeacherAvailability::create([
                        'teacher_id' => $teacherId,
                        'type' => 'custom',
                        'start_at' => $interval['start']->format('Y-m-d H:i:s'),
                        'end_at' => $interval['end']->format('Y-m-d H:i:s'),
                        'slot_duration' => $slotDur,
                        'is_active' => false,
                    ]);
                }

                Cache::forget("teacher:{$teacherId}:slots:{$targetDateStr}");

                return back()->with('success', __('availability.unbooked_removed_booked_preserved'));
            }

            TeacherAvailability::create([
                'teacher_id' => $teacherId,
                'type' => 'custom',
                'start_at' => $blackoutStart->format('Y-m-d H:i:s'),
                'end_at' => $blackoutEnd->format('Y-m-d H:i:s'),
                'slot_duration' => $availability->slot_duration,
                'is_active' => false,
            ]);

            Cache::forget("teacher:{$teacherId}:slots:{$targetDateStr}");

            return back()->with('success', __('availability.removed_date_successfully'));
        }

        if ($deleteType === 'range') {
            $request->validate([
                'range_start' => ['required', 'string'],
                'range_end' => ['required', 'string'],
            ]);

            $rawStart = (string) $request->input('range_start');
            $rawEnd = (string) $request->input('range_end');

            if ($availability->type === 'custom' && $availability->start_at) {
                $datePrefix = PlatformTime::toLocal($availability->start_at)->format('Y-m-d');
                $rangeStart = str_contains($rawStart, ' ') || str_contains($rawStart, 'T')
                    ? PlatformTime::parseLocal($rawStart)
                    : PlatformTime::parseLocal("{$datePrefix} {$rawStart}");
                $rangeEnd = str_contains($rawEnd, ' ') || str_contains($rawEnd, 'T')
                    ? PlatformTime::parseLocal($rawEnd)
                    : PlatformTime::parseLocal("{$datePrefix} {$rawEnd}");
            } else {
                $rangeStart = PlatformTime::parseLocal($rawStart);
                $rangeEnd = PlatformTime::parseLocal($rawEnd);
            }

            if ($rangeEnd->lte($rangeStart)) {
                return back()->withErrors(['range' => __('availability.end_time_after_start')]);
            }

            if ($availability->type === 'custom') {
                $origStart = PlatformTime::toLocal($availability->start_at);
                $origEnd = PlatformTime::toLocal($availability->end_at);
                $slotDur = $availability->slot_duration ?: 30;

                $effectiveStart = $rangeStart->gt($origStart) ? $rangeStart : $origStart;
                $effectiveEnd = $rangeEnd->lt($origEnd) ? $rangeEnd : $origEnd;

                $bookedAppts = Appointment::where('teacher_id', $teacherId)
                    ->whereIn('status', ['pending', 'accepted', 'confirmed'])
                    ->where('end_at', '>', PlatformTime::now())
                    ->where('start_at', '<', PlatformTime::toUtc($effectiveEnd))
                    ->where('end_at', '>', PlatformTime::toUtc($effectiveStart))
                    ->get();

                $isSingleSlot = $effectiveEnd->diffInMinutes($effectiveStart) <= $slotDur;

                if ($bookedAppts->isNotEmpty()) {
                    if ($isSingleSlot || ! $keepBooked) {
                        return back()->withErrors(['range' => __('availability.slot_has_booking')]);
                    }

                    $availability->delete();
                    foreach ($bookedAppts as $appt) {
                        TeacherAvailability::create([
                            'teacher_id' => $teacherId,
                            'type' => 'custom',
                            'start_at' => $appt->start_at,
                            'end_at' => $appt->end_at,
                            'slot_duration' => $slotDur,
                            'is_active' => true,
                        ]);
                    }

                    $dateStr = $origStart->format('Y-m-d');
                    Cache::forget("teacher:{$teacherId}:slots:{$dateStr}");

                    return back()->with('success', __('availability.unbooked_removed_booked_preserved'));
                }

                if ($rangeStart->lte($origStart) && $rangeEnd->gte($origEnd)) {
                    $availability->delete();
                } elseif ($rangeStart->gt($origStart) && $rangeEnd->lt($origEnd)) {
                    $availability->update(['end_at' => $rangeStart->format('Y-m-d H:i:s')]);

                    TeacherAvailability::create([
                        'teacher_id' => $teacherId,
                        'type' => 'custom',
                        'start_at' => $rangeEnd->format('Y-m-d H:i:s'),
                        'end_at' => $origEnd->format('Y-m-d H:i:s'),
                        'slot_duration' => $availability->slot_duration,
                        'is_active' => $availability->is_active,
                    ]);
                } elseif ($rangeStart->lte($origStart) && $rangeEnd->gt($origStart) && $rangeEnd->lt($origEnd)) {
                    $availability->update(['start_at' => $rangeEnd->format('Y-m-d H:i:s')]);
                } elseif ($rangeStart->gt($origStart) && $rangeStart->lt($origEnd) && $rangeEnd->gte($origEnd)) {
                    $availability->update(['end_at' => $rangeStart->format('Y-m-d H:i:s')]);
                }
            } else {
                $dayOfWeek = $availability->day_of_week;
                $appointments = Appointment::where('teacher_id', $teacherId)
                    ->whereIn('status', ['pending', 'accepted', 'confirmed'])
                    ->where('start_at', '>=', Carbon::now($tz)->copy()->utc())
                    ->get();

                $startSecs = $rangeStart->hour * 3600 + $rangeStart->minute * 60 + $rangeStart->second;
                $endSecs = $rangeEnd->hour * 3600 + $rangeEnd->minute * 60 + $rangeEnd->second;

                $bookedAppts = $appointments->filter(function ($appt) use ($tz, $dayOfWeek, $startSecs, $endSecs) {
                    if (strtolower($appt->start_at->copy()->setTimezone($tz)->format('l')) === strtolower($dayOfWeek)) {
                        $apptOpen = $appt->start_at->copy()->setTimezone($tz)->hour * 3600 + $appt->start_at->copy()->setTimezone($tz)->minute * 60;
                        $apptClose = $appt->end_at->copy()->setTimezone($tz)->hour * 3600 + $appt->end_at->copy()->setTimezone($tz)->minute * 60;

                        return $apptOpen < $endSecs && $apptClose > $startSecs;
                    }

                    return false;
                });

                if ($bookedAppts->isNotEmpty()) {
                    if (! $keepBooked) {
                        return back()->withErrors(['range' => __('availability.cannot_delete_range_booked')]);
                    }

                    foreach ($bookedAppts as $fb) {
                        TeacherAvailability::create([
                            'teacher_id' => $teacherId,
                            'type' => 'custom',
                            'start_at' => $fb->start_at->copy()->setTimezone($tz)->format('Y-m-d H:i:s'),
                            'end_at' => $fb->end_at->copy()->setTimezone($tz)->format('Y-m-d H:i:s'),
                            'slot_duration' => $availability->slot_duration,
                            'is_active' => true,
                        ]);
                    }
                }

                $origStart = Carbon::parse($availability->start_time, $tz);
                $origEnd = Carbon::parse($availability->end_time, $tz);
                $reqStart = Carbon::parse($rangeStart->format('H:i:s'), $tz);
                $reqEnd = Carbon::parse($rangeEnd->format('H:i:s'), $tz);

                if ($reqStart->lte($origStart) && $reqEnd->gte($origEnd)) {
                    $availability->delete();
                } elseif ($reqStart->gt($origStart) && $reqEnd->lt($origEnd)) {
                    $availability->update(['end_time' => $reqStart->format('H:i:s')]);

                    TeacherAvailability::create([
                        'teacher_id' => $teacherId,
                        'type' => 'recurring',
                        'day_of_week' => $dayOfWeek,
                        'start_time' => $reqEnd->format('H:i:s'),
                        'end_time' => $origEnd->format('H:i:s'),
                        'slot_duration' => $availability->slot_duration,
                        'is_active' => $availability->is_active,
                    ]);
                } elseif ($reqStart->lte($origStart) && $reqEnd->gt($origStart) && $reqEnd->lt($origEnd)) {
                    $availability->update(['start_time' => $reqEnd->format('H:i:s')]);
                } elseif ($reqStart->gt($origStart) && $reqStart->lt($origEnd) && $reqEnd->gte($origEnd)) {
                    $availability->update(['end_time' => $reqStart->format('H:i:s')]);
                }
            }
        } else {
            // Deleting full block / availability record
            if ($availability->type === 'custom') {
                $origStart = PlatformTime::toLocal($availability->start_at);
                $origEnd = PlatformTime::toLocal($availability->end_at);
                $slotDur = $availability->slot_duration ?: 30;

                $bookedAppts = Appointment::where('teacher_id', $teacherId)
                    ->whereIn('status', ['pending', 'accepted', 'confirmed'])
                    ->where('end_at', '>', PlatformTime::now())
                    ->where('start_at', '<', $availability->end_at)
                    ->where('end_at', '>', $availability->start_at)
                    ->get();

                if ($bookedAppts->isNotEmpty()) {
                    if (! $keepBooked) {
                        return back()->withErrors(['range' => __('availability.cannot_delete_booked')]);
                    }

                    $availability->delete();
                    foreach ($bookedAppts as $appt) {
                        TeacherAvailability::create([
                            'teacher_id' => $teacherId,
                            'type' => 'custom',
                            'start_at' => $appt->start_at,
                            'end_at' => $appt->end_at,
                            'slot_duration' => $slotDur,
                            'is_active' => true,
                        ]);
                    }

                    $dateStr = $origStart->format('Y-m-d');
                    Cache::forget("teacher:{$teacherId}:slots:{$dateStr}");

                    return back()->with('success', __('availability.unbooked_removed_booked_preserved'));
                }

                $availability->delete();
            } else {
                $dayOfWeek = $availability->day_of_week;
                $appointments = Appointment::where('teacher_id', $teacherId)
                    ->whereIn('status', ['pending', 'accepted', 'confirmed'])
                    ->where('start_at', '>=', Carbon::now($tz)->copy()->utc())
                    ->get();

                $origStart = Carbon::parse($availability->start_time, $tz);
                $origEnd = Carbon::parse($availability->end_time, $tz);
                $startSecs = $origStart->hour * 3600 + $origStart->minute * 60 + $origStart->second;
                $endSecs = $origEnd->hour * 3600 + $origEnd->minute * 60 + $origEnd->second;

                $bookedAppts = $appointments->filter(function ($appt) use ($tz, $dayOfWeek, $startSecs, $endSecs) {
                    if (strtolower($appt->start_at->copy()->setTimezone($tz)->format('l')) === strtolower($dayOfWeek)) {
                        $apptOpen = $appt->start_at->copy()->setTimezone($tz)->hour * 3600 + $appt->start_at->copy()->setTimezone($tz)->minute * 60;
                        $apptClose = $appt->end_at->copy()->setTimezone($tz)->hour * 3600 + $appt->end_at->copy()->setTimezone($tz)->minute * 60;

                        return $apptOpen < $endSecs && $apptClose > $startSecs;
                    }

                    return false;
                });

                if ($bookedAppts->isNotEmpty()) {
                    if (! $keepBooked) {
                        return back()->withErrors(['range' => __('availability.cannot_delete_booked')]);
                    }

                    foreach ($bookedAppts as $fb) {
                        TeacherAvailability::create([
                            'teacher_id' => $teacherId,
                            'type' => 'custom',
                            'start_at' => $fb->start_at->copy()->setTimezone($tz)->format('Y-m-d H:i:s'),
                            'end_at' => $fb->end_at->copy()->setTimezone($tz)->format('Y-m-d H:i:s'),
                            'slot_duration' => $availability->slot_duration,
                            'is_active' => true,
                        ]);
                    }
                }

                $availability->delete();
            }
        }

        // Clear slot cache
        if ($availability->type === 'custom' && $availability->start_at) {
            $startDate = Carbon::parse($availability->start_at, $tz);
            $endDate = Carbon::parse($availability->end_at, $tz);
            $current = $startDate->copy()->subDay();
            $limit = $endDate->copy()->addDay();
            while ($current->lte($limit)) {
                $dateStr = $current->format('Y-m-d');
                Cache::forget("teacher:{$teacherId}:slots:{$dateStr}");
                $current->addDay();
            }
        } else {
            $dayOfWeek = $availability->day_of_week;
            if ($dayOfWeek) {
                $current = Carbon::now($tz);
                if (strtolower($current->format('l')) !== strtolower($dayOfWeek)) {
                    $current->next($dayOfWeek);
                }
                for ($i = 0; $i < 8; $i++) {
                    $dateStr = $current->format('Y-m-d');
                    Cache::forget("teacher:{$teacherId}:slots:{$dateStr}");
                    $current->addWeek();
                }
            }
        }

        return back()->with('success', __('availability.deleted_successfully'));
    }

    public function clear(Request $request)
    {
        $validated = $request->validate([
            'date' => ['nullable', 'date'],
            'dates' => ['nullable', 'array'],
            'dates.*' => ['date'],
            'days_of_week' => ['nullable', 'array'],
            'days_of_week.*' => ['string', 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday'],
            'scope' => ['nullable', 'string', 'in:date_only,all_weeks'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i'],
        ]);

        $teacherId = $request->user()->id;
        $tz = 'Asia/Tashkent';
        $scope = $validated['scope'] ?? 'date_only';
        $keepBooked = $request->boolean('keep_booked', false);

        $dates = ! empty($validated['dates'])
            ? $validated['dates']
            : (! empty($validated['date']) ? [$validated['date']] : []);

        $daysOfWeek = ! empty($validated['days_of_week']) ? $validated['days_of_week'] : [];

        // 1. Process specific calendar dates
        foreach ($dates as $dateStr) {
            $dayCarbon = Carbon::parse($dateStr, $tz);
            $dayName = strtolower($dayCarbon->format('l'));
            $startOfDay = $dayCarbon->copy()->startOfDay();
            $endOfDay = $dayCarbon->copy()->endOfDay();

            $windowStart = ! empty($validated['start_time'])
                ? Carbon::parse("{$dateStr} {$validated['start_time']}", $tz)
                : $startOfDay;
            $windowEnd = ! empty($validated['end_time'])
                ? Carbon::parse("{$dateStr} {$validated['end_time']}", $tz)
                : $endOfDay;

            $bookedAppts = Appointment::where('teacher_id', $teacherId)
                ->whereIn('status', ['pending', 'accepted', 'confirmed'])
                ->where('end_at', '>', PlatformTime::now())
                ->where('start_at', '<', PlatformTime::toUtc($windowEnd))
                ->where('end_at', '>', PlatformTime::toUtc($windowStart))
                ->get();

            if ($bookedAppts->isNotEmpty() && ! $keepBooked) {
                return back()->withErrors(['range' => __('availability.cannot_clear_booked', ['date' => $dateStr])]);
            }

            // Remove or trim active custom availabilities on that day
            $dayUtc = PlatformTime::localDayRangeInUtc($dateStr);
            $customAvails = TeacherAvailability::where('teacher_id', $teacherId)
                ->where('type', 'custom')
                ->where('is_active', true)
                ->where('start_at', '<=', $dayUtc['end'])
                ->where('end_at', '>=', $dayUtc['start'])
                ->get();

            if ($bookedAppts->isNotEmpty()) {
                foreach ($customAvails as $custom) {
                    $origStart = PlatformTime::toLocal($custom->start_at);
                    $origEnd = PlatformTime::toLocal($custom->end_at);
                    $custom->delete();

                    // Part before window
                    if ($origStart->lt($windowStart)) {
                        TeacherAvailability::create([
                            'teacher_id' => $teacherId,
                            'type' => 'custom',
                            'start_at' => $origStart,
                            'end_at' => ($origEnd->lt($windowStart) ? $origEnd : $windowStart),
                            'slot_duration' => $custom->slot_duration,
                            'is_active' => true,
                        ]);
                    }

                    // Part after window
                    if ($origEnd->gt($windowEnd)) {
                        TeacherAvailability::create([
                            'teacher_id' => $teacherId,
                            'type' => 'custom',
                            'start_at' => ($origStart->gt($windowEnd) ? $origStart : $windowEnd),
                            'end_at' => $origEnd,
                            'slot_duration' => $custom->slot_duration,
                            'is_active' => true,
                        ]);
                    }

                    // Re-create custom availability covering each booked appointment
                    $cBookings = $bookedAppts->filter(fn ($b) => PlatformTime::toLocal($b->start_at)->lt($origEnd) && PlatformTime::toLocal($b->end_at)->gt($origStart));
                    foreach ($cBookings as $bAppt) {
                        TeacherAvailability::create([
                            'teacher_id' => $teacherId,
                            'type' => 'custom',
                            'start_at' => $bAppt->start_at,
                            'end_at' => $bAppt->end_at,
                            'slot_duration' => $custom->slot_duration,
                            'is_active' => true,
                        ]);
                    }
                }
            } else {
                foreach ($customAvails as $custom) {
                    if (! empty($validated['start_time']) && ! empty($validated['end_time'])) {
                        $rangeStart = Carbon::parse("{$dateStr} {$validated['start_time']}", $tz);
                        $rangeEnd = Carbon::parse("{$dateStr} {$validated['end_time']}", $tz);
                        $origStart = PlatformTime::toLocal($custom->start_at);
                        $origEnd = PlatformTime::toLocal($custom->end_at);

                        if ($rangeStart->lte($origStart) && $rangeEnd->gte($origEnd)) {
                            $custom->delete();
                        } elseif ($rangeStart->gt($origStart) && $rangeEnd->lt($origEnd)) {
                            $custom->update(['end_at' => $rangeStart]);
                            TeacherAvailability::create([
                                'teacher_id' => $teacherId,
                                'type' => 'custom',
                                'start_at' => $rangeEnd,
                                'end_at' => $origEnd,
                                'slot_duration' => $custom->slot_duration,
                                'is_active' => true,
                            ]);
                        } elseif ($rangeStart->lte($origStart) && $rangeEnd->gt($origStart) && $rangeEnd->lt($origEnd)) {
                            $custom->update(['start_at' => $rangeEnd]);
                        } elseif ($rangeStart->gt($origStart) && $rangeStart->lt($origEnd) && $rangeEnd->gte($origEnd)) {
                            $custom->update(['end_at' => $rangeStart]);
                        }
                    } else {
                        $custom->delete();
                    }
                }
            }

            // Recurring availability handling for this day
            $recurringAvails = TeacherAvailability::where('teacher_id', $teacherId)
                ->where('type', 'recurring')
                ->where('day_of_week', $dayName)
                ->get();

            foreach ($recurringAvails as $rec) {
                if ($scope === 'all_weeks') {
                    $futureBookings = Appointment::where('teacher_id', $teacherId)
                        ->whereIn('status', ['pending', 'accepted', 'confirmed'])
                        ->where('start_at', '>=', Carbon::now($tz)->copy()->utc())
                        ->get()
                        ->filter(fn ($app) => strtolower($app->start_at->copy()->setTimezone($tz)->format('l')) === $dayName);

                    foreach ($futureBookings as $fb) {
                        TeacherAvailability::create([
                            'teacher_id' => $teacherId,
                            'type' => 'custom',
                            'start_at' => $fb->start_at->copy()->setTimezone($tz)->format('Y-m-d H:i:s'),
                            'end_at' => $fb->end_at->copy()->setTimezone($tz)->format('Y-m-d H:i:s'),
                            'slot_duration' => $rec->slot_duration,
                            'is_active' => true,
                        ]);
                    }

                    $rec->delete();
                    $curr = Carbon::now($tz);
                    if (strtolower($curr->format('l')) !== $dayName) {
                        $curr->next($dayName);
                    }
                    for ($i = 0; $i < 8; $i++) {
                        Cache::forget("teacher:{$teacherId}:slots:".$curr->format('Y-m-d'));
                        $curr->addWeek();
                    }
                } else {
                    $bStart = ! empty($validated['start_time'])
                        ? Carbon::parse("{$dateStr} {$validated['start_time']}", $tz)
                        : Carbon::parse("{$dateStr} {$rec->start_time}", $tz);
                    $bEnd = ! empty($validated['end_time'])
                        ? Carbon::parse("{$dateStr} {$validated['end_time']}", $tz)
                        : Carbon::parse("{$dateStr} {$rec->end_time}", $tz);

                    $freeIntervals = $this->computeFreeIntervals($bStart, $bEnd, $bookedAppts);
                    foreach ($freeIntervals as $interval) {
                        TeacherAvailability::create([
                            'teacher_id' => $teacherId,
                            'type' => 'custom',
                            'start_at' => $interval['start']->format('Y-m-d H:i:s'),
                            'end_at' => $interval['end']->format('Y-m-d H:i:s'),
                            'slot_duration' => $rec->slot_duration,
                            'is_active' => false,
                        ]);
                    }
                }
            }

            Cache::forget("teacher:{$teacherId}:slots:{$dateStr}");
        }

        // 2. Process recurring days of week (when directly selected with all_weeks)
        if ($scope === 'all_weeks' && ! empty($daysOfWeek)) {
            foreach ($daysOfWeek as $dow) {
                $dayBookedAppts = Appointment::where('teacher_id', $teacherId)
                    ->whereIn('status', ['pending', 'accepted', 'confirmed'])
                    ->where('start_at', '>=', Carbon::now($tz)->copy()->utc())
                    ->get()
                    ->filter(fn ($app) => strtolower($app->start_at->copy()->setTimezone($tz)->format('l')) === strtolower($dow));

                if ($dayBookedAppts->isNotEmpty()) {
                    if (! $keepBooked) {
                        return back()->withErrors(['range' => __('availability.cannot_clear_booked', ['date' => __('availability.days.'.strtolower($dow))])]);
                    }

                    foreach ($dayBookedAppts as $fb) {
                        TeacherAvailability::create([
                            'teacher_id' => $teacherId,
                            'type' => 'custom',
                            'start_at' => $fb->start_at->copy()->setTimezone($tz)->format('Y-m-d H:i:s'),
                            'end_at' => $fb->end_at->copy()->setTimezone($tz)->format('Y-m-d H:i:s'),
                            'slot_duration' => 30,
                            'is_active' => true,
                        ]);
                    }
                }

                TeacherAvailability::where('teacher_id', $teacherId)
                    ->where('type', 'recurring')
                    ->where('day_of_week', strtolower($dow))
                    ->delete();

                $curr = Carbon::now($tz);
                if (strtolower($curr->format('l')) !== strtolower($dow)) {
                    $curr->next($dow);
                }
                for ($i = 0; $i < 8; $i++) {
                    Cache::forget("teacher:{$teacherId}:slots:".$curr->format('Y-m-d'));
                    $curr->addWeek();
                }
            }
        }

        return back()->with('success', __('availability.cleared_successfully'));
    }

    /**
     * Compute unoccupied time intervals within [windowStart, windowEnd] excluding appointments.
     *
     * @return array<int, array{start: Carbon, end: Carbon}>
     */
    private function computeFreeIntervals(Carbon $windowStart, Carbon $windowEnd, $appointments): array
    {
        $sortedAppts = collect($appointments)
            ->filter(fn ($a) => in_array($a->status, ['pending', 'accepted', 'confirmed']))
            ->map(function ($a) {
                return [
                    'start' => PlatformTime::toLocal($a->start_at),
                    'end' => PlatformTime::toLocal($a->end_at),
                ];
            })
            ->filter(fn ($a) => $a['start']->lt($windowEnd) && $a['end']->gt($windowStart))
            ->sortBy(fn ($a) => $a['start']->timestamp)
            ->values();

        if ($sortedAppts->isEmpty()) {
            return [['start' => $windowStart->copy(), 'end' => $windowEnd->copy()]];
        }

        $freeIntervals = [];
        $cursor = $windowStart->copy();

        foreach ($sortedAppts as $appt) {
            $appStart = $appt['start']->copy();
            $appEnd = $appt['end']->copy();

            if ($appStart->gt($cursor)) {
                $segmentEnd = $appStart->lt($windowEnd) ? $appStart : $windowEnd->copy();
                if ($segmentEnd->gt($cursor)) {
                    $freeIntervals[] = [
                        'start' => $cursor->copy(),
                        'end' => $segmentEnd->copy(),
                    ];
                }
            }

            if ($appEnd->gt($cursor)) {
                $cursor = $appEnd->copy();
            }

            if ($cursor->gte($windowEnd)) {
                break;
            }
        }

        if ($cursor->lt($windowEnd)) {
            $freeIntervals[] = [
                'start' => $cursor->copy(),
                'end' => $windowEnd->copy(),
            ];
        }

        return $freeIntervals;
    }

    /**
     * Resolve any inactive blackouts that overlap with the new active availability window.
     */
    protected function resolveOverlappingBlackouts(string $teacherId, Carbon $newStartUtc, Carbon $newEndUtc): void
    {
        $overlappingBlackouts = TeacherAvailability::where('teacher_id', $teacherId)
            ->where('type', 'custom')
            ->where('is_active', false)
            ->where('start_at', '<', $newEndUtc->format('Y-m-d H:i:s'))
            ->where('end_at', '>', $newStartUtc->format('Y-m-d H:i:s'))
            ->get();

        foreach ($overlappingBlackouts as $blackout) {
            $bStart = $blackout->start_at->copy()->utc();
            $bEnd = $blackout->end_at->copy()->utc();

            if ($bStart->gte($newStartUtc) && $bEnd->lte($newEndUtc)) {
                // Case 1: Blackout is completely covered by new availability -> delete blackout
                $blackout->delete();
            } elseif ($bStart->lt($newStartUtc) && $bEnd->gt($newEndUtc)) {
                // Case 2: New availability is in the middle of blackout -> split blackout into two
                $blackout->update([
                    'end_at' => $newStartUtc,
                ]);

                TeacherAvailability::create([
                    'teacher_id' => $teacherId,
                    'type' => 'custom',
                    'start_at' => $newEndUtc,
                    'end_at' => $bEnd,
                    'slot_duration' => $blackout->slot_duration,
                    'is_active' => false,
                ]);
            } elseif ($bStart->lt($newStartUtc) && $bEnd->lte($newEndUtc)) {
                // Case 3: Blackout starts before, ends inside -> trim blackout end
                $blackout->update([
                    'end_at' => $newStartUtc,
                ]);
            } elseif ($bStart->gte($newStartUtc) && $bEnd->gt($newEndUtc)) {
                // Case 4: Blackout starts inside, ends after -> trim blackout start
                $blackout->update([
                    'start_at' => $newEndUtc,
                ]);
            }
        }
    }

    /**
     * Store active custom availability while resolving overlapping blackouts and deduplicating active records.
     */
    protected function storeOrMergeCustomAvailability(
        string $teacherId,
        Carbon $newStartUtc,
        Carbon $newEndUtc,
        int $slotDuration
    ): TeacherAvailability {
        $this->resolveOverlappingBlackouts($teacherId, $newStartUtc, $newEndUtc);

        $overlappingActives = TeacherAvailability::where('teacher_id', $teacherId)
            ->where('type', 'custom')
            ->where('is_active', true)
            ->where('start_at', '<=', $newEndUtc->format('Y-m-d H:i:s'))
            ->where('end_at', '>=', $newStartUtc->format('Y-m-d H:i:s'))
            ->orderBy('start_at', 'asc')
            ->get();

        if ($overlappingActives->isEmpty()) {
            return TeacherAvailability::create([
                'teacher_id' => $teacherId,
                'type' => 'custom',
                'start_at' => $newStartUtc,
                'end_at' => $newEndUtc,
                'slot_duration' => $slotDuration,
                'is_active' => true,
            ]);
        }

        $mergedStartUtc = $newStartUtc->copy();
        $mergedEndUtc = $newEndUtc->copy();

        foreach ($overlappingActives as $active) {
            $actStart = $active->start_at->copy()->utc();
            $actEnd = $active->end_at->copy()->utc();

            if ($actStart->lt($mergedStartUtc)) {
                $mergedStartUtc = $actStart;
            }
            if ($actEnd->gt($mergedEndUtc)) {
                $mergedEndUtc = $actEnd;
            }
        }

        $primary = $overlappingActives->first();
        $primary->update([
            'start_at' => $mergedStartUtc,
            'end_at' => $mergedEndUtc,
            'slot_duration' => $slotDuration,
        ]);

        foreach ($overlappingActives->slice(1) as $extra) {
            $extra->delete();
        }

        return $primary;
    }
}
