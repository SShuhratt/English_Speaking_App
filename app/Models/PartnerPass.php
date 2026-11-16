<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class PartnerPass extends Model
{
    use HasUuids;

    protected $fillable = [
        'batch_id',
        'partner_organization_id',
        'user_id',
        'activation_code',
        'source',
        'duration_days',
        'gross_amount',
        'gateway_provider',
        'gateway_fee_bps',
        'gateway_fee_amount',
        'net_cash_amount',
        'payment_status',
        'receipt_path',
        'receipt_data',
        'status',
        'activated_at',
        'expires_at',
    ];

    protected $casts = [
        'duration_days' => 'integer',
        'gross_amount' => 'integer',
        'gateway_fee_bps' => 'integer',
        'gateway_fee_amount' => 'integer',
        'net_cash_amount' => 'integer',
        'receipt_data' => 'array',
        'activated_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function batch(): BelongsTo
    {
        return $this->belongsTo(PartnerPassBatch::class, 'batch_id');
    }

    public function partnerOrganization(): BelongsTo
    {
        return $this->belongsTo(PartnerOrganization::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function commissionEntry(): HasOne
    {
        return $this->hasOne(PartnerCommissionEntry::class, 'partner_pass_id');
    }

    public function isCurrentlyActive(): bool
    {
        return $this->status === 'active'
            && $this->expires_at !== null
            && $this->expires_at->isFuture();
    }
}
