<?php

namespace App\Http\Controllers;

use App\Models\TeacherAvailability;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TeacherAvailabilityController extends Controller
{
    public function index(Request $request)
    {
        $availabilities = TeacherAvailability::where('teacher_id', $request->user()->id)->get();

        return Inertia::render('teacher/availability', [
            'availabilities' => $availabilities,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'day_of_week' => ['required', 'string', 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'slot_duration' => ['required', 'integer', 'min:15', 'max:120'],
        ]);

        $availability = TeacherAvailability::create([
            'teacher_id' => $request->user()->id,
            'type' => 'recurring',
            'day_of_week' => $validated['day_of_week'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'slot_duration' => $validated['slot_duration'],
            'is_active' => true,
        ]);

        return back()->with('success', 'Availability added successfully.');
    }
}
