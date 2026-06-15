<?php

namespace App\Http\Controllers;

use App\Models\TeacherAvailability;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class TeacherAvailabilityController extends Controller
{
    public function index(Request $request)
    {
        $availabilities = TeacherAvailability::where('teacher_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('teacher/availability', [
            'availabilities' => $availabilities,
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
                }
            ],
            // Custom fields
            'start_at' => ['required_if:type,custom', 'nullable', 'date'],
            'end_at' => ['required_if:type,custom', 'nullable', 'date', 'after:start_at'],
            // Shared fields
            'slot_duration' => ['required', 'integer', 'min:15', 'max:120'],
        ]);

        $availability = TeacherAvailability::create([
            'teacher_id' => $request->user()->id,
            'type' => $validated['type'],
            'day_of_week' => $validated['type'] === 'recurring' ? $validated['day_of_week'] : null,
            'start_time' => $validated['type'] === 'recurring' ? $validated['start_time'] : null,
            'end_time' => $validated['type'] === 'recurring' ? $validated['end_time'] : null,
            'start_at' => $validated['type'] === 'custom' ? Carbon::parse($validated['start_at']) : null,
            'end_at' => $validated['type'] === 'custom' ? Carbon::parse($validated['end_at']) : null,
            'slot_duration' => $validated['slot_duration'],
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

    public function destroy(Request $request, string $id)
    {
        $availability = TeacherAvailability::where('teacher_id', $request->user()->id)
            ->findOrFail($id);

        $availability->delete();

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
            // For recurring, clear the cache for next 8 weeks for that day of week
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
