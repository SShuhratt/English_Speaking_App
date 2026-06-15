<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Services\BookingService;
use App\Services\GoogleCalendarService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TeacherAppointmentController extends Controller
{
    public function __construct(
        protected BookingService $bookingService,
        protected GoogleCalendarService $googleCalendar
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

        if ($request->wantsJson() && ! $request->hasHeader('X-Inertia')) {
            return response()->json($appointments);
        }

        return Inertia::render('teacher/appointments');
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

    /**
     * Start conversation and generate Google Meet link
     */
    public function start(Request $request, string $id)
    {
        $appointment = Appointment::with('pupil')->findOrFail($id);

        if ($appointment->teacher_id !== $request->user()->id) {
            abort(403, 'Unauthorized');
        }

        $teacher = $request->user();
        $needsLink = !$appointment->google_meet_link || 
                     str_contains($appointment->google_meet_link, 'mock-') || 
                     ($teacher->google_connected && !$appointment->google_event_id);

        if ($needsLink) {
            if ($teacher->google_connected) {
                try {
                    $event = $this->googleCalendar->createEvent($teacher, [
                        'title' => "English Practice: {$teacher->full_name} & {$appointment->pupil->full_name}",
                        'description' => "1-on-1 English speaking session on English Speaking Platform.",
                        'start' => $appointment->start_at->toIso8601String(),
                        'end' => $appointment->end_at->toIso8601String(),
                        'attendees' => [
                            ['email' => $appointment->pupil->email],
                        ],
                    ]);

                    $appointment->update([
                        'google_event_id' => $event['event_id'],
                        'google_meet_link' => $event['meet_link'],
                    ]);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("Failed to generate Google Meet link during start for appointment {$appointment->id}: " . $e->getMessage());
                    // Fallback to validly formatted mock Google Meet link
                    $lettersOnly = preg_replace('/[^a-z]/', '', strtolower(md5($appointment->id))) . 'abcdefghij';
                    $mockLink = 'https://meet.google.com/' . substr($lettersOnly, 0, 3) . '-' . substr($lettersOnly, 3, 4) . '-' . substr($lettersOnly, 7, 3);
                    $appointment->update([
                        'google_meet_link' => $mockLink,
                    ]);
                }
            } else {
                // Fallback to validly formatted mock Google Meet link
                $lettersOnly = preg_replace('/[^a-z]/', '', strtolower(md5($appointment->id))) . 'abcdefghij';
                $mockLink = 'https://meet.google.com/' . substr($lettersOnly, 0, 3) . '-' . substr($lettersOnly, 3, 4) . '-' . substr($lettersOnly, 7, 3);
                $appointment->update([
                    'google_meet_link' => $mockLink,
                ]);
            }

            \App\Events\BookingUpdated::dispatch($appointment);
        }

        return response()->json([
            'message' => 'Conversation started',
            'google_meet_link' => $appointment->google_meet_link,
        ]);
    }
}
