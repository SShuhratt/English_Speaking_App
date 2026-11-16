<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PartnerPassBatch extends Model
{
    use HasUuids;

    protected $fillable = [
        'partner_organization_id',
        'title',
        'duration_days',
        'unit_retail_price_uzs',
        'unit_wholesale_price_uzs',
        'quantity',
        'total_paid_upfront_uzs',
        'payment_status',
        'paid_at',
        'notes',
    ];

    protected $casts = [
        'duration_days' => 'integer',
        'unit_retail_price_uzs' => 'integer',
        'unit_wholesale_price_uzs' => 'integer',
        'quantity' => 'integer',
        'total_paid_upfront_uzs' => 'integer',
        'paid_at' => 'datetime',
    ];

    public function partnerOrganization(): BelongsTo
    {
        return $this->belongsTo(PartnerOrganization::class);
    }

    public function passes(): HasMany
    {
        return $this->hasMany(PartnerPass::class, 'batch_id');
    }
}
