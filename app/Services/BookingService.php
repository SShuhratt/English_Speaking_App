<?php

namespace App\Services;

use App\Jobs\SyncAppointmentToGoogleJob;
use App\Models\Appointment;
use App\Models\TeacherAvailability;
use App\Models\User;
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
            $end = Carbon::parse($endAt);

            // 1. Validate teacher availability
            $this->validateAvailability($teacher->id, $start, $end);

            // 2. Prevent overlaps
            $this->ensureNoConflicts($teacher->id, $start, $end);

            // 3. Create appointment (NO Google logic here)
            $appointment = Appointment::create([
                'teacher_id' => $teacher->id,
                'pupil_id' => $pupil->id,
                'start_at' => $start,
                'end_at' => $end,
                'status' => 'pending',
                'notes' => $meta['notes'] ?? null,

                // Google fields intentionally empty for now
                'google_event_id' => null,
                'google_meet_link' => null,
                'provider' => 'google',
            ]);

            // 4. Clear slot cache
            $date = $start->toDateString();
            \Illuminate\Support\Facades\Cache::forget("teacher:{$teacher->id}:slots:{$date}");

            // 5. Queue Google sync AFTER commit
            DB::afterCommit(function () use ($appointment) {
                SyncAppointmentToGoogleJob::dispatch($appointment->id);
                \App\Events\BookingUpdated::dispatch($appointment);
            });

            return $appointment;
        });
    }

    /**
     * Cancel appointment
     */
    public function cancel(string $id): Appointment
    {
        return DB::transaction(function () use ($id) {
            $appointment = Appointment::findOrFail($id);
            $appointment->update(['status' => 'cancelled']);

            // Clear cache
            $date = $appointment->start_at->toDateString();
            \Illuminate\Support\Facades\Cache::forget("teacher:{$appointment->teacher_id}:slots:{$date}");

            \App\Events\BookingUpdated::dispatch($appointment);

            return $appointment;
        });
    }

    /**
     * Approve appointment
     */
    public function approve(string $id): Appointment
    {
        return DB::transaction(function () use ($id) {
            $appointment = Appointment::findOrFail($id);
            $appointment->update(['status' => 'confirmed']);

            \App\Events\BookingUpdated::dispatch($appointment);

            return $appointment;
        });
    }

    /**
     * Reject appointment
     */
    public function reject(string $id): Appointment
    {
        return DB::transaction(function () use ($id) {
            $appointment = Appointment::findOrFail($id);
            $appointment->update(['status' => 'rejected']);

            // Clear cache to make slot available again
            $date = $appointment->start_at->toDateString();
            \Illuminate\Support\Facades\Cache::forget("teacher:{$appointment->teacher_id}:slots:{$date}");

            \App\Events\BookingUpdated::dispatch($appointment);

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
                            ->where('start_at', '<=', $start)
                            ->where('end_at', '>=', $end);
                    });

            })
            ->exists();

        if (! $available) {
            throw new \Exception('Teacher is not available at this time.');
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
            throw new \Exception('Time slot already booked.');
        }
    }
}
