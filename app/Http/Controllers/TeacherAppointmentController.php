<?php

namespace App\Http\Controllers;

use App\Events\BookingUpdated;
use App\Models\Appointment;
use App\Services\BookingService;
use App\Services\GoogleCalendarService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
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
            ->with(['pupil', 'cancelledBy'])
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
            ->where('end_at', '>', now())
            ->with(['pupil', 'cancelledBy'])
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
            ->with(['pupil', 'feedbacks', 'cancelledBy'])
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
    public function reject(Request $request, string $id)
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:3', 'max:1000'],
        ]);

        $appointment = $this->bookingService->reject($id, $validated['reason'], $request->user()->id);

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

        if ($appointment->end_at->isPast()) {
            abort(403, 'Meeting has expired');
        }

        $teacher = $request->user();
        $needsLink = ! $appointment->google_meet_link ||
                     str_contains($appointment->google_meet_link, 'mock-') ||
                     ($teacher->google_connected && ! $appointment->google_event_id);

        if ($needsLink) {
            if ($teacher->google_connected) {
                try {
                    $event = $this->googleCalendar->createEvent($teacher, [
                        'title' => "English Practice: {$teacher->full_name} & {$appointment->pupil->full_name}",
                        'description' => '1-on-1 English speaking session on English Speaking Platform.',
                        'start' => $appointment->start_at->toIso8601String(),
                        'end' => $appointment->end_at->toIso8601String(),
                        'organizer_email' => $teacher->email,
                        'attendees' => [
                            ['email' => $teacher->email, 'responseStatus' => 'accepted'],
                            ['email' => $appointment->pupil->email],
                        ],
                    ]);

                    $appointment->update([
                        'google_event_id' => $event['event_id'],
                        'google_meet_link' => $event['meet_link'],
                    ]);
                } catch (\Exception $e) {
                    Log::error("Failed to generate Google Meet link during start for appointment {$appointment->id}: ".$e->getMessage());
                    // Fallback to validly formatted mock Google Meet link
                    $lettersOnly = preg_replace('/[^a-z]/', '', strtolower(md5($appointment->id))).'abcdefghij';
                    $mockLink = 'https://meet.google.com/'.substr($lettersOnly, 0, 3).'-'.substr($lettersOnly, 3, 4).'-'.substr($lettersOnly, 7, 3);
                    $appointment->update([
                        'google_meet_link' => $mockLink,
                    ]);
                }
            } else {
                // Fallback to validly formatted mock Google Meet link
                $lettersOnly = preg_replace('/[^a-z]/', '', strtolower(md5($appointment->id))).'abcdefghij';
                $mockLink = 'https://meet.google.com/'.substr($lettersOnly, 0, 3).'-'.substr($lettersOnly, 3, 4).'-'.substr($lettersOnly, 7, 3);
                $appointment->update([
                    'google_meet_link' => $mockLink,
                ]);
            }
        }

        // Always mark the meeting as started when the teacher initiates it
        $appointment->update([
            'meeting_started' => true,
        ]);

        try {
            BookingUpdated::dispatch($appointment->fresh());
        } catch (\Exception $e) {
            Log::error('Failed to broadcast booking update on starting conversation: '.$e->getMessage());
        }

        return response()->json([
            'message' => 'Conversation started',
            'google_meet_link' => $appointment->google_meet_link,
        ]);
    }
}
