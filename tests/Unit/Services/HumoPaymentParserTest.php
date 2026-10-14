<?php

namespace Tests\Unit\Services;

use App\Services\HumoPaymentService;
use Tests\TestCase;

class HumoPaymentParserTest extends TestCase
{
    protected HumoPaymentService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(HumoPaymentService::class);
    }

    public function test_it_parses_valid_humo_topup_notification_with_thousands_period(): void
    {
        $message = "🎉 To'ldirish\n➕ 1.000,00 UZS\n📍 PAYNET P2P HUM2HUM>T\n💳 HUMOCARD *4458\n🕓 18:17 12.10.2026";

        $parsed = $this->service->parse($message);

        $this->assertNotNull($parsed);
        $this->assertSame(1000, $parsed['amount']);
        $this->assertSame('4458', $parsed['card']);
        $this->assertSame('PAYNET P2P HUM2HUM>T', $parsed['channel']);
        $this->assertSame('18:17 12.10.2026', $parsed['timestamp']);
        $this->assertNotEmpty($parsed['hash']);
    }

    public function test_it_parses_large_amount_topup(): void
    {
        $message = "🎉 To'ldirish\n➕ 150.000,00 UZS\n📍 CLICK P2P\n💳 HUMOCARD *4458\n🕓 19:30 12.10.2026";

        $parsed = $this->service->parse($message);

        $this->assertNotNull($parsed);
        $this->assertSame(150000, $parsed['amount']);
        $this->assertSame('4458', $parsed['card']);
        $this->assertSame('CLICK P2P', $parsed['channel']);
    }

    public function test_it_parses_millions_amount_topup(): void
    {
        $message = "🎉 To'ldirish\n➕ 1.250.000,00 UZS\n📍 PAYME P2P\n💳 HUMOCARD *4458\n🕓 12:00 12.10.2026";

        $parsed = $this->service->parse($message);

        $this->assertNotNull($parsed);
        $this->assertSame(1250000, $parsed['amount']);
    }

    public function test_it_rejects_outgoing_transactions(): void
    {
        $message = "💸 To'lov\n➖ 50.000,00 UZS\n📍 KORZINKA\n💳 HUMOCARD *4458\n🕓 18:20 12.10.2026";

        $parsed = $this->service->parse($message);

        $this->assertNull($parsed);
    }

    public function test_it_rejects_unrelated_messages(): void
    {
        $parsed = $this->service->parse('Hello, how are you?');
        $this->assertNull($parsed);
    }
}
