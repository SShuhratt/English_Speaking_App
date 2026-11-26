<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\GroupSession;
use App\Models\GroupSessionEnrollment;
use App\Models\TeacherProfile;
use App\Models\User;
use App\Notifications\GroupSessionNotification;
use App\Support\PlatformTime;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

class GroupSessionService
{
    public const AUTO_CANCEL_GRACE_MINUTES = 15;

    public const SEAT_HOLD_MINUTES = 15;

    public function __construct(
        protected MonetizationCalculator $calculator,
        protected PartnerCommissionService $commissionService,
    ) {}

    /**
     * Create a scheduled group speaking session for a teacher.
     *
     * @param  array<string, mixed>  $data
     */
    public function createSession(User $teacher, array $data): GroupSession
    {
        if ($teacher->role !== 'teacher') {
            abort(403, 'Only teachers can host group conversations.');
        }

        $start = PlatformTime::parseLocal($data['start_at'] ?? null);
        if (! $start || $start->lte(PlatformTime::localNow())) {
            throw ValidationException::withMessages([
                'start_at' => ['Group session start time must be in the future.'],
            ]);
        }

        $duration = (int) ($data['duration_minutes'] ?? 60);
        if ($duration < 30 || $duration > 180) {
            throw ValidationException::withMessages([
                'duration_minutes' => ['Group session duration must be between 30 and 180 minutes.'],
            ]);
        }

        $end = $start->copy()->addMinutes($duration);
        $maxSeats = (int) ($data['max_seats'] ?? 5);
        $pricePerSeat = (int) ($data['price_per_seat'] ?? 0);

        if ($maxSeats < 2 || $maxSeats > 20) {
            throw ValidationException::withMessages([
                'max_seats' => ['Seat capacity must be between 2 and 20 students.'],
            ]);
        }

        if ($pricePerSeat < 1000) {
            throw ValidationException::withMessages([
                'price_per_seat' => ['Seat price must be at least 1,000 UZS.'],
            ]);
        }

        return DB::transaction(function () use ($teacher, $data, $start, $end, $duration, $maxSeats, $pricePerSeat) {
            $this->ensureNoTeacherScheduleOverlap($teacher->id, $start, $end);

            $session = GroupSession::create([
                'teacher_id' => $teacher->id,
                'title' => trim((string) $data['title']),
                'topic' => isset($data['topic']) ? trim((string) $data['topic']) : null,
                'target_level' => (string) ($data['target_level'] ?? 'all'),
                'start_at' => $start->copy()->utc(),
                'end_at' => $end->copy()->utc(),
                'duration_minutes' => $duration,
                'max_seats' => $maxSeats,
                'price_per_seat' => $pricePerSeat,
                'status' => 'scheduled',
            ]);

            $profile = $teacher->teacherProfile;
            if ($profile && ! $profile->supports_group_sessions) {
                $profile->update([
                    'supports_group_sessions' => true,
                    'preferred_session_format' => $profile->preferred_session_format === 'one_on_one'
                        ? 'both'
                        : $profile->preferred_session_format,
                ]);
            }

            $this->clearTeacherSlotCache($teacher->id, $start, $end);

            return $session;
        });
    }

