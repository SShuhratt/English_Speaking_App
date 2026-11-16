<?php

namespace App\Models;

use Database\Factories\PupilPackageFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PupilPackage extends Model
{
    /** @use HasFactory<PupilPackageFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'pupil_id',
        'teacher_id',
        'teacher_package_id',
        'package_title',
        'total_minutes',
        'remaining_minutes',
        'price_paid',
        'gross_amount',
        'gateway_provider',
        'gateway_fee_bps',
        'gateway_fee_amount',
        'net_cash_amount',
        'discount_voucher_id',
        'discount_amount',
        'payment_status',
        'payment_rejection_reason',
        'receipt_path',
        'receipt_data',
        'status',
    ];

    protected $casts = [
        'total_minutes' => 'integer',
        'remaining_minutes' => 'integer',
        'price_paid' => 'integer',
        'gross_amount' => 'integer',
        'gateway_fee_bps' => 'integer',
        'gateway_fee_amount' => 'integer',
        'net_cash_amount' => 'integer',
        'discount_amount' => 'integer',
        'receipt_data' => 'array',
    ];

    public function pupil(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pupil_id');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function teacherPackage(): BelongsTo
    {
        return $this->belongsTo(TeacherPackage::class, 'teacher_package_id');
    }

    public function discountVoucher(): BelongsTo
    {
        return $this->belongsTo(UserDiscountVoucher::class, 'discount_voucher_id');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'pupil_package_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active')
            ->where('payment_status', 'paid')
            ->where('remaining_minutes', '>', 0);
    }

    public function scopeForPupilAndTeacher($query, string $pupilId, string $teacherId)
    {
        return $query->where('pupil_id', $pupilId)->where('teacher_id', $teacherId);
    }
}
