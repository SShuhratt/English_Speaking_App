<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PartnerOrganization extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'legal_name',
        'legal_type',
        'inn_stir',
        'bank_account',
        'bank_mfo',
        'bank_name',
        'contact_phone',
        'contact_email',
        'director_user_id',
        'partner_code',
        'commission_rate_bps',
        'contract_number',
        'contract_signed_at',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'commission_rate_bps' => 'integer',
            'contract_signed_at' => 'date',
        ];
    }

    public function director(): BelongsTo
    {
        return $this->belongsTo(User::class, 'director_user_id');
    }

    public function staffMemberships(): HasMany
    {
        return $this->hasMany(PartnerOrganizationUser::class, 'partner_organization_id');
    }

    public function staffUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'partner_organization_users')
            ->withPivot(['id', 'staff_role', 'is_active'])
            ->withTimestamps();
    }

    public function attributions(): HasMany
    {
        return $this->hasMany(PartnerAttribution::class, 'partner_organization_id');
    }

    public function voucherBatches(): HasMany
    {
        return $this->hasMany(PartnerVoucherBatch::class, 'partner_organization_id');
    }

    public function vouchers(): HasMany
    {
        return $this->hasMany(PartnerVoucher::class, 'partner_organization_id');
    }

    public function commissionEntries(): HasMany
    {
        return $this->hasMany(PartnerCommissionEntry::class, 'partner_organization_id');
    }

    public function payouts(): HasMany
    {
        return $this->hasMany(PartnerPayout::class, 'partner_organization_id');
    }

    public function passBatches(): HasMany
    {
        return $this->hasMany(PartnerPassBatch::class, 'partner_organization_id');
    }

    public function passes(): HasMany
    {
        return $this->hasMany(PartnerPass::class, 'partner_organization_id');
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