    /**
     * Reschedule an unstarted scheduled group session.
     */
    public function rescheduleSession(
        GroupSession $session,
        User $teacher,
        string $newStartAt,
        ?int $newDurationMinutes = null
    ): GroupSession {
        if ($session->teacher_id !== $teacher->id) {
            abort(403, 'Unauthorized.');
        }

        if ($session->status !== 'scheduled' || $session->meeting_started) {
            throw ValidationException::withMessages([
                'start_at' => ['Only unstarted scheduled group sessions can be rescheduled.'],
            ]);
        }

        $start = PlatformTime::parseLocal($newStartAt);
        if (! $start || $start->lte(PlatformTime::localNow())) {
            throw ValidationException::withMessages([
                'start_at' => ['New start time must be in the future.'],
            ]);
        }

        $duration = $newDurationMinutes ?? (int) $session->duration_minutes;
        if ($duration < 30 || $duration > 180) {
            throw ValidationException::withMessages([
                'duration_minutes' => ['Group session duration must be between 30 and 180 minutes.'],
            ]);
        }

        $end = $start->copy()->addMinutes($duration);

        return DB::transaction(function () use ($session, $teacher, $start, $end, $duration) {
            $locked = GroupSession::lockForUpdate()->findOrFail($session->id);
            $oldStart = $locked->start_at;
            $oldEnd = $locked->end_at;

            $this->ensureNoTeacherScheduleOverlap($teacher->id, $start, $end, $locked->id);

            $locked->update([
                'start_at' => $start->copy()->utc(),
                'end_at' => $end->copy()->utc(),
                'duration_minutes' => $duration,
                'reminder_5min_sent_at' => null,
            ]);

            if ($oldStart && $oldEnd) {
                $this->clearTeacherSlotCache($teacher->id, $oldStart, $oldEnd);
            }
            $this->clearTeacherSlotCache($teacher->id, $start, $end);

            $fresh = $locked->fresh(['teacher', 'paidEnrollments.pupil']);

            if ($fresh->google_event_id && $teacher->google_connected) {
                $this->syncGoogleEvent($fresh, $teacher);
            }

            DB::afterCommit(function () use ($fresh) {
                foreach ($fresh->paidEnrollments as $enrollment) {
                    $enrollment->pupil?->notify(new GroupSessionNotification($fresh, 'rescheduled'));
                }
            });

            return $fresh;
        });
    }

    /**
     * Reserve a seat for a pupil (blocking all promo/institutional vouchers).
     *
     * @param  array<string, mixed>  $meta
     */
    public function enroll(User $pupil, GroupSession $session, array $meta = []): GroupSessionEnrollment
    {
        if (! empty($meta['voucher_code']) || ! empty($meta['discount_voucher_code']) || ! empty($meta['partner_voucher_code']) || ! empty($meta['discount_voucher_id'])) {
            throw ValidationException::withMessages([
                'voucher_code' => ['Discount vouchers and partner vouchers cannot be applied to group conversation sessions.'],
            ]);
        }

        return DB::transaction(function () use ($pupil, $session) {
            $locked = GroupSession::lockForUpdate()->findOrFail($session->id);

            if ($locked->teacher_id === $pupil->id) {
                throw ValidationException::withMessages([
                    'group_session_id' => ['Teachers cannot enroll as students in their own group session.'],
                ]);
            }

            if ($locked->status !== 'scheduled' || $locked->meeting_started || $locked->end_at->isPast()) {
                throw ValidationException::withMessages([
                    'group_session_id' => ['This group session is no longer open for enrollment.'],
                ]);
            }

            $existing = GroupSessionEnrollment::where('group_session_id', $locked->id)
                ->where('pupil_id', $pupil->id)
                ->lockForUpdate()
                ->first();

            if ($existing && in_array($existing->status, ['enrolled', 'completed'], true)) {
                throw ValidationException::withMessages([
                    'group_session_id' => ['You are already enrolled in this group session.'],
                ]);
            }

            if (
                $existing
                && $existing->status === 'pending_payment'
                && ($existing->reserved_until === null || $existing->reserved_until->isFuture() || $existing->receipt_data !== null || $existing->receipt_path !== null)
            ) {
                throw ValidationException::withMessages([
                    'group_session_id' => ['You already have a pending seat reservation for this session.'],
                ]);
            }

            if ($locked->occupiedSeatsCount() >= $locked->max_seats) {
                throw ValidationException::withMessages([
                    'group_session_id' => ['All seats for this group session are currently taken.'],
                ]);
            }

            $breakdown = $this->calculator->calculateBreakdown(
                grossAmount: (int) $locked->price_per_seat,
                gatewayProvider: 'humo_p2p',
            );

            $attributes = [
                'status' => 'pending_payment',
                'payment_status' => 'verifying',
                'payment_rejection_reason' => null,
                'price_paid' => (int) $locked->price_per_seat,
                'gross_amount' => $breakdown['gross_amount'],
                'gateway_provider' => 'humo_p2p',
                'gateway_fee_bps' => $breakdown['gateway_fee_bps'],
                'gateway_fee_amount' => $breakdown['gateway_fee_amount'],
                'net_cash_amount' => $breakdown['net_cash_amount'],
                'receipt_path' => null,
                'receipt_data' => null,
                'reserved_until' => now()->addMinutes(self::SEAT_HOLD_MINUTES),
                'completed_at' => null,
            ];

            if ($existing) {
                $existing->update($attributes);

                return $existing->fresh();
            }

            return GroupSessionEnrollment::create(array_merge($attributes, [
                'group_session_id' => $locked->id,
                'pupil_id' => $pupil->id,
            ]));
        });
    }

