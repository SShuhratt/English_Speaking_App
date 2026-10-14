<?php

namespace Tests\Unit\Services;

use App\Services\ReceiptOcrService;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ReceiptOcrServiceTest extends TestCase
{
    protected ReceiptOcrService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(ReceiptOcrService::class);
    }

    public function test_it_parses_text_receipt_from_click(): void
    {
        $text = "To'lov muvaffaqiyatli: 150 000 UZS. Karta: *6751. Vaqt: 21:42. Sana: 12.10.2026. CLICK P2P";
        $parsed = $this->service->parseText($text);

        $this->assertNotNull($parsed);
        $this->assertTrue($parsed['is_payment_receipt']);
        $this->assertSame(150000, $parsed['amount']);
        $this->assertSame('6751', $parsed['card_last_digits']);
        $this->assertSame('21:42', $parsed['time']);
        $this->assertSame('12.10.2026', $parsed['date']);
        $this->assertSame('Click', $parsed['provider']);
    }

    public function test_it_parses_text_receipt_from_payme(): void
    {
        $text = "O'tkazma muvaffaqiyatli amalga oshirildi\nSumma: 200 000 so'm\nKarta: *6751\nVaqt: 14:15\nSana: 12.10.2026\nPAYME";
        $parsed = $this->service->parseText($text);

        $this->assertNotNull($parsed);
        $this->assertSame(200000, $parsed['amount']);
        $this->assertSame('6751', $parsed['card_last_digits']);
        $this->assertSame('14:15', $parsed['time']);
        $this->assertSame('Payme', $parsed['provider']);
    }

    public function test_it_rejects_unrelated_text(): void
    {
        $parsed = $this->service->parseText('Salom, dars vaqtini o\'zgartira olamizmi?');
        $this->assertNull($parsed);
    }

    public function test_it_parses_image_receipt_using_gemini_api(): void
    {
        Config::set('services.gemini.api_key', 'test-api-key');
        Config::set('services.gemini.model', 'gemini-3.5-flash');

        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'is_payment_receipt' => true,
                                        'amount' => 100000,
                                        'card_last_digits' => '6751',
                                        'time' => '18:30',
                                        'date' => '12.10.2026',
                                        'provider' => 'Click',
                                        'transaction_id' => 'CHK-123456',
                                    ]),
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $dummyImage = 'fake-image-binary-data';
        $parsed = $this->service->parseImage($dummyImage, 'image/jpeg');

        $this->assertNotNull($parsed);
        $this->assertTrue($parsed['is_payment_receipt']);
        $this->assertSame(100000, $parsed['amount']);
        $this->assertSame('6751', $parsed['card_last_digits']);
        $this->assertSame('18:30', $parsed['time']);
        $this->assertSame('Click', $parsed['provider']);
    }

    public function test_it_handles_non_receipt_image_from_gemini(): void
    {
        Config::set('services.gemini.api_key', 'test-api-key');

        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'is_payment_receipt' => false,
                                        'amount' => 0,
                                        'card_last_digits' => null,
                                        'time' => null,
                                    ]),
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $parsed = $this->service->parseImage('fake-selfie-image', 'image/jpeg');
        $this->assertNull($parsed);
    }
}
