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
        'original_price',
        'gross_amount',
        'gateway_provider',
        'gateway_fee_bps',
        'gateway_fee_amount',
        'net_cash_amount',
        'is_promotional_zero_cash',
        'completed_at',
        'completion_voided_at',
        'completion_void_reason',
        'reminder_5min_sent_at',
        'reminder_started_sent_at',
        'pupil_package_id',
        'is_package_booking',
        'discount_voucher_id',
        'partner_voucher_id',
        'discount_amount',
        'platform_subsidy_amount',
        'receipt_path',
        'receipt_data',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'completed_at' => 'datetime',
        'completion_voided_at' => 'datetime',
        'reminder_5min_sent_at' => 'datetime',
        'reminder_started_sent_at' => 'datetime',
        'topics' => 'array',
        'is_trial' => 'boolean',
        'meeting_started' => 'boolean',
        'duration_minutes' => 'integer',
        'price' => 'integer',
        'original_price' => 'integer',
        'gross_amount' => 'integer',
        'gateway_fee_bps' => 'integer',
        'gateway_fee_amount' => 'integer',
        'net_cash_amount' => 'integer',
        'is_promotional_zero_cash' => 'boolean',
        'discount_amount' => 'integer',
        'platform_subsidy_amount' => 'integer',
        'is_package_booking' => 'boolean',
        'receipt_data' => 'array',
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

    public function pupilPackage()
    {
        return $this->belongsTo(PupilPackage::class, 'pupil_package_id');
    }

    public function assessment()
    {
        return $this->hasOne(AppointmentAssessment::class, 'appointment_id');
    }

    public function discountVoucher()
    {
        return $this->belongsTo(UserDiscountVoucher::class, 'discount_voucher_id');
    }

    public function partnerVoucher()
    {
        return $this->belongsTo(PartnerVoucher::class, 'partner_voucher_id');
    }

    public function partnerCommissionEntry()
    {
        return $this->hasOne(PartnerCommissionEntry::class, 'appointment_id');
    }

    public function materials()
    {
        return $this->hasMany(AppointmentMaterial::class, 'appointment_id')->latest();
    }

    public function offPlatformReport()
    {
        return $this->hasOne(OffPlatformReport::class, 'appointment_id');
    }
}
