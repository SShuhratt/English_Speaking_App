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
            // Custom fields
            'start_at' => ['required_if:type,custom', 'nullable', 'date'],
            'end_at' => ['required_if:type,custom', 'nullable', 'date', 'after:start_at'],
            // Shared fields
            'slot_duration' => ['nullable', 'integer', 'min:0', 'max:1440'],
        ]);

        $availability = TeacherAvailability::create([
            'teacher_id' => $request->user()->id,
            'type' => $validated['type'],
            'day_of_week' => $validated['type'] === 'recurring' ? $validated['day_of_week'] : null,
            'start_time' => $validated['type'] === 'recurring' ? $validated['start_time'] : null,
            'end_time' => $validated['type'] === 'recurring' ? $validated['end_time'] : null,
            'start_at' => $validated['type'] === 'custom' ? Carbon::parse($validated['start_at']) : null,
            'end_at' => $validated['type'] === 'custom' ? Carbon::parse($validated['end_at']) : null,
            'slot_duration' => (isset($validated['slot_duration']) && (int) $validated['slot_duration'] > 0) ? (int) $validated['slot_duration'] : 30,
            'is_active' => true,
        ]);

        // Clear the cache for the teacher's slots
        $teacherId = $request->user()->id;
        if ($validated['type'] === 'custom') {
            $startDate = Carbon::parse($validated['start_at']);
            $endDate = Carbon::parse($validated['end_at']);
            $current = $startDate->copy()->subDay();
            $limit = $endDate->copy()->addDay();
            while ($current->lte($limit)) {
                $dateStr = $current->format('Y-m-d');
                Cache::forget("teacher:{$teacherId}:slots:{$dateStr}");
                $current->addDay();
            }
        } else {
            // For recurring, clear the cache for next 8 weeks for that day of the week
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
        $availability = TeacherAvailability::where('teacher_id', $request->user()->id)
            ->find($id);

        if (! $availability) {
            return back()->withErrors(['range' => 'Availability record not found or already deleted.']);
        }

        $deleteType = $request->input('delete_type', 'all');

        if ($deleteType === 'range') {
            $request->validate([
                'range_start' => ['required', 'string'],
                'range_end' => ['required', 'string'],
            ]);

            $rangeStart = Carbon::parse($request->input('range_start'));
            $rangeEnd = Carbon::parse($request->input('range_end'));

            if ($rangeEnd->lte($rangeStart)) {
                return back()->withErrors(['range' => 'End time must be after start time.']);
            }

            $teacherId = $request->user()->id;

            if ($availability->type === 'custom') {
                $hasBookings = Appointment::where('teacher_id', $teacherId)
                    ->whereIn('status', ['pending', 'confirmed'])
                    ->where(function ($query) use ($rangeStart, $rangeEnd) {
                        $query->where('start_at', '<', $rangeEnd)
                            ->where('end_at', '>', $rangeStart);
                    })
                    ->exists();

                if ($hasBookings) {
                    return back()->withErrors(['range' => 'Cannot delete this range because it has booked appointments.']);
                }

                $origStart = $availability->start_at;
                $origEnd = $availability->end_at;

                if ($rangeStart->lte($origStart) && $rangeEnd->gte($origEnd)) {
                    $availability->delete();
                } elseif ($rangeStart->gt($origStart) && $rangeEnd->lt($origEnd)) {
                    $availability->update(['end_at' => $rangeStart]);

                    TeacherAvailability::create([
                        'teacher_id' => $teacherId,
                        'type' => 'custom',
                        'start_at' => $rangeEnd,
                        'end_at' => $origEnd,
                        'slot_duration' => $availability->slot_duration,
                        'timezone' => $availability->timezone,
                        'is_active' => $availability->is_active,
                        'note' => $availability->note,
                    ]);
                } elseif ($rangeStart->lte($origStart) && $rangeEnd->gt($origStart) && $rangeEnd->lt($origEnd)) {
                    $availability->update(['start_at' => $rangeEnd]);
                } elseif ($rangeStart->gt($origStart) && $rangeStart->lt($origEnd) && $rangeEnd->gte($origEnd)) {
                    $availability->update(['end_at' => $rangeStart]);
                }
            } else {
                $dayOfWeek = $availability->day_of_week;
                $appointments = Appointment::where('teacher_id', $teacherId)
                    ->whereIn('status', ['pending', 'confirmed'])
                    ->where('start_at', '>=', Carbon::now())
                    ->get();

                $startSecs = $rangeStart->hour * 3600 + $rangeStart->minute * 60 + $rangeStart->second;
                $endSecs = $rangeEnd->hour * 3600 + $rangeEnd->minute * 60 + $rangeEnd->second;

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
                    return back()->withErrors(['range' => 'Cannot delete this range because it has booked appointments.']);
                }

                $origStartStr = $availability->start_time;
                $origEndStr = $availability->end_time;

                $origStart = Carbon::parse($origStartStr);
                $origEnd = Carbon::parse($origEndStr);

                $reqStart = Carbon::parse($rangeStart->format('H:i:s'));
                $reqEnd = Carbon::parse($rangeEnd->format('H:i:s'));

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
                        'timezone' => $availability->timezone,
                        'is_active' => $availability->is_active,
                        'note' => $availability->note,
                    ]);
                } elseif ($reqStart->lte($origStart) && $reqEnd->gt($origStart) && $reqEnd->lt($origEnd)) {
                    $availability->update(['start_time' => $reqEnd->format('H:i:s')]);
                } elseif ($reqStart->gt($origStart) && $reqStart->lt($origEnd) && $reqEnd->gte($origEnd)) {
                    $availability->update(['end_time' => $reqStart->format('H:i:s')]);
                }
            }
        } else {
            $teacherId = $request->user()->id;

            if ($availability->type === 'custom') {
                $hasBookings = Appointment::where('teacher_id', $teacherId)
                    ->whereIn('status', ['pending', 'confirmed'])
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
                    return back()->withErrors(['range' => 'Cannot delete this availability because it has booked appointments.']);
                }
            }

            $availability->delete();
        }

        // Clear the cache for this teacher's slots
        $teacherId = $request->user()->id;
        if ($availability->type === 'custom' && $availability->start_at) {
            $startDate = Carbon::parse($availability->start_at);
            $endDate = Carbon::parse($availability->end_at);
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
        }

        return back()->with('success', 'Availability deleted successfully.');
    }
}
