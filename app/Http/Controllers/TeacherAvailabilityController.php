<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\TeacherAvailability;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class TeacherAvailabilityController extends Controller
{
    public function index(Request $request)
    {
        // Delete expired custom availabilities from the DB
        TeacherAvailability::where('teacher_id', $request->user()->id)
            ->where('type', 'custom')
            ->where('end_at', '<', Carbon::now())
            ->delete();

        $availabilities = TeacherAvailability::where('teacher_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $appointments = Appointment::where('teacher_id', $request->user()->id)
            ->with('pupil:id,full_name,avatar')
            ->orderBy('start_at', 'asc')
            ->get();

        return Inertia::render('teacher/availability', [
            'availabilities' => $availabilities,
            'appointments' => $appointments,
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
                        $fail('The end time must be a time after start time.');
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
                return back()->withErrors(['day_of_week' => 'Please select at least one day of the week.']);
            }

            if (empty($validated['start_time']) || empty($validated['end_time'])) {
                return back()->withErrors(['start_time' => 'Start time and end time are required.']);
            }

            foreach ($days as $day) {
                TeacherAvailability::updateOrCreate(
                    [
                        'teacher_id' => $teacherId,
                        'type' => 'recurring',
                        'day_of_week' => $day,
                        'start_time' => $validated['start_time'],
                        'end_time' => $validated['end_time'],
                    ],
                    [
                        'slot_duration' => $slotDuration,
                        'is_active' => true,
                    ]
                );

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

            return back()->with('success', 'Availability added successfully.');
        }

        // Custom Availability: Date Range
        if (! empty($validated['start_date']) && ! empty($validated['end_date'])) {
            $startDate = Carbon::parse($validated['start_date'], $tz)->startOfDay();
            $endDate = Carbon::parse($validated['end_date'], $tz)->startOfDay();
            $startTimeStr = $validated['start_time'] ?? '09:00';
            $endTimeStr = $validated['end_time'] ?? '17:00';

            $createdCount = 0;
            $cursor = $startDate->copy();

            while ($cursor->lte($endDate)) {
                $dayStr = $cursor->format('Y-m-d');
                $dayStart = Carbon::parse("{$dayStr} {$startTimeStr}", $tz);
                $dayEnd = Carbon::parse("{$dayStr} {$endTimeStr}", $tz);

                // Skip if entire window on that day has passed
                if ($dayEnd->lte($nowTz)) {
                    $cursor->addDay();

                    continue;
                }

                // If start time has already passed today, clamp start to current time forward
                if ($dayStart->lt($nowTz)) {
                    $minute = $nowTz->minute;
                    $step = ($slotDuration > 0 && $slotDuration <= 60) ? $slotDuration : 15;
                    $roundedMinute = ceil($minute / $step) * $step;
                    $effectiveStart = $nowTz->copy()->minute(0)->second(0)->addMinutes($roundedMinute);

                    if ($effectiveStart->gte($dayEnd)) {
                        $cursor->addDay();

                        continue;
                    }
                    $dayStart = $effectiveStart;
                }

                TeacherAvailability::create([
                    'teacher_id' => $teacherId,
                    'type' => 'custom',
                    'start_at' => $dayStart->format('Y-m-d H:i:s'),
                    'end_at' => $dayEnd->format('Y-m-d H:i:s'),
                    'slot_duration' => $slotDuration,
                    'is_active' => true,
                ]);

                Cache::forget("teacher:{$teacherId}:slots:{$dayStr}");
                $createdCount++;
                $cursor->addDay();
            }

            if ($createdCount === 0) {
                return back()->withErrors(['start_date' => 'The selected date and time range has already passed.']);
            }

            return back()->with('success', 'Availability added successfully.');
        }

        // Custom Availability: Single Specific Timestamp Range
        if (empty($validated['start_at']) || empty($validated['end_at'])) {
            return back()->withErrors(['start_at' => 'Start date and end date are required.']);
        }

        $startAt = Carbon::parse($validated['start_at'], $tz);
        $endAt = Carbon::parse($validated['end_at'], $tz);

        if ($endAt->lte($nowTz)) {
            return back()->withErrors(['start_at' => 'Cannot create availability for time that has already passed.']);
        }

        if ($startAt->lt($nowTz)) {
            $minute = $nowTz->minute;
            $step = ($slotDuration > 0 && $slotDuration <= 60) ? $slotDuration : 15;
            $roundedMinute = ceil($minute / $step) * $step;
            $effectiveStart = $nowTz->copy()->minute(0)->second(0)->addMinutes($roundedMinute);

            if ($effectiveStart->gte($endAt)) {
                return back()->withErrors(['start_at' => 'The remaining time in this slot has already passed.']);
            }
            $startAt = $effectiveStart;
        }

        TeacherAvailability::create([
            'teacher_id' => $teacherId,
            'type' => 'custom',
            'start_at' => $startAt->format('Y-m-d H:i:s'),
            'end_at' => $endAt->format('Y-m-d H:i:s'),
            'slot_duration' => $slotDuration,
            'is_active' => true,
        ]);

        $current = $startAt->copy()->subDay();
        $limit = $endAt->copy()->addDay();
        while ($current->lte($limit)) {
            $dateStr = $current->format('Y-m-d');
            Cache::forget("teacher:{$teacherId}:slots:{$dateStr}");
            $current->addDay();
        }

        return back()->with('success', 'Availability added successfully.');
    }

    public function update(Request $request, string $id)
    {
        $availability = TeacherAvailability::where('teacher_id', $request->user()->id)->find($id);

        if (! $availability) {
            return back()->withErrors(['range' => 'Availability record not found.']);
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
                        $fail('The end time must be a time after start time.');
                    }
                },
            ],
            'start_at' => ['required_if:type,custom', 'nullable', 'date'],
            'end_at' => ['required_if:type,custom', 'nullable', 'date', 'after:start_at'],
            'slot_duration' => ['nullable', 'integer', 'min:0', 'max:1440'],
        ]);

        $teacherId = $request->user()->id;

        // Check if there are booked appointments in this availability before modifying
        if ($availability->type === 'custom' && $availability->start_at && $availability->end_at) {
            $hasBookings = Appointment::where('teacher_id', $teacherId)
                ->whereIn('status', ['pending', 'confirmed'])
                ->where(function ($query) use ($availability) {
                    $query->where('start_at', '<', $availability->end_at)
                        ->where('end_at', '>', $availability->start_at);
                })
                ->exists();

            if ($hasBookings) {
                return back()->withErrors(['range' => 'Cannot update this availability because it has booked appointments.']);
            }
        } elseif ($availability->type === 'recurring' && $availability->day_of_week) {
            $dayOfWeek = $availability->day_of_week;
            $appointments = Appointment::where('teacher_id', $teacherId)
                ->whereIn('status', ['pending', 'confirmed'])
                ->where('start_at', '>=', Carbon::now())
                ->get();

            $origStart = Carbon::parse($availability->start_time);
            $origEnd = Carbon::parse($availability->end_time);
            $startSecs = $origStart->hour * 3600 + $origStart->minute * 60 + $origStart->second;
            $endSecs = $origEnd->hour * 3600 + $origEnd->minute * 60 + $origEnd->second;

            $hasBookings = false;
            foreach ($appointments as $appt) {
                if (strtolower($appt->start_at->format('l')) === strtolower($dayOfWeek)) {
                    $apptOpen = $appt->start_at->hour * 3600 + $appt->start_at->minute * 60 + $appt->start_at->second;
                    $apptClose = $appt->end_at->hour * 3600 + $appt->end_at->minute * 60 + $appt->end_at->second;
                    if ($apptOpen < $endSecs && $apptClose > $startSecs) {
                        $hasBookings = true;
                        break;
                    }
                }
            }

            if ($hasBookings) {
                return back()->withErrors(['range' => 'Cannot update this availability because it has booked appointments.']);
            }
        }

        $availability->update([
            'type' => $validated['type'],
            'day_of_week' => $validated['type'] === 'recurring' ? $validated['day_of_week'] : null,
            'start_time' => $validated['type'] === 'recurring' ? $validated['start_time'] : null,
            'end_time' => $validated['type'] === 'recurring' ? $validated['end_time'] : null,
            'start_at' => $validated['type'] === 'custom' ? Carbon::parse($validated['start_at']) : null,
            'end_at' => $validated['type'] === 'custom' ? Carbon::parse($validated['end_at']) : null,
            'slot_duration' => $validated['slot_duration'],
        ]);

        // Clear slot cache
        if ($validated['type'] === 'custom' && ! empty($validated['start_at'])) {
            $startDate = Carbon::parse($validated['start_at']);
            $endDate = Carbon::parse($validated['end_at']);
            $current = $startDate->copy()->subDay();
            $limit = $endDate->copy()->addDay();
            while ($current->lte($limit)) {
                $dateStr = $current->format('Y-m-d');
                Cache::forget("teacher:{$teacherId}:slots:{$dateStr}");
                $current->addDay();
            }
        } elseif ($validated['type'] === 'recurring' && ! empty($validated['day_of_week'])) {
            $dayOfWeek = $validated['day_of_week'];
            $current = Carbon::now();
            if (strtolower($current->format('l')) !== strtolower($dayOfWeek)) {
                $current->next($dayOfWeek);
            }
            for ($i = 0; $i < 8; $i++) {
                $dateStr = $current->format('Y-m-d');
                Cache::forget("teacher:{$teacherId}:slots:{$dateStr}");
                $current->addWeek();
            }
        }

        return back()->with('success', 'Availability updated successfully.');
    }

    public function destroy(Request $request, string $id)
    {
        $teacherId = $request->user()->id;
        $availability = TeacherAvailability::where('teacher_id', $teacherId)->find($id);

        if (! $availability) {
            return back()->withErrors(['range' => 'Availability record not found or already deleted.']);
        }

        $deleteType = $request->input('delete_type', 'all');
        $scope = $request->input('scope', 'all_weeks');
        $targetDateStr = $request->input('date');
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

            $hasBookings = Appointment::where('teacher_id', $teacherId)
                ->whereIn('status', ['pending', 'accepted', 'confirmed'])
                ->where('start_at', '<', $blackoutEnd)
                ->where('end_at', '>', $blackoutStart)
                ->exists();

            if ($hasBookings) {
                return back()->withErrors(['range' => 'Cannot delete this time because it has booked appointments.']);
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

            return back()->with('success', 'Availability removed for this date successfully.');
        }

        if ($deleteType === 'range') {
            $request->validate([
                'range_start' => ['required', 'string'],
                'range_end' => ['required', 'string'],
            ]);

            $rawStart = (string) $request->input('range_start');
            $rawEnd = (string) $request->input('range_end');

            if ($availability->type === 'custom' && $availability->start_at) {
                $datePrefix = $availability->start_at->format('Y-m-d');
                $rangeStart = str_contains($rawStart, ' ') || str_contains($rawStart, 'T')
                    ? Carbon::parse(Carbon::parse($rawStart)->format('Y-m-d H:i:s'), $tz)
                    : Carbon::parse("{$datePrefix} {$rawStart}", $tz);
                $rangeEnd = str_contains($rawEnd, ' ') || str_contains($rawEnd, 'T')
                    ? Carbon::parse(Carbon::parse($rawEnd)->format('Y-m-d H:i:s'), $tz)
                    : Carbon::parse("{$datePrefix} {$rawEnd}", $tz);
            } else {
                $rangeStart = Carbon::parse($rawStart, $tz);
                $rangeEnd = Carbon::parse($rawEnd, $tz);
            }

            if ($rangeEnd->lte($rangeStart)) {
                return back()->withErrors(['range' => 'End time must be after start time.']);
            }

            if ($availability->type === 'custom') {
                $hasBookings = Appointment::where('teacher_id', $teacherId)
                    ->whereIn('status', ['pending', 'accepted', 'confirmed'])
                    ->where(function ($query) use ($rangeStart, $rangeEnd) {
                        $query->where('start_at', '<', $rangeEnd->format('Y-m-d H:i:s'))
                            ->where('end_at', '>', $rangeStart->format('Y-m-d H:i:s'));
                    })
                    ->exists();

                if ($hasBookings) {
                    return back()->withErrors(['range' => 'Cannot delete this range because it has booked appointments.']);
                }

                $origStart = Carbon::parse($availability->start_at->format('Y-m-d H:i:s'), $tz);
                $origEnd = Carbon::parse($availability->end_at->format('Y-m-d H:i:s'), $tz);

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
                    ->where('start_at', '>=', Carbon::now($tz))
                    ->get();

                $startSecs = $rangeStart->hour * 3600 + $rangeStart->minute * 60 + $rangeStart->second;
                $endSecs = $rangeEnd->hour * 3600 + $rangeEnd->minute * 60 + $rangeEnd->second;

                $hasBookings = false;
                foreach ($appointments as $appt) {
                    if (strtolower($appt->start_at->setTimezone($tz)->format('l')) === strtolower($dayOfWeek)) {
                        $apptOpen = $appt->start_at->hour * 3600 + $appt->start_at->minute * 60 + $appt->start_at->second;
                        $apptClose = $appt->end_at->hour * 3600 + $appt->end_at->minute * 60 + $appt->end_at->second;
                        if ($apptOpen < $endSecs && $apptClose > $startSecs) {
                            $hasBookings = true;
                            break;
                        }
                    }
                }

                if ($hasBookings) {
                    return back()->withErrors(['range' => 'Cannot delete this range because it has booked appointments.']);
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
            if ($availability->type === 'custom') {
                $hasBookings = Appointment::where('teacher_id', $teacherId)
                    ->whereIn('status', ['pending', 'accepted', 'confirmed'])
                    ->where(function ($query) use ($availability) {
                        $query->where('start_at', '<', $availability->end_at)
                            ->where('end_at', '>', $availability->start_at);
                    })
                    ->exists();

                if ($hasBookings) {
                    return back()->withErrors(['range' => 'Cannot delete this availability because it has booked appointments.']);
                }
            } else {
                $dayOfWeek = $availability->day_of_week;
                $appointments = Appointment::where('teacher_id', $teacherId)
                    ->whereIn('status', ['pending', 'accepted', 'confirmed'])
                    ->where('start_at', '>=', Carbon::now($tz))
                    ->get();

                $origStart = Carbon::parse($availability->start_time, $tz);
                $origEnd = Carbon::parse($availability->end_time, $tz);
                $startSecs = $origStart->hour * 3600 + $origStart->minute * 60 + $origStart->second;
                $endSecs = $origEnd->hour * 3600 + $origEnd->minute * 60 + $origEnd->second;

                $hasBookings = false;
                foreach ($appointments as $appt) {
                    if (strtolower($appt->start_at->setTimezone($tz)->format('l')) === strtolower($dayOfWeek)) {
                        $apptOpen = $appt->start_at->hour * 3600 + $appt->start_at->minute * 60 + $appt->start_at->second;
                        $apptClose = $appt->end_at->hour * 3600 + $appt->end_at->minute * 60 + $appt->end_at->second;
                        if ($apptOpen < $endSecs && $apptClose > $startSecs) {
                            $hasBookings = true;
                            break;
                        }
                    }
                }

                if ($hasBookings) {
                    return back()->withErrors(['range' => 'Cannot delete this availability because it has booked appointments.']);
                }
            }

            $availability->delete();
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

        return back()->with('success', 'Availability deleted successfully.');
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

            // Check if there are booked appointments on that day
            $appQuery = Appointment::where('teacher_id', $teacherId)
                ->whereIn('status', ['pending', 'accepted', 'confirmed'])
                ->where('start_at', '<', $endOfDay->format('Y-m-d H:i:s'))
                ->where('end_at', '>', $startOfDay->format('Y-m-d H:i:s'));

            if (! empty($validated['start_time']) && ! empty($validated['end_time'])) {
                $rangeStart = Carbon::parse("{$dateStr} {$validated['start_time']}", $tz);
                $rangeEnd = Carbon::parse("{$dateStr} {$validated['end_time']}", $tz);
                $appQuery->where('start_at', '<', $rangeEnd->format('Y-m-d H:i:s'))
                    ->where('end_at', '>', $rangeStart->format('Y-m-d H:i:s'));
            }

            if ($appQuery->exists()) {
                return back()->withErrors(['range' => "Cannot clear {$dateStr} because it has booked appointments."]);
            }

            // Remove or trim active custom availabilities on that day
            $customAvails = TeacherAvailability::where('teacher_id', $teacherId)
                ->where('type', 'custom')
                ->where('is_active', true)
                ->where('start_at', '<=', $endOfDay->format('Y-m-d H:i:s'))
                ->where('end_at', '>=', $startOfDay->format('Y-m-d H:i:s'))
                ->get();

            foreach ($customAvails as $custom) {
                if (! empty($validated['start_time']) && ! empty($validated['end_time'])) {
                    $rangeStart = Carbon::parse("{$dateStr} {$validated['start_time']}", $tz);
                    $rangeEnd = Carbon::parse("{$dateStr} {$validated['end_time']}", $tz);
                    $origStart = Carbon::parse($custom->start_at->format('Y-m-d H:i:s'), $tz);
                    $origEnd = Carbon::parse($custom->end_at->format('Y-m-d H:i:s'), $tz);

                    if ($rangeStart->lte($origStart) && $rangeEnd->gte($origEnd)) {
                        $custom->delete();
                    } elseif ($rangeStart->gt($origStart) && $rangeEnd->lt($origEnd)) {
                        $custom->update(['end_at' => $rangeStart->format('Y-m-d H:i:s')]);
                        TeacherAvailability::create([
                            'teacher_id' => $teacherId,
                            'type' => 'custom',
                            'start_at' => $rangeEnd->format('Y-m-d H:i:s'),
                            'end_at' => $origEnd->format('Y-m-d H:i:s'),
                            'slot_duration' => $custom->slot_duration,
                            'is_active' => true,
                        ]);
                    } elseif ($rangeStart->lte($origStart) && $rangeEnd->gt($origStart) && $rangeEnd->lt($origEnd)) {
                        $custom->update(['start_at' => $rangeEnd->format('Y-m-d H:i:s')]);
                    } elseif ($rangeStart->gt($origStart) && $rangeStart->lt($origEnd) && $rangeEnd->gte($origEnd)) {
                        $custom->update(['end_at' => $rangeStart->format('Y-m-d H:i:s')]);
                    }
                } else {
                    $custom->delete();
                }
            }

            // Recurring availability handling for this day
            $recurringAvails = TeacherAvailability::where('teacher_id', $teacherId)
                ->where('type', 'recurring')
                ->where('day_of_week', $dayName)
                ->get();

            foreach ($recurringAvails as $rec) {
                if ($scope === 'all_weeks') {
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

                    TeacherAvailability::create([
                        'teacher_id' => $teacherId,
                        'type' => 'custom',
                        'start_at' => $bStart->format('Y-m-d H:i:s'),
                        'end_at' => $bEnd->format('Y-m-d H:i:s'),
                        'slot_duration' => $rec->slot_duration,
                        'is_active' => false,
                    ]);
                }
            }

            Cache::forget("teacher:{$teacherId}:slots:{$dateStr}");
        }

        // 2. Process recurring days of week (when directly selected with all_weeks)
        if ($scope === 'all_weeks' && ! empty($daysOfWeek)) {
            foreach ($daysOfWeek as $dow) {
                $hasBookings = Appointment::where('teacher_id', $teacherId)
                    ->whereIn('status', ['pending', 'accepted', 'confirmed'])
                    ->where('start_at', '>=', Carbon::now($tz))
                    ->get()
                    ->contains(fn ($app) => strtolower($app->start_at->setTimezone($tz)->format('l')) === strtolower($dow));

                if ($hasBookings) {
                    return back()->withErrors(['range' => "Cannot clear {$dow} because it has booked appointments in upcoming weeks."]);
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

        return back()->with('success', 'Availability cleared successfully.');
    }
}
