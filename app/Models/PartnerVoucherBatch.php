<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PartnerVoucherBatch extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'partner_organization_id',
        'title',
        'bundle_type',
        'lesson_duration_minutes',
        'max_lesson_price_uzs',
        'unit_face_value_uzs',
        'wholesale_discount_percent',
        'unit_wholesale_price_uzs',
        'quantity',
        'total_paid_upfront_uzs',
        'payment_status',
        'paid_at',
        'valid_until',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'lesson_duration_minutes' => 'integer',
            'max_lesson_price_uzs' => 'integer',
            'unit_face_value_uzs' => 'integer',
            'wholesale_discount_percent' => 'integer',
            'unit_wholesale_price_uzs' => 'integer',
            'quantity' => 'integer',
            'total_paid_upfront_uzs' => 'integer',
            'paid_at' => 'datetime',
            'valid_until' => 'datetime',
        ];
    }

    public function partnerOrganization(): BelongsTo
    {
        return $this->belongsTo(PartnerOrganization::class, 'partner_organization_id');
    }

    public function vouchers(): HasMany
    {
        return $this->hasMany(PartnerVoucher::class, 'batch_id');
    }

    public function isPaidAndValid(): bool
    {
        return $this->payment_status === 'paid' && $this->valid_until !== null && $this->valid_until->isFuture();
    }
}
