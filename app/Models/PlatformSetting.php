<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformSetting extends Model
{
    protected $primaryKey = 'key';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'key',
        'value',
        'type',
        'updated_by',
    ];

    public static function getInt(string $key, int $default): int
    {
        try {
            $record = static::find($key);
            if (! $record || $record->value === null || $record->value === '') {
                return $default;
            }

            return (int) $record->value;
        } catch (\Throwable) {
            return $default;
        }
    }

    public static function setValue(string $key, mixed $value, string $type = 'integer', ?string $updatedBy = null): self
    {
        return static::updateOrCreate(
            ['key' => $key],
            [
                'value' => $value === null ? null : (string) $value,
                'type' => $type,
                'updated_by' => $updatedBy,
            ],
        );
    }

    /**
     * Resolve effective Track B1 & P2P quota configuration (DB overrides config/monetization.php).
     *
     * @return array{
     *     partner_pass_b2c_price_uzs: int,
     *     partner_pass_b2b_default_price_uzs: int,
     *     partner_pass_b2b_min_price_uzs: int,
     *     partner_pass_default_days: int,
     *     p2p_free_daily_minutes: int,
     *     p2p_attributed_daily_minutes: int,
     * }
     */
    public static function monetizationConfig(): array
    {
        return [
            'partner_pass_b2c_price_uzs' => static::getInt(
                'partner_pass_b2c_price_uzs',
                (int) config('monetization.partner_pass.b2c_price_uzs', 30000),
            ),
            'partner_pass_b2b_default_price_uzs' => static::getInt(
                'partner_pass_b2b_default_price_uzs',
                (int) config('monetization.partner_pass.b2b_default_price_uzs', 25000),
            ),
            'partner_pass_b2b_min_price_uzs' => static::getInt(
                'partner_pass_b2b_min_price_uzs',
                (int) config('monetization.partner_pass.b2b_min_price_uzs', 20000),
            ),
            'partner_pass_default_days' => static::getInt(
                'partner_pass_default_days',
                (int) config('monetization.partner_pass.default_days', 30),
            ),
            'p2p_free_daily_minutes' => static::getInt(
                'p2p_free_daily_minutes',
                (int) config('monetization.p2p_quota.free_daily_minutes', 60),
            ),
            'p2p_attributed_daily_minutes' => static::getInt(
                'p2p_attributed_daily_minutes',
                (int) config('monetization.p2p_quota.attributed_daily_minutes', 120),
            ),
        ];
    }
}
