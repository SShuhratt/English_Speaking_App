<?php

namespace Tests\Feature;

use App\Services\ReceiptOcrService;
use Tests\TestCase;

class ReceiptOcrServiceTest extends TestCase
{
    public function test_parses_paynet_receipt_with_promotional_limits_correctly(): void
    {
        $rawPaynetText = <<<'TEXT'
paynet
Komissiyasiz o‘tkazmalar
Oyiga 3 000 000 so‘mgacha

Operatsiya bajarildi

5 000 so‘m
15-oktabr, 2026 15:03
Tranzaksiya raqami

100414040900
Karta orqali to’landi

**** **** **** 6316
Yuboruvchining F.I.SH

SHUHRAT ODILBEKOV
Kartaga o’tkazildi

**** **** **** 6751
Qabul qiluvchining F.I.SH

SHUHRAT O
Qabul qiluvchi oladi

5 000 so‘m
Komissiya

0 so‘m
Terminal

08651UKT
Xizmat

SHUHRAT O
TEXT;

        $ocr = app(ReceiptOcrService::class);
        $result = $ocr->parseText($rawPaynetText);

        $this->assertNotNull($result);
        $this->assertTrue($result['is_payment_receipt']);
        $this->assertEquals(5000, $result['amount'], 'Should extract the actual 5 000 UZS transfer, NOT the 3 000 000 marketing limit');
        $this->assertEquals('6751', $result['card_last_digits'], 'Should extract destination card 6751, NOT sender card 6316');
        $this->assertEquals('15:03', $result['time']);
        $this->assertEquals('Paynet', $result['provider']);
    }

    public function test_parses_click_receipt_text_correctly(): void
    {
        $clickText = <<<'TEXT'
CLICK to'lovi muvaffaqiyatli amalga oshirildi
Summa: 150 000 so'm
Karta: *6751
Vaqt: 18:45 12.10.2026
Tranzaksiya: 994821
TEXT;

        $ocr = app(ReceiptOcrService::class);
        $result = $ocr->parseText($clickText);

        $this->assertNotNull($result);
        $this->assertEquals(150000, $result['amount']);
        $this->assertEquals('6751', $result['card_last_digits']);
        $this->assertEquals('18:45', $result['time']);
        $this->assertEquals('Click', $result['provider']);
    }
}
