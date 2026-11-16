<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PartnerPayout extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'partner_organization_id',
        'period_year',
        'period_month',
        'period_start',
        'period_end',
        'total_lessons_count',
        'total_net_cash_gmv',
        'total_commission_amount',
        'didox_document_id',
        'payment_reference',
        'status',
        'paid_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'period_year' => 'integer',
            'period_month' => 'integer',
            'period_start' => 'date',
            'period_end' => 'date',
            'total_lessons_count' => 'integer',
            'total_net_cash_gmv' => 'integer',
            'total_commission_amount' => 'integer',
            'paid_at' => 'datetime',
        ];
    }

    public function partnerOrganization(): BelongsTo
    {
        return $this->belongsTo(PartnerOrganization::class, 'partner_organization_id');
    }

    public function commissionEntries(): HasMany
    {
        return $this->hasMany(PartnerCommissionEntry::class, 'payout_id');
    }
}