    /**
     * Mark an enrollment payment as verified and confirmed.
     */
    public function confirmEnrollmentPayment(GroupSessionEnrollment $enrollment): GroupSessionEnrollment
    {
        return DB::transaction(function () use ($enrollment) {
            $locked = GroupSessionEnrollment::with('groupSession.teacher', 'pupil')
                ->lockForUpdate()
                ->findOrFail($enrollment->id);

            $updates = [
                'status' => 'enrolled',
                'payment_status' => 'paid',
                'payment_rejection_reason' => null,
                'reserved_until' => null,
            ];

            if ($locked->gross_amount === null || $locked->net_cash_amount === null) {
                $provider = $locked->gateway_provider ?: 'humo_p2p';
                $breakdown = $this->calculator->calculateBreakdown(
                    grossAmount: (int) $locked->price_paid,
                    gatewayProvider: $provider,
                );
                $updates['gross_amount'] = $breakdown['gross_amount'];
                $updates['gateway_provider'] = $provider;
                $updates['gateway_fee_bps'] = $breakdown['gateway_fee_bps'];
                $updates['gateway_fee_amount'] = $breakdown['gateway_fee_amount'];
                $updates['net_cash_amount'] = $breakdown['net_cash_amount'];
            }

            $locked->update($updates);
            $fresh = $locked->fresh(['groupSession.teacher', 'pupil']);

            DB::afterCommit(function () use ($fresh) {
                $session = $fresh->groupSession;
                $teacher = $session?->teacher;

                if ($session && $session->google_event_id && $teacher && $teacher->google_connected) {
                    $this->syncGoogleEvent($session, $teacher);
                }

                if ($session && $fresh->pupil) {
                    try {
                        $fresh->pupil->notify(new GroupSessionNotification($session, 'enrollment_confirmed'));
                    } catch (Throwable $e) {
                        Log::warning('Failed to notify pupil on group seat confirmation: '.$e->getMessage());
                    }
                }
            });

            return $fresh;
        });
    }

    /**
     * Teacher starts the group meeting and generates a shared Google Meet link if connected.
     */
    public function startMeeting(GroupSession $session, User $teacher): GroupSession
    {
        if ($session->teacher_id !== $teacher->id) {
            abort(403, 'Unauthorized.');
        }

        if (in_array($session->status, ['cancelled', 'completed'], true)) {
            throw ValidationException::withMessages([
                'status' => ['Cannot start a cancelled or completed group session.'],
            ]);
        }

        if (empty($session->google_meet_link) && $teacher->google_connected) {
            $session->loadMissing('paidEnrollments.pupil');
            $event = $this->createSharedGoogleEvent($session, $teacher);
            $session->update([
                'google_event_id' => $event['event_id'] ?? null,
                'google_meet_link' => $event['meet_link'] ?? null,
            ]);
        }

        $now = now();
        $session->update([
            'status' => 'in_progress',
            'meeting_started' => true,
            'started_at' => $session->started_at ?? $now,
            'reminder_started_sent_at' => $session->reminder_started_sent_at ?? $now,
        ]);

        $fresh = $session->fresh(['teacher', 'paidEnrollments.pupil']);
        TeacherProfile::clearConversationStatsCache($teacher->id);

        foreach ($fresh->paidEnrollments as $enrollment) {
            try {
                $enrollment->pupil?->notify(new GroupSessionNotification($fresh, 'started'));
            } catch (Throwable $e) {
                Log::warning("Failed notifying pupil {$enrollment->pupil_id} on group session start: ".$e->getMessage());
            }
        }

        return $fresh;
    }

