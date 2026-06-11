<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Services\BookingService;
use Illuminate\Http\Request;
use Inertia\Inertia;

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
     * Show teacher schedule
     */
    public function schedule(Request $request)
    {
        $appointments = Appointment::where('teacher_id', $request->user()->id)
            ->where('status', 'confirmed')
            ->with('pupil')
            ->orderBy('start_at')
            ->get();

        return Inertia::render('teacher/schedule', [
            'appointments' => $appointments,
        ]);
    }

    /**
     * Show teacher sessions (past and upcoming)
     */
    public function sessions(Request $request)
    {
        $appointments = Appointment::where('teacher_id', $request->user()->id)
            ->with('pupil')
            ->latest()
            ->paginate();

        return Inertia::render('teacher/sessions', [
            'appointments' => $appointments,
        ]);
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
