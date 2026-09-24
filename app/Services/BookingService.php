<?php

namespace App\Services;

use App\Events\BookingUpdated;
use App\Events\ConversationApproved;
use App\Events\ConversationBooked;
use App\Jobs\SyncAppointmentToGoogleJob;
use App\Models\Appointment;
use App\Models\PupilPackage;
use App\Models\TeacherAvailability;
use App\Models\User;
use App\Notifications\AdminConfirmedNotification;
use App\Notifications\AppointmentCancelledNotification;
use App\Notifications\AppointmentRejectedNotification;
use App\Notifications\BookingRequestedNotification;
use App\Notifications\TeacherApprovedNotification;
use App\Support\PlatformTime;
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

            $start = PlatformTime::parseLocal($startAt);
            $isTrialRequested = (bool) ($meta['is_trial'] ?? false);

            $hourlyRate = (float) ($teacher->teacherProfile?->price ?? 0);

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
                $end = PlatformTime::parseLocal($endAt);
                $duration = isset($meta['duration_minutes']) ? (int) $meta['duration_minutes'] : (int) $start->diffInMinutes($end);
                if ($duration <= 0) {
                    $duration = 60;
                }
                $price = $hourlyRate > 0 ? (int) (round(($hourlyRate * $duration / 60) / 1000) * 1000) : 0;
            }

            // Check if pupil has an active paid package for this teacher with enough remaining minutes
            $isPackageBooking = false;
            $pupilPackageId = null;

            if (! $isTrial) {
                $activePackage = PupilPackage::where('pupil_id', $pupil->id)
                    ->where('teacher_id', $teacher->id)
                    ->where('status', 'active')
                    ->where('payment_status', 'paid')
                    ->where('remaining_minutes', '>=', $duration)
                    ->orderBy('created_at', 'asc')
                    ->lockForUpdate()
                    ->first();

                if ($activePackage) {
                    $isPackageBooking = true;
                    $pupilPackageId = $activePackage->id;
                    $price = 0;
                    $activePackage->decrement('remaining_minutes', $duration);
                    if ($activePackage->fresh()->remaining_minutes <= 0) {
                        $activePackage->update(['status' => 'exhausted']);
                    }
                }
            }

            // 1. Validate teacher availability
            $this->validateAvailability($teacher->id, $start, $end);

            // 2. Prevent overlaps
            $this->ensureNoConflicts($teacher->id, $start, $end);

            $appointment = Appointment::create([
                'teacher_id' => $teacher->id,
                'pupil_id' => $pupil->id,
                'start_at' => $start->copy()->utc(),
                'end_at' => $end->copy()->utc(),
                'status' => 'pending',
                'notes' => $meta['notes'] ?? null,
                'topics' => $meta['topics'] ?? null,
                'is_trial' => $isTrial,
                'duration_minutes' => $duration,
                'price' => $price,
                'pupil_package_id' => $pupilPackageId,
                'is_package_booking' => $isPackageBooking,
                'payment_status' => $isPackageBooking ? 'paid' : 'pending',

                // Google fields intentionally empty for now
                'google_event_id' => null,
                'google_meet_link' => null,
                'provider' => 'google',
            ]);

            // 4. Clear slot cache
            $startTz = $start->copy()->setTimezone('Asia/Tashkent');
            $endTz = $end->copy()->setTimezone('Asia/Tashkent');
            $current = $startTz->copy()->subDay();
            $limit = $endTz->copy()->addDay();
            while ($current->lte($limit)) {
                $dateStr = $current->toDateString();
                Cache::forget("teacher:{$teacher->id}:slots:{$dateStr}");
                $current->addDay();
            }

            // 5. Queue Google sync and dispatch notifications AFTER commit
            DB::afterCommit(function () use ($appointment, $teacher) {
                SyncAppointmentToGoogleJob::dispatch($appointment->id);
                try {
                    BookingUpdated::dispatch($appointment);
                    ConversationBooked::dispatch($appointment);
                } catch (\Exception $e) {
                    Log::error('Failed to broadcast booking update on booking creation: '.$e->getMessage());
                }
                try {
                    $teacher->notify(new BookingRequestedNotification($appointment));
                } catch (\Exception $e) {
                    Log::error('Failed to dispatch BookingRequestedNotification: '.$e->getMessage());
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

            if (in_array($appointment->status, ['cancelled', 'rejected'])) {
                throw new \Exception("Cannot cancel an appointment that is already {$appointment->status}.");
            }

            if ($appointment->status === 'completed' || $appointment->end_at->isPast()) {
                throw new \Exception('Cannot cancel a past or completed appointment.');
            }

            $googleEventId = $appointment->google_event_id;

            $appointment->update([
                'status' => 'cancelled',
                'cancellation_reason' => $reason,
                'cancelled_by' => $userId,
                'google_event_id' => null,
                'google_meet_link' => null,
            ]);

            $this->refundPackageMinutesIfNeeded($appointment);

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
            if ($googleEventId && $teacher && $teacher->google_connected) {
                try {
                    app(GoogleCalendarService::class)->deleteEvent($teacher, $googleEventId);
                } catch (\Exception $e) {
                    Log::error("Failed to delete Google event {$googleEventId} on cancellation: ".$e->getMessage());
                }
            }

            DB::afterCommit(function () use ($appointment, $reason, $userId) {
                try {
                    BookingUpdated::dispatch($appointment);
                } catch (\Exception $e) {
                    Log::error('Failed to broadcast booking update on cancellation: '.$e->getMessage());
                }
                try {
                    $isPupilCancelling = $appointment->pupil_id === $userId;
                    $cancelledByName = $isPupilCancelling
                        ? ($appointment->pupil?->full_name ?? 'The student')
                        : ($appointment->teacher?->full_name ?? 'The teacher');
                    $recipient = $isPupilCancelling ? $appointment->teacher : $appointment->pupil;
                    $recipient?->notify(new AppointmentCancelledNotification($appointment, $reason, $cancelledByName));
                } catch (\Exception $e) {
                    Log::error('Failed to dispatch AppointmentCancelledNotification: '.$e->getMessage());
                }
            });

            return $appointment;
        });
    }

    /**
     * Approve appointment by teacher (Status becomes accepted, payment status verifying)
     */
    public function approve(string $id, ?string $userId = null): Appointment
    {
        return DB::transaction(function () use ($id, $userId) {
            $appointment = Appointment::findOrFail($id);

            if ($userId && $appointment->teacher_id !== $userId) {
                abort(403, 'Unauthorized');
            }

            if ($appointment->status !== 'pending') {
                throw new \Exception("Cannot approve an appointment that is {$appointment->status}.");
            }

            if ($appointment->end_at->isPast()) {
                throw new \Exception('Cannot approve an expired appointment.');
            }

            $isPaidPackage = $appointment->is_package_booking && $appointment->payment_status === 'paid';

            $appointment->update([
                'status' => $isPaidPackage ? 'confirmed' : 'accepted',
                'payment_status' => $isPaidPackage ? 'paid' : 'verifying',
            ]);

            DB::afterCommit(function () use ($appointment, $isPaidPackage) {
                if ($isPaidPackage) {
                    SyncAppointmentToGoogleJob::dispatch($appointment);
                }

                try {
                    BookingUpdated::dispatch($appointment);
                    ConversationApproved::dispatch($appointment);
                } catch (\Exception $e) {
                    Log::error('Failed to broadcast booking update on approval: '.$e->getMessage());
                }
                try {
                    $appointment->pupil?->notify(new TeacherApprovedNotification($appointment));
                } catch (\Exception $e) {
                    Log::error('Failed to dispatch TeacherApprovedNotification: '.$e->getMessage());
                }
            });

            return $appointment;
        });
    }

    /**
     * Admin confirms payment for appointment
     */
    public function adminConfirmPayment(string $id): Appointment
    {
        return DB::transaction(function () use ($id) {
            $appointment = Appointment::with('teacher')->findOrFail($id);

            if (in_array($appointment->status, ['cancelled', 'rejected'])) {
                throw new \Exception("Cannot confirm payment for an appointment that is already {$appointment->status}.");
            }

            if ($appointment->status !== 'accepted') {
                throw new \Exception("Cannot confirm payment for an appointment with status '{$appointment->status}'. Only 'accepted' sessions can be confirmed.");
            }

            $appointment->update([
                'status' => 'confirmed',
                'payment_status' => 'paid',
            ]);

            DB::afterCommit(function () use ($appointment) {
                SyncAppointmentToGoogleJob::dispatch($appointment);

                try {
                    BookingUpdated::dispatch($appointment);
                } catch (\Exception $e) {
                    Log::error('Failed to broadcast booking update on admin payment confirmation: '.$e->getMessage());
                }
                try {
                    $appointment->teacher?->notify(new AdminConfirmedNotification($appointment));
                    $appointment->pupil?->notify(new AdminConfirmedNotification($appointment));
                } catch (\Exception $e) {
                    Log::error('Failed to dispatch AdminConfirmedNotification: '.$e->getMessage());
                }
            });

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

            if (in_array($appointment->status, ['cancelled', 'rejected'])) {
                throw new \Exception("Cannot reject payment for an appointment that is already {$appointment->status}.");
            }

            if ($appointment->status !== 'accepted') {
                throw new \Exception("Cannot reject payment for an appointment with status '{$appointment->status}'. Only 'accepted' sessions can be rejected.");
            }

            $googleEventId = $appointment->google_event_id;

            $appointment->update([
                'status' => 'rejected',
                'payment_status' => 'rejected',
                'payment_rejection_reason' => $reason,
                'cancellation_reason' => $reason,
                'google_event_id' => null,
                'google_meet_link' => null,
            ]);

            $this->refundPackageMinutesIfNeeded($appointment);

            // Clear slot cache
            $current = $appointment->start_at->copy()->subDay();
            $limit = $appointment->end_at->copy()->addDay();
            while ($current->lte($limit)) {
                $dateStr = $current->toDateString();
                Cache::forget("teacher:{$appointment->teacher_id}:slots:{$dateStr}");
                $current = $current->addDay();
            }

            // Delete Google Calendar event if exists
            $teacher = $appointment->teacher;
            if ($googleEventId && $teacher && $teacher->google_connected) {
                try {
                    app(GoogleCalendarService::class)->deleteEvent($teacher, $googleEventId);
                } catch (\Exception $e) {
                    Log::error("Failed to delete Google event {$googleEventId} on admin payment rejection: ".$e->getMessage());
                }
            }

            DB::afterCommit(function () use ($appointment, $reason) {
                try {
                    BookingUpdated::dispatch($appointment);
                } catch (\Exception $e) {
                    Log::error('Failed to broadcast booking update on admin payment rejection: '.$e->getMessage());
                }
                try {
                    $appointment->pupil?->notify(new AppointmentRejectedNotification($appointment, $reason));
                } catch (\Exception $e) {
                    Log::error('Failed to dispatch AppointmentRejectedNotification: '.$e->getMessage());
                }
            });

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

            if (in_array($appointment->status, ['cancelled', 'rejected'])) {
                throw new \Exception("Cannot reject an appointment that is already {$appointment->status}.");
            }

            if ($appointment->status === 'completed' || $appointment->end_at->isPast()) {
                throw new \Exception('Cannot reject an expired or completed appointment.');
            }

            $googleEventId = $appointment->google_event_id;

            $appointment->update([
                'status' => 'rejected',
                'cancellation_reason' => $reason,
                'cancelled_by' => $userId,
                'google_event_id' => null,
                'google_meet_link' => null,
            ]);

            $this->refundPackageMinutesIfNeeded($appointment);

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
            if ($googleEventId && $teacher && $teacher->google_connected) {
                try {
                    app(GoogleCalendarService::class)->deleteEvent($teacher, $googleEventId);
                } catch (\Exception $e) {
                    Log::error("Failed to delete Google event {$googleEventId} on rejection: ".$e->getMessage());
                }
            }

            DB::afterCommit(function () use ($appointment, $reason) {
                try {
                    BookingUpdated::dispatch($appointment);
                } catch (\Exception $e) {
                    Log::error('Failed to broadcast booking update on rejection: '.$e->getMessage());
                }
                try {
                    $appointment->pupil?->notify(new AppointmentRejectedNotification($appointment, $reason));
                } catch (\Exception $e) {
                    Log::error('Failed to dispatch AppointmentRejectedNotification: '.$e->getMessage());
                }
            });

            return $appointment;
        });
    }

    /**
     * Check if teacher is available
     */
    protected function validateAvailability(string $teacherId, Carbon $start, Carbon $end): void
    {
        $startTz = PlatformTime::toLocal($start);
        $endTz = PlatformTime::toLocal($end);
        $startUtc = PlatformTime::toUtc($start);
        $endUtc = PlatformTime::toUtc($end);
        $day = strtolower($startTz->format('l'));

        $available = TeacherAvailability::where('teacher_id', $teacherId)
            ->where('is_active', true)
            ->where(function ($q) use ($startTz, $endTz, $startUtc, $endUtc, $day) {

                // recurring schedule
                $q->where(function ($q) use ($startTz, $endTz, $day) {
                    $q->where('type', 'recurring')
                        ->where('day_of_week', $day)
                        ->whereTime('start_time', '<=', $startTz->format('H:i:s'))
                        ->whereTime('end_time', '>=', $endTz->format('H:i:s'));
                })

                // custom availability override (stored in UTC)
                    ->orWhere(function ($q) use ($startUtc, $endUtc) {
                        $q->where('type', 'custom')
                            ->where('start_at', '<=', $endUtc)
                            ->where('end_at', '>=', $startUtc);
                    });

            })
            ->exists();

        if (! $available) {
            throw new \Exception('not suitable to teacher\'s availability');
        }

        $isBlackedOut = TeacherAvailability::where('teacher_id', $teacherId)
            ->where('type', 'custom')
            ->where('is_active', false)
            ->where('start_at', '<', $endUtc)
            ->where('end_at', '>', $startUtc)
            ->exists();

        if ($isBlackedOut) {
            throw new \Exception('not suitable to teacher\'s availability');
        }
    }

    /**
     * Prevent overlapping bookings
     */
    protected function ensureNoConflicts(string $teacherId, Carbon $start, Carbon $end): void
    {
        $startUtc = PlatformTime::toUtc($start);
        $endUtc = PlatformTime::toUtc($end);

        $conflict = Appointment::where('teacher_id', $teacherId)
            ->whereIn('status', ['pending', 'accepted', 'confirmed'])
            ->where('start_at', '<', $endUtc)
            ->where('end_at', '>', $startUtc)
            ->exists();

        if ($conflict) {
            throw new \Exception('Time slot already booked.');
        }
    }

    /**
     * Refund package minutes if appointment was booked using a package
     */
    protected function refundPackageMinutesIfNeeded(Appointment $appointment): void
    {
        if ($appointment->is_package_booking && $appointment->pupil_package_id) {
            // Only refund if cancelled before lesson starts or rejected by teacher
            if ($appointment->status === 'rejected' || $appointment->start_at->isFuture()) {
                $pupilPackage = PupilPackage::lockForUpdate()->find($appointment->pupil_package_id);
                if ($pupilPackage) {
                    $pupilPackage->increment('remaining_minutes', $appointment->duration_minutes);
                    if ($pupilPackage->status === 'exhausted' && $pupilPackage->remaining_minutes > 0) {
                        $pupilPackage->update(['status' => 'active']);
                    }
                }
            }
        }
    }
}