    /**
     * Cancel a group session (by teacher/admin or system after 15-min no-start) and notify enrolled pupils.
     */
    public function cancelSession(
        GroupSession $session,
        string $cancelledBy,
        ?string $reason = null,
        ?User $actor = null
    ): GroupSession {
        if ($actor && $actor->role !== 'admin' && $session->teacher_id !== $actor->id) {
            abort(403, 'Unauthorized.');
        }

        return DB::transaction(function () use ($session, $cancelledBy, $reason) {
            $locked = GroupSession::with(['teacher', 'enrollments.pupil'])
                ->lockForUpdate()
                ->findOrFail($session->id);

            if (in_array($locked->status, ['cancelled', 'completed'], true)) {
                return $locked;
            }

            $googleEventId = $locked->google_event_id;

            $locked->update([
                'status' => 'cancelled',
                'cancelled_by' => $cancelledBy,
                'cancellation_reason' => $reason,
                'google_event_id' => null,
                'google_meet_link' => null,
            ]);

            $affectedPupils = [];
            foreach ($locked->enrollments as $enrollment) {
                if (in_array($enrollment->status, ['pending_payment', 'enrolled'], true)) {
                    $wasPaid = $enrollment->payment_status === 'paid';
                    $enrollment->update([
                        'status' => 'cancelled',
                        'payment_status' => $wasPaid ? 'refunded' : 'rejected',
                        'payment_rejection_reason' => $reason,
                        'reserved_until' => null,
                    ]);

                    if ($wasPaid && $enrollment->pupil) {
                        $affectedPupils[] = $enrollment->pupil;
                    }
                }
            }

            if ($locked->start_at && $locked->end_at) {
                $this->clearTeacherSlotCache($locked->teacher_id, $locked->start_at, $locked->end_at);
            }

            DB::afterCommit(function () use ($locked, $googleEventId, $affectedPupils, $reason) {
                if ($googleEventId && $locked->teacher && $locked->teacher->google_connected) {
                    try {
                        app(GoogleCalendarService::class)->deleteEvent($locked->teacher, $googleEventId);
                    } catch (Throwable $e) {
                        Log::warning("Failed deleting Google event {$googleEventId} for group session {$locked->id}: ".$e->getMessage());
                    }
                }

                foreach ($affectedPupils as $pupil) {
                    try {
                        $pupil->notify(new GroupSessionNotification($locked, 'cancelled', $reason));
                    } catch (Throwable $e) {
                        Log::warning('Failed sending group cancellation notice: '.$e->getMessage());
                    }
                }
            });

            return $locked->fresh();
        });
    }

    /**
     * Cancel all scheduled sessions that the teacher did not start within 15 minutes of start_at.
     */
    public function cancelUnstartedSessions(int $graceMinutes = self::AUTO_CANCEL_GRACE_MINUTES): int
    {
        $cutoff = now()->subMinutes($graceMinutes);

        $sessions = GroupSession::where('status', 'scheduled')
            ->where('meeting_started', false)
            ->where('start_at', '<=', $cutoff)
            ->get();

        $cancelled = 0;
        foreach ($sessions as $session) {
            $this->cancelSession(
                $session,
                'system',
                "Automatically cancelled because the teacher did not start the session within {$graceMinutes} minutes."
            );
            $cancelled++;
        }

        return $cancelled;
    }

    /**
     * Expire unpaid seat holds past reserved_until without a submitted receipt.
     */
    public function expireUnpaidHolds(): int
    {
        $expired = GroupSessionEnrollment::where('status', 'pending_payment')
            ->where('payment_status', 'verifying')
            ->whereNull('receipt_path')
            ->whereNull('receipt_data')
            ->whereNotNull('reserved_until')
            ->where('reserved_until', '<=', now())
            ->get();

        $count = 0;
        foreach ($expired as $enrollment) {
            $enrollment->update([
                'status' => 'cancelled',
                'payment_status' => 'rejected',
                'payment_rejection_reason' => 'Seat hold expired before payment receipt was uploaded.',
            ]);
            $count++;
        }

        return $count;
    }

    /**
     * Complete past started sessions and accrue Track A net-cash partner commissions per paid enrollment.
     */
    public function completeSession(GroupSession $session, ?Carbon $completedAt = null): GroupSession
    {
        return DB::transaction(function () use ($session, $completedAt) {
            $locked = GroupSession::with('paidEnrollments')
                ->lockForUpdate()
                ->findOrFail($session->id);

            if (! $locked->meeting_started || $locked->status === 'cancelled') {
                return $locked;
            }

            $timestamp = $completedAt ?? now();

            if ($locked->status !== 'completed') {
                $locked->update([
                    'status' => 'completed',
                    'completed_at' => $timestamp,
                ]);
            }

            foreach ($locked->paidEnrollments as $enrollment) {
                if ($enrollment->status !== 'completed') {
                    $enrollment->update([
                        'status' => 'completed',
                        'completed_at' => $timestamp,
                    ]);
                }

                $this->commissionService->accrueForCompletedGroupEnrollment($enrollment);
            }

            TeacherProfile::clearConversationStatsCache($locked->teacher_id);

            return $locked->fresh();
        });
    }

