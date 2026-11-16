<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerVoucher extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'batch_id',
        'partner_organization_id',
        'code',
        'claimed_by_user_id',
        'claimed_at',
        'redeemed_appointment_id',
        'redeemed_at',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'claimed_at' => 'datetime',
            'redeemed_at' => 'datetime',
        ];
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(PartnerVoucherBatch::class, 'batch_id');
    }

    public function partnerOrganization(): BelongsTo
    {
        return $this->belongsTo(PartnerOrganization::class, 'partner_organization_id');
    }

    public function claimedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'claimed_by_user_id');
    }

    public function redeemedAppointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'redeemed_appointment_id');
    }
}
