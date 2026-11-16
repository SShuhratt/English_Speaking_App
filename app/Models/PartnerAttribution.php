<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerAttribution extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'partner_organization_id',
        'pupil_id',
        'attribution_source',
        'partner_code_used',
        'attributed_at',
    ];

    protected function casts(): array
    {
        return [
            'attributed_at' => 'datetime',
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
}
