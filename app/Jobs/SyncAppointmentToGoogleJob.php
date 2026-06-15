<?php

namespace App\Jobs;

use App\Models\Appointment;
use App\Services\GoogleCalendarService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class SyncAppointmentToGoogleJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(public Appointment|string $appointment)
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(GoogleCalendarService $googleCalendar): void
    {
        $appointment = $this->appointment;
        if (is_string($appointment)) {
            $appointment = Appointment::with('teacher', 'pupil')->find($appointment);
        }

        if (!$appointment) {
            return;
        }

        $teacher = $appointment->teacher;

        if ($teacher && $teacher->google_connected) {
            try {
                $event = $googleCalendar->createEvent($teacher, [
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

                \App\Events\BookingUpdated::dispatch($appointment);
            } catch (\Exception $e) {
                Log::error("Failed to sync appointment {$appointment->id} to Google: " . $e->getMessage());
            }
        }
    }
}
