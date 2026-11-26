<?php

namespace App\Http\Controllers;

use App\Models\GroupSession;
use App\Services\GroupSessionService;
use App\Support\PlatformTime;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class TeacherGroupSessionController extends Controller
{
    public function index(Request $request)
    {
        $sessions = GroupSession::where('teacher_id', $request->user()->id)
            ->with(['enrollments.pupil:id,full_name,email,avatar'])
            ->orderByDesc('start_at')
            ->get()
            ->map(function (GroupSession $session) {
                $session->occupied_seats = $session->occupiedSeatsCount();
                $session->available_seats = $session->availableSeatsCount();

                return $session;
            });

        return response()->json($sessions);
    }

    public function store(Request $request, GroupSessionService $service)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'min:3', 'max:150'],
            'topic' => ['nullable', 'string', 'max:1000'],
            'target_level' => ['nullable', 'string', 'max:40'],
            'start_at' => ['required', 'date'],
            'duration_minutes' => ['required', 'integer', 'min:30', 'max:180'],
            'max_seats' => ['required', 'integer', 'min:2', 'max:20'],
            'price_per_seat' => ['required', 'integer', 'min:1000'],
        ]);

        $session = $service->createSession($request->user(), $validated);
        $session->occupied_seats = 0;
        $session->available_seats = $session->max_seats;

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Group conversation session created.',
                'session' => $session,
            ], 201);
        }

        return back()->with('success', 'Group conversation session scheduled successfully.');
    }

    public function update(Request $request, GroupSession $groupSession, GroupSessionService $service)
    {
        $validated = $request->validate([
            'start_at' => ['required', 'date'],
            'duration_minutes' => ['nullable', 'integer', 'min:30', 'max:180'],
        ]);

        $updated = $service->rescheduleSession(
            $groupSession,
            $request->user(),
            $validated['start_at'],
            isset($validated['duration_minutes']) ? (int) $validated['duration_minutes'] : null
        );

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Group session rescheduled.',
                'session' => $updated,
            ]);
        }

        return back()->with('success', 'Group session rescheduled successfully.');
    }

    public function start(Request $request, GroupSession $groupSession, GroupSessionService $service)
    {
        $teacher = $request->user();

        if ($groupSession->teacher_id !== $teacher->id) {
            abort(403, 'Unauthorized.');
        }

        try {
            $started = $service->startMeeting($groupSession, $teacher);

            return response()->json([
                'message' => 'Group conversation started.',
                'google_meet_link' => $started->google_meet_link,
                'session' => $started,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error("Failed starting group session {$groupSession->id}: ".$e->getMessage());

            $freshTeacher = $teacher->fresh();
            $disconnected = ! $freshTeacher?->google_connected || ! $freshTeacher?->google_refresh_token;

            if ($disconnected) {
                return response()->json([
                    'message' => 'Your Google Calendar connection has expired or was revoked. Please reconnect Google Calendar.',
                    'requires_google_calendar' => true,
                    'connect_url' => '/auth/google?calendar=1',
                ], 422);
            }

            return response()->json([
                'message' => 'Failed to start group session. Please try again.',
            ], 422);
        }
    }

    public function cancel(Request $request, GroupSession $groupSession, GroupSessionService $service)
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $cancelled = $service->cancelSession(
            $groupSession,
            'teacher',
            $validated['reason'] ?? 'Cancelled by teacher.',
            $request->user()
        );

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Group session cancelled.',
                'session' => $cancelled,
            ]);
        }

        return back()->with('success', 'Group session cancelled.');
    }

    public function updatePreferences(Request $request)
    {
        $validated = $request->validate([
            'preferred_session_format' => ['required', 'string', 'in:one_on_one,group,both'],
        ]);

        $profile = $request->user()->teacherProfile;
        if (! $profile) {
            abort(404);
        }

        $format = $validated['preferred_session_format'];
        $profile->update([
            'preferred_session_format' => $format,
            'supports_group_sessions' => in_array($format, ['group', 'both'], true),
        ]);

        $today = PlatformTime::localNow();
        for ($i = 0; $i < 14; $i++) {
            Cache::forget("teacher:{$request->user()->id}:slots:".$today->copy()->addDays($i)->format('Y-m-d'));
        }

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Teaching format preference updated.',
                'preferred_session_format' => $profile->preferred_session_format,
                'supports_group_sessions' => $profile->supports_group_sessions,
            ]);
        }

        return back()->with('success', 'Teaching format preference updated.');
    }
}
