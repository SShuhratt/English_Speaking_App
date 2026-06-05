<?php

namespace App\Services;

use App\Models\User;
use App\Models\Appointment;
use App\Models\TeacherAvailability;
use App\Jobs\SyncAppointmentToGoogleJob;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class BookingService
{
    /**
     * Create booking (DB only + queue sync)
     */
    public function book(
        User $pupil,
        User $teacher,
        string $startAt,
        string $endAt,
        array $meta = []
    ): Appointment {

        return DB::transaction(function () use ($pupil, $teacher, $startAt, $endAt, $meta) {

            $start = Carbon::parse($startAt);
            $end   = Carbon::parse($endAt);

            // 1. Validate teacher availability
            $this->validateAvailability($teacher->id, $start, $end);

            // 2. Prevent overlaps
            $this->ensureNoConflicts($teacher->id, $start, $end);

            // 3. Create appointment (NO Google logic here)
            $appointment = Appointment::create([
                'teacher_id' => $teacher->id,
                'pupil_id'   => $pupil->id,
                'start_at'   => $start,
                'end_at'     => $end,
                'status'     => 'confirmed',
                'notes'      => $meta['notes'] ?? null,

                // Google fields intentionally empty for now
                'google_event_id'   => null,
                'google_meet_link'  => null,
                'google_event_data' => null,
                'provider'          => 'google',
            ]);

            // 4. Queue Google sync AFTER commit
            DB::afterCommit(function () use ($appointment) {
                SyncAppointmentToGoogleJob::dispatch($appointment->id);
            });

            return $appointment;
        });
    }

    /**
     * Check if teacher is available
     */
    protected function validateAvailability(string $teacherId, Carbon $start, Carbon $end): void
    {
        $day = strtolower($start->format('l'));

        $available = TeacherAvailability::where('teacher_id', $teacherId)
            ->where('is_active', true)
            ->where(function ($q) use ($start, $end, $day) {

                // recurring schedule
                $q->where(function ($q) use ($start, $end, $day) {
                    $q->where('type', 'recurring')
                        ->where('day_of_week', $day)
                        ->whereTime('start_time', '<=', $start->format('H:i:s'))
                        ->whereTime('end_time', '>=', $end->format('H:i:s'));
                })

                // custom availability override
                ->orWhere(function ($q) use ($start, $end) {
                    $q->where('type', 'custom')
                        ->where('start_datetime', '<=', $start)
                        ->where('end_datetime', '>=', $end);
                });

            })
            ->exists();

        if (!$available) {
            throw new \Exception("Teacher is not available at this time.");
        }
    }

    /**
     * Prevent overlapping bookings
     */
    protected function ensureNoConflicts(string $teacherId, Carbon $start, Carbon $end): void
    {
        $conflict = Appointment::where('teacher_id', $teacherId)
            ->whereIn('status', ['pending', 'confirmed'])
            ->where(function ($q) use ($start, $end) {

                $q->whereBetween('start_at', [$start, $end])
                  ->orWhereBetween('end_at', [$start, $end])
                  ->orWhere(function ($q) use ($start, $end) {
                      $q->where('start_at', '<=', $start)
                        ->where('end_at', '>=', $end);
                  });
            })
            ->exists();

        if ($conflict) {
            throw new \Exception("Time slot already booked.");
        }
    }
}