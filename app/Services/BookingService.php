<?php

namespace App\Services;

use App\Events\BookingUpdated;
use App\Events\ConversationApproved;
use App\Events\ConversationBooked;
use App\Jobs\SyncAppointmentToGoogleJob;
use App\Models\Appointment;
use App\Models\TeacherAvailability;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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

            if (is_null($pupil->role)) {
                $pupil->update(['role' => 'pupil']);
            }

            if (! $pupil->pupilProfile()->exists()) {
                $pupil->pupilProfile()->create([]);
                $pupil->load('pupilProfile');
            }

            if (is_null($teacher->role)) {
                $teacher->update(['role' => 'teacher']);
            }

            if (! $teacher->teacherProfile()->exists()) {
                $teacher->teacherProfile()->create([]);
            }

            $start = Carbon::parse($startAt);
            $isTrialRequested = (bool) ($meta['is_trial'] ?? false);

            $rate30 = (float) ($teacher->teacherProfile?->price ?? 0);
            $hourlyRate = $rate30 * 2;

            if ($isTrialRequested) {
                if ($pupil->hasBookedWithTeacher($teacher->id)) {
                    throw new \Exception('Trial lessons are available for first-time students only with this teacher.');
                }
                $isTrial = true;
                $duration = 20;
                $end = (clone $start)->addMinutes(20);
                $price = $hourlyRate > 0 ? (int) (round(($hourlyRate / 3) / 1000) * 1000) : 0;
            } else {
                $isTrial = false;
                $duration = isset($meta['duration_minutes']) ? (int) $meta['duration_minutes'] : (int) $start->diffInMinutes(Carbon::parse($endAt));
                if ($duration <= 0) {
                    $duration = 60;
                }
                $end = Carbon::parse($endAt);
                $price = $hourlyRate > 0 ? (int) (round(($hourlyRate * $duration / 60) / 1000) * 1000) : 0;
            }

            // 1. Validate teacher availability
            $this->validateAvailability($teacher->id, $start, $end);

            // 2. Prevent overlaps
            $this->ensureNoConflicts($teacher->id, $start, $end);

            $appointment = Appointment::create([
                'teacher_id' => $teacher->id,
                'pupil_id' => $pupil->id,
                'start_at' => $start,
                'end_at' => $end,
                'status' => 'pending',
                'notes' => $meta['notes'] ?? null,
                'topics' => $meta['topics'] ?? null,
                'is_trial' => $isTrial,
                'duration_minutes' => $duration,
                'price' => $price,

                // Google fields intentionally empty for now
                'google_event_id' => null,
                'google_meet_link' => null,
                'provider' => 'google',
            ]);

            // 4. Clear slot cache
            $current = $start->copy()->subDay();
            $limit = $end->copy()->addDay();
            while ($current->lte($limit)) {
                $dateStr = $current->toDateString();
                Cache::forget("teacher:{$teacher->id}:slots:{$dateStr}");
                $current->addDay();
            }

            // 5. Queue Google sync AFTER commit
            DB::afterCommit(function () use ($appointment) {
                SyncAppointmentToGoogleJob::dispatch($appointment->id);
                try {
                    BookingUpdated::dispatch($appointment);
                    ConversationBooked::dispatch($appointment);
                } catch (\Exception $e) {
                    Log::error('Failed to broadcast booking update on booking creation: '.$e->getMessage());
                }
            });

            return $appointment;
        });
    }

    /**
     * Cancel appointment
     */
    public function cancel(string $id, string $reason, string $userId): Appointment
    {
        return DB::transaction(function () use ($id, $reason, $userId) {
            $appointment = Appointment::with('teacher')->findOrFail($id);

            if ($appointment->pupil_id !== $userId && $appointment->teacher_id !== $userId) {
                abort(403, 'Unauthorized');
            }

            $appointment->update([
                'status' => 'cancelled',
                'cancellation_reason' => $reason,
                'cancelled_by' => $userId,
            ]);

            // Clear cache
            $current = $appointment->start_at->copy()->subDay();
            $limit = $appointment->end_at->copy()->addDay();
            while ($current->lte($limit)) {
                $dateStr = $current->toDateString();
                Cache::forget("teacher:{$appointment->teacher_id}:slots:{$dateStr}");
                $current = $current->addDay();
            }

            // Delete Google Calendar event if exists
            $teacher = $appointment->teacher;
            if ($appointment->google_event_id && $teacher && $teacher->google_connected) {
                try {
                    app(GoogleCalendarService::class)->deleteEvent($teacher, $appointment->google_event_id);
                } catch (\Exception $e) {
                    Log::error("Failed to delete Google event {$appointment->google_event_id} on cancellation: ".$e->getMessage());
                }
            }

            try {
                BookingUpdated::dispatch($appointment);
            } catch (\Exception $e) {
                Log::error('Failed to broadcast booking update on cancellation: '.$e->getMessage());
            }

            return $appointment;
        });
    }

    /**
     * Approve appointment by teacher (Status becomes accepted, payment status verifying)
     */
    public function approve(string $id): Appointment
    {
        return DB::transaction(function () use ($id) {
            $appointment = Appointment::findOrFail($id);
            $appointment->update([
                'status' => 'accepted',
                'payment_status' => 'verifying',
            ]);

            try {
                BookingUpdated::dispatch($appointment);
                ConversationApproved::dispatch($appointment);
            } catch (\Exception $e) {
                Log::error('Failed to broadcast booking update on approval: '.$e->getMessage());
            }

            return $appointment;
        });
    }

    /**
     * Admin confirms payment for appointment
     */
    public function adminConfirmPayment(string $id): Appointment
    {
        return DB::transaction(function () use ($id) {
            $appointment = Appointment::findOrFail($id);
            $appointment->update([
                'status' => 'confirmed',
                'payment_status' => 'paid',
            ]);

            SyncAppointmentToGoogleJob::dispatch($appointment);

            try {
                BookingUpdated::dispatch($appointment);
            } catch (\Exception $e) {
                Log::error('Failed to broadcast booking update on admin payment confirmation: '.$e->getMessage());
            }

            return $appointment;
        });
    }

    /**
     * Admin rejects payment for appointment with reason
     */
    public function adminRejectPayment(string $id, string $reason): Appointment
    {
        return DB::transaction(function () use ($id, $reason) {
            $appointment = Appointment::with('teacher')->findOrFail($id);
            $appointment->update([
                'status' => 'rejected',
                'payment_status' => 'rejected',
                'payment_rejection_reason' => $reason,
                'cancellation_reason' => $reason,
            ]);

            // Clear slot cache
            $current = $appointment->start_at->copy()->subDay();
            $limit = $appointment->end_at->copy()->addDay();
            while ($current->lte($limit)) {
                $dateStr = $current->toDateString();
                Cache::forget("teacher:{$appointment->teacher_id}:slots:{$dateStr}");
                $current = $current->addDay();
            }

            try {
                BookingUpdated::dispatch($appointment);
            } catch (\Exception $e) {
                Log::error('Failed to broadcast booking update on admin payment rejection: '.$e->getMessage());
            }

            return $appointment;
        });
    }

    /**
     * Reject appointment
     */
    public function reject(string $id, string $reason, string $userId): Appointment
    {
        return DB::transaction(function () use ($id, $reason, $userId) {
            $appointment = Appointment::with('teacher')->findOrFail($id);

            if ($appointment->teacher_id !== $userId) {
                abort(403, 'Unauthorized');
            }

            $appointment->update([
                'status' => 'rejected',
                'cancellation_reason' => $reason,
                'cancelled_by' => $userId,
            ]);

            // Clear cache to make slot available again
            $current = $appointment->start_at->copy()->subDay();
            $limit = $appointment->end_at->copy()->addDay();
            while ($current->lte($limit)) {
                $dateStr = $current->toDateString();
                Cache::forget("teacher:{$appointment->teacher_id}:slots:{$dateStr}");
                $current = $current->addDay();
            }

            // Delete Google Calendar event if exists
            $teacher = $appointment->teacher;
            if ($appointment->google_event_id && $teacher && $teacher->google_connected) {
                try {
                    app(GoogleCalendarService::class)->deleteEvent($teacher, $appointment->google_event_id);
                } catch (\Exception $e) {
                    Log::error("Failed to delete Google event {$appointment->google_event_id} on rejection: ".$e->getMessage());
                }
            }

            try {
                BookingUpdated::dispatch($appointment);
            } catch (\Exception $e) {
                Log::error('Failed to broadcast booking update on rejection: '.$e->getMessage());
            }

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
            throw new \Exception('not suitable to teacher\'s availability');
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
