<?php

namespace App\Http\Controllers;

use App\Services\BookingService;
use Illuminate\Http\Request;
use App\Models\Appointment;

class TeacherAppointmentController extends Controller
{
    public function __construct(
        protected BookingService $bookingService
    ) {}

    /**
     * List teacher appointments
     */
    public function index(Request $request)
    {
        $appointments = Appointment::where('teacher_id', $request->user()->id)
            ->with('pupil')
            ->latest()
            ->paginate();

        return response()->json($appointments);
    }

    /**
     * Approve appointment
     */
    public function approve(string $id)
    {
        $appointment = $this->bookingService->approve($id);

        return response()->json([
            'message' => 'Appointment approved',
            'data' => $appointment,
        ]);
    }

    /**
     * Reject appointment
     */
    public function reject(string $id)
    {
        $appointment = $this->bookingService->reject($id);

        return response()->json([
            'message' => 'Appointment rejected',
            'data' => $appointment,
        ]);
    }
}