    /**
     * Ensure no overlap against teacher's active 1-on-1 appointments or group sessions.
     */
    protected function ensureNoTeacherScheduleOverlap(
        string $teacherId,
        Carbon $start,
        Carbon $end,
        ?string $ignoreSessionId = null
    ): void {
        $startUtc = PlatformTime::toUtc($start);
        $endUtc = PlatformTime::toUtc($end);

        $aptConflict = Appointment::where('teacher_id', $teacherId)
            ->whereIn('status', ['pending', 'accepted', 'confirmed'])
            ->where('start_at', '<', $endUtc)
            ->where('end_at', '>', $startUtc)
            ->exists();

        if ($aptConflict) {
            throw ValidationException::withMessages([
                'start_at' => ['This time conflicts with an existing 1-on-1 lesson.'],
            ]);
        }

        $groupConflict = GroupSession::where('teacher_id', $teacherId)
            ->whereIn('status', ['scheduled', 'in_progress'])
            ->when($ignoreSessionId, fn ($q) => $q->where('id', '!=', $ignoreSessionId))
            ->where('start_at', '<', $endUtc)
            ->where('end_at', '>', $startUtc)
            ->exists();

        if ($groupConflict) {
            throw ValidationException::withMessages([
                'start_at' => ['This time conflicts with another group conversation session.'],
            ]);
        }
    }

    protected function clearTeacherSlotCache(string $teacherId, Carbon $start, Carbon $end): void
    {
        $startTz = $start->copy()->setTimezone(PlatformTime::businessTimezone());
        $endTz = $end->copy()->setTimezone(PlatformTime::businessTimezone());
        $current = $startTz->copy()->subDay();
        $limit = $endTz->copy()->addDay();

        while ($current->lte($limit)) {
            Cache::forget("teacher:{$teacherId}:slots:{$current->toDateString()}");
            $current->addDay();
        }
    }

    /**
     * Create shared Google Calendar event with paid participants.
     *
     * @return array<string, mixed>
     */
    protected function createSharedGoogleEvent(GroupSession $session, User $teacher): array
    {
        $attendees = [['email' => $teacher->email, 'responseStatus' => 'accepted']];
        foreach ($session->paidEnrollments as $enrollment) {
            if ($enrollment->pupil?->email) {
                $attendees[] = ['email' => $enrollment->pupil->email];
            }
        }

        return app(GoogleCalendarService::class)->createEvent($teacher, [
            'title' => "Group Conversation: {$session->title}",
            'description' => $session->topic ?: 'Group English speaking session on ConvoMate.',
            'start' => $session->start_at->toIso8601String(),
            'end' => $session->end_at->toIso8601String(),
            'organizer_email' => $teacher->email,
            'attendees' => $attendees,
        ]);
    }

    protected function syncGoogleEvent(GroupSession $session, User $teacher): void
    {
        try {
            $session->loadMissing('paidEnrollments.pupil');
            $attendees = [['email' => $teacher->email, 'responseStatus' => 'accepted']];
            foreach ($session->paidEnrollments as $enrollment) {
                if ($enrollment->pupil?->email) {
                    $attendees[] = ['email' => $enrollment->pupil->email];
                }
            }

            app(GoogleCalendarService::class)->updateEvent($teacher, (string) $session->google_event_id, [
                'title' => "Group Conversation: {$session->title}",
                'description' => $session->topic ?: 'Group English speaking session on ConvoMate.',
                'start' => $session->start_at->toIso8601String(),
                'end' => $session->end_at->toIso8601String(),
                'organizer_email' => $teacher->email,
                'attendees' => $attendees,
            ]);
        } catch (Throwable $e) {
            Log::warning("Failed syncing Google Calendar attendees for group session {$session->id}: ".$e->getMessage());
        }
    }
}
