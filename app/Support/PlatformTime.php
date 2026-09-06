<?php

namespace App\Support;

use Carbon\Carbon;
use DateTimeInterface;

class PlatformTime
{
    /**
     * Get the configured business timezone for the platform.
     */
    public static function businessTimezone(): string
    {
        return config('app.business_timezone', 'Asia/Tashkent');
    }

    /**
     * Get the current time in UTC (for all DB queries and internal timestamp storage).
     */
    public static function now(): Carbon
    {
        return Carbon::now('UTC');
    }

    /**
     * Get the current time in the platform's business timezone (Asia/Tashkent).
     */
    public static function localNow(): Carbon
    {
        return Carbon::now(static::businessTimezone());
    }

    /**
     * Parse any datetime representation into a Carbon instance in the business timezone.
     */
    public static function parseLocal(string|DateTimeInterface|null $datetime): ?Carbon
    {
        if (empty($datetime)) {
            return null;
        }

        if ($datetime instanceof Carbon) {
            return $datetime->copy()->setTimezone(static::businessTimezone());
        }

        if ($datetime instanceof DateTimeInterface) {
            return Carbon::instance($datetime)->setTimezone(static::businessTimezone());
        }

        $str = trim((string) $datetime);

        // If string contains explicit UTC/Z or timezone offset (+05:00, -04:00)
        if (preg_match('/(Z|[+-]\d{2}(?::?\d{2})?)$/i', $str)) {
            return Carbon::parse($str)->setTimezone(static::businessTimezone());
        }

        // Otherwise interpret as local business timezone
        return Carbon::parse($str, static::businessTimezone());
    }

    /**
     * Convert any datetime representation cleanly to UTC.
     */
    public static function toUtc(string|DateTimeInterface|null $datetime): ?Carbon
    {
        if (empty($datetime)) {
            return null;
        }

        if ($datetime instanceof Carbon) {
            return $datetime->copy()->utc();
        }

        if ($datetime instanceof DateTimeInterface) {
            return Carbon::instance($datetime)->utc();
        }

        $str = trim((string) $datetime);

        // If string has an explicit timezone or Zulu indicator, parse as-is and convert to UTC
        if (preg_match('/(Z|[+-]\d{2}(?::?\d{2})?)$/i', $str)) {
            return Carbon::parse($str)->utc();
        }

        // Otherwise assume it was specified in the business timezone and convert to UTC
        return Carbon::parse($str, static::businessTimezone())->utc();
    }

    /**
     * Convert any datetime representation to the business timezone.
     */
    public static function toLocal(string|DateTimeInterface|null $datetime): ?Carbon
    {
        return static::parseLocal($datetime);
    }

    /**
     * Calculate the exact UTC range [startOfDay, endOfDay] for a local business calendar day.
     *
     * @return array{0: Carbon, 1: Carbon}
     */
    public static function localDayRangeInUtc(string|DateTimeInterface $date): array
    {
        $local = static::parseLocal($date);

        $startUtc = $local->copy()->startOfDay()->utc();
        $endUtc = $local->copy()->endOfDay()->utc();

        return [
            0 => $startUtc,
            1 => $endUtc,
            'start' => $startUtc,
            'end' => $endUtc,
        ];
    }

    /**
     * Format a datetime as a standardized ISO 8601 Zulu string.
     */
    public static function toIsoZulu(string|DateTimeInterface|null $datetime): ?string
    {
        if (empty($datetime)) {
            return null;
        }

        return static::toUtc($datetime)?->toISOString();
    }
}
