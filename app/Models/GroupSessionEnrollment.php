<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class GroupSessionEnrollment extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'group_session_id',
        'pupil_id',
        'status',
        'payment_status',
        'payment_rejection_reason',
        'price_paid',
        'gross_amount',
        'gateway_provider',
        'gateway_fee_bps',
        'gateway_fee_amount',
        'net_cash_amount',
        'receipt_path',
        'receipt_data',
        'reserved_until',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'price_paid' => 'integer',
            'gross_amount' => 'integer',
            'gateway_fee_bps' => 'integer',
            'gateway_fee_amount' => 'integer',
            'net_cash_amount' => 'integer',
            'receipt_data' => 'array',
            'reserved_until' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function groupSession(): BelongsTo
    {
        return $this->belongsTo(GroupSession::class, 'group_session_id');
    }

    public function pupil(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pupil_id');
    }

    public function partnerCommissionEntry(): HasOne
    {
        return $this->hasOne(PartnerCommissionEntry::class, 'group_session_enrollment_id');
    }
}
