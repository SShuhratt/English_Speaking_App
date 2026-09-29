<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserDiscountVoucher extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'voucher_code',
        'discount_percent',
        'xp_spent',
        'is_redeemed',
        'redeemed_at',
        'appointment_id',
    ];

    protected $casts = [
        'discount_percent' => 'integer',
        'xp_spent' => 'integer',
        'is_redeemed' => 'boolean',
        'redeemed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    /**
     * Scope: vouchers belonging to a user that have not been redeemed yet.
     */
    public function scopeUnusedForUser($query, string $userId): mixed
    {
        return $query->where('user_id', $userId)->where('is_redeemed', false);
    }

    /**
     * Look up an unused voucher by code for a specific user.
     */
    public static function findUnusedByCode(string $code, string $userId): ?self
    {
        return self::where('voucher_code', strtoupper(trim($code)))
            ->where('user_id', $userId)
            ->where('is_redeemed', false)
            ->first();
    }
}
