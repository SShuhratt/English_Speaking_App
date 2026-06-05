<?php

namespace App\Http\Controllers;

use App\Services\BookingService;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function __construct(
        protected BookingService $bookingService
    ) {}

    /**
     * Book appointment
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'teacher_id' => ['required', 'uuid', 'exists:users,id'],
            'pupil_id'   => ['required', 'uuid', 'exists:users,id'],
            'start_at'   => ['required', 'date'],
            'end_at'     => ['required', 'date', 'after:start_at'],
            'notes'      => ['nullable', 'string'],
        ]);

        $appointment = $this->bookingService->book(
            teacherId: $validated['teacher_id'],
            pupilId: $validated['pupil_id'],
            startAt: $validated['start_at'],
            endAt: $validated['end_at'],
            meta: [
                'notes' => $validated['notes'] ?? null,
            ]
        );

        return response()->json([
            'message' => 'Appointment booked successfully',
            'data' => $appointment
        ], 201);
    }

    /**
     * Get availability view (delegated)
     */
    public function availableSlots(Request $request, string $teacherId)
    {
        $request->validate([
            'date' => ['required', 'date']
        ]);

        $slots = $this->bookingService->getAvailableSlots(
            teacherId: $teacherId,
            date: $request->date
        );

        return response()->json($slots);
    }

    /**
     * Cancel appointment
     */
    public function cancel(string $id)
    {
        $appointment = $this->bookingService->cancel($id);

        return response()->json([
            'message' => 'Appointment cancelled',
            'data' => $appointment
        ]);
    }

    public function slots(Request $request, string $teacherId)
    {
        $request->validate([
            'date' => ['required', 'date'],
            'duration' => ['nullable', 'integer']
        ]);

        $slots = app(\App\Services\SlotService::class)->generate(
            $teacherId,
            $request->date,
            $request->duration ?? 30
        );

        return response()->json([
            'teacher_id' => $teacherId,
            'date' => $request->date,
            'slots' => $slots
        ]);
    }
}