<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OffPlatformReport extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'appointment_id',
        'pupil_id',
        'teacher_id',
        'reported_contact',
        'description',
        'status',
        'admin_notes',
        'reviewed_by',
        'rewarded_voucher_id',
    ];

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function pupil(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pupil_id');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function rewardedVoucher(): BelongsTo
    {
        return $this->belongsTo(UserDiscountVoucher::class, 'rewarded_voucher_id');
    }
}
