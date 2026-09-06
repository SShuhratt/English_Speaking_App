<?php

namespace App\Models;

use App\Support\PlatformTime;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    use HasUuids;

    protected $fillable = [
        'teacher_id',
        'pupil_id',
        'start_at',
        'end_at',
        'status',
        'notes',
        'topics',
        'cancellation_reason',
        'cancelled_by',
        'payment_status',
        'payment_rejection_reason',
        'google_event_id',
        'google_meet_link',
        'provider',
        'meeting_started',
        'is_trial',
        'duration_minutes',
        'price',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'topics' => 'array',
        'is_trial' => 'boolean',
        'duration_minutes' => 'integer',
        'price' => 'integer',
    ];

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

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function pupil()
    {
        return $this->belongsTo(User::class, 'pupil_id');
    }

    public function cancelledBy()
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function conversation()
    {
        return $this->hasOne(Conversation::class, 'appointment_id');
    }

    public function feedbacks()
    {
        return $this->hasManyThrough(Feedback::class, Conversation::class, 'appointment_id', 'conversation_id');
    }
}
