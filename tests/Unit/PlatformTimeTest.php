<?php

namespace Tests\Unit;

use App\Support\PlatformTime;
use Carbon\Carbon;
use Tests\TestCase;

class PlatformTimeTest extends TestCase
{
    public function test_business_timezone_returns_configured_timezone(): void
    {
        $this->assertEquals('Asia/Tashkent', PlatformTime::businessTimezone());
    }

    public function test_now_returns_utc_carbon(): void
    {
        $now = PlatformTime::now();

        $this->assertInstanceOf(Carbon::class, $now);
        $this->assertEquals('UTC', $now->timezoneName);
    }

    public function test_local_now_returns_business_timezone_carbon(): void
    {
        $localNow = PlatformTime::localNow();

        $this->assertInstanceOf(Carbon::class, $localNow);
        $this->assertEquals('Asia/Tashkent', $localNow->timezoneName);
    }

    public function test_parse_local_handles_naive_strings_as_business_timezone(): void
    {
        $parsed = PlatformTime::parseLocal('2026-09-10 14:30:00');

        $this->assertEquals('Asia/Tashkent', $parsed->timezoneName);
        $this->assertEquals('2026-09-10 14:30:00', $parsed->format('Y-m-d H:i:s'));
    }

    public function test_parse_local_handles_utc_zulu_string(): void
    {
        // 09:30 UTC is 14:30 in Tashkent (UTC+5)
        $parsed = PlatformTime::parseLocal('2026-09-10T09:30:00Z');

        $this->assertEquals('Asia/Tashkent', $parsed->timezoneName);
        $this->assertEquals('2026-09-10 14:30:00', $parsed->format('Y-m-d H:i:s'));
    }

    public function test_to_utc_converts_naive_business_timezone_strings_to_utc(): void
    {
        // 14:30 in Tashkent should be 09:30 in UTC
        $utc = PlatformTime::toUtc('2026-09-10 14:30:00');

        $this->assertEquals('UTC', $utc->timezoneName);
        $this->assertEquals('2026-09-10 09:30:00', $utc->format('Y-m-d H:i:s'));
    }

    public function test_to_utc_preserves_utc_carbon_instances(): void
    {
        $carbonUtc = Carbon::parse('2026-09-10 09:30:00', 'UTC');
        $utc = PlatformTime::toUtc($carbonUtc);

        $this->assertEquals('UTC', $utc->timezoneName);
        $this->assertEquals('2026-09-10 09:30:00', $utc->format('Y-m-d H:i:s'));
    }

    public function test_to_local_converts_utc_to_business_timezone(): void
    {
        $carbonUtc = Carbon::parse('2026-09-10 09:30:00', 'UTC');
        $local = PlatformTime::toLocal($carbonUtc);

        $this->assertEquals('Asia/Tashkent', $local->timezoneName);
        $this->assertEquals('2026-09-10 14:30:00', $local->format('Y-m-d H:i:s'));
    }

    public function test_local_day_range_in_utc_computes_exact_boundaries(): void
    {
        // A full day in Tashkent (2026-09-10 00:00:00 to 23:59:59)
        // In UTC: 2026-09-09 19:00:00 to 2026-09-10 18:59:59
        $range = PlatformTime::localDayRangeInUtc('2026-09-10');

        $this->assertEquals('2026-09-09 19:00:00', $range[0]->format('Y-m-d H:i:s'));
        $this->assertEquals('2026-09-10 18:59:59', $range[1]->format('Y-m-d H:i:s'));
        $this->assertEquals('UTC', $range[0]->timezoneName);
        $this->assertEquals('UTC', $range[1]->timezoneName);

        // Named keys also supported
        $this->assertEquals($range[0], $range['start']);
        $this->assertEquals($range[1], $range['end']);
    }

    public function test_to_iso_zulu_formats_valid_zulu_string(): void
    {
        $zulu = PlatformTime::toIsoZulu('2026-09-10 14:30:00');

        $this->assertStringEndsWith('Z', $zulu);
        $this->assertStringContainsString('2026-09-10T09:30:00', $zulu);
    }
}
