<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerCommissionEntry extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'partner_organization_id',
        'pupil_id',
        'teacher_id',
        'appointment_id',
        'pupil_package_id',
        'partner_pass_id',
        'payout_id',
        'entry_source',
        'meeting_started',
        'gross_lesson_value',
        'gateway_fee_bps',
        'gateway_fee_amount',
        'net_cash_basis',
        'teacher_rate_bps',
        'teacher_amount',
        'platform_rate_bps',
        'platform_amount',
        'partner_rate_bps',
        'partner_amount',
        'status',
        'accrued_at',
        'voided_at',
        'void_reason',
    ];

    protected function casts(): array
    {
        return [
            'meeting_started' => 'boolean',
            'gross_lesson_value' => 'integer',
            'gateway_fee_bps' => 'integer',
            'gateway_fee_amount' => 'integer',
            'net_cash_basis' => 'integer',
            'teacher_rate_bps' => 'integer',
            'teacher_amount' => 'integer',
            'platform_rate_bps' => 'integer',
            'platform_amount' => 'integer',
            'partner_rate_bps' => 'integer',
            'partner_amount' => 'integer',
            'accrued_at' => 'datetime',
            'voided_at' => 'datetime',
        ];
    }

    public function partnerOrganization(): BelongsTo
    {
        return $this->belongsTo(PartnerOrganization::class, 'partner_organization_id');
    }

    public function pupil(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pupil_id');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'appointment_id');
    }

    public function pupilPackage(): BelongsTo
    {
        return $this->belongsTo(PupilPackage::class, 'pupil_package_id');
    }

    public function partnerPass(): BelongsTo
    {
        return $this->belongsTo(PartnerPass::class, 'partner_pass_id');
    }

    public function payout(): BelongsTo
    {
        return $this->belongsTo(PartnerPayout::class, 'payout_id');
    }
}
