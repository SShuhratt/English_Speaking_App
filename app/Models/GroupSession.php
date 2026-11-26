<?php

namespace App\Models;

use App\Support\PlatformTime;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GroupSession extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'teacher_id',
        'title',
        'topic',
        'target_level',
        'start_at',
        'end_at',
        'duration_minutes',
        'max_seats',
        'price_per_seat',
        'status',
        'meeting_started',
        'started_at',
        'google_event_id',
        'google_meet_link',
        'cancellation_reason',
        'cancelled_by',
        'reminder_5min_sent_at',
        'reminder_started_sent_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'start_at' => 'datetime',
            'end_at' => 'datetime',
            'started_at' => 'datetime',
            'reminder_5min_sent_at' => 'datetime',
            'reminder_started_sent_at' => 'datetime',
            'completed_at' => 'datetime',
            'duration_minutes' => 'integer',
            'max_seats' => 'integer',
            'price_per_seat' => 'integer',
            'meeting_started' => 'boolean',
        ];
    }

    protected function startAt(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value ? Carbon::parse($value, 'UTC') : null,
            set: fn ($value) => $value ? PlatformTime::toUtc($value) : null,
        );
    }

    protected function endAt(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value ? Carbon::parse($value, 'UTC') : null,
            set: fn ($value) => $value ? PlatformTime::toUtc($value) : null,
        );
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(GroupSessionEnrollment::class, 'group_session_id');
    }

    public function activeEnrollments(): HasMany
    {
        return $this->hasMany(GroupSessionEnrollment::class, 'group_session_id')
            ->where(function ($query) {
                $query->where('status', 'enrolled')
                    ->orWhere(function ($q) {
                        $q->where('status', 'pending_payment')
                            ->where(function ($holdQuery) {
                                $holdQuery->whereNull('reserved_until')
                                    ->orWhere('reserved_until', '>', now())
                                    ->orWhereNotNull('receipt_data')
                                    ->orWhereNotNull('receipt_path');
                            });
                    });
            });
    }

    public function paidEnrollments(): HasMany
    {
        return $this->hasMany(GroupSessionEnrollment::class, 'group_session_id')
            ->where('payment_status', 'paid')
            ->whereIn('status', ['enrolled', 'completed']);
    }

    public function feedbacks(): HasMany
    {
        return $this->hasMany(Feedback::class, 'group_session_id');
    }

    /**
     * Count seats currently occupied (confirmed paid + unexpired payment holds).
     */
    public function occupiedSeatsCount(): int
    {
        return $this->activeEnrollments()->count();
    }

    public function availableSeatsCount(): int
    {
        return max(0, (int) $this->max_seats - $this->occupiedSeatsCount());
    }
}
