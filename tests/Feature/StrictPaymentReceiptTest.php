<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\HumoTransaction;
use App\Models\User;
use App\Services\HumoPaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class StrictPaymentReceiptTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Config::set('services.humo.card_last_digits', '6751');
    }

    public function test_incoming_sms_does_not_blindly_autoconfirm_appointment_without_receipt(): void
    {
        $teacher = User::factory()->teacher()->create();
        $pupil = User::factory()->pupil()->create();

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addHour(),
            'status' => 'accepted',
            'payment_status' => 'verifying',
            'price' => 150000,
            'receipt_path' => null,
            'receipt_data' => null,
        ]);

        $humoService = app(HumoPaymentService::class);

        $smsText = '➕ 150.000,00 UZS; HUMOCARD *6751; 📍 Click P2P; 🕓 14:30 15.10.2026; Qoldiq: 1.500.000,00 UZS';
        $result = $humoService->process($smsText);

        // Transaction should be recorded, but appointment should NOT be confirmed without receipt
        $this->assertEquals('accepted', $appointment->fresh()->status);
        $this->assertEquals('verifying', $appointment->fresh()->payment_status);

        $tx = HumoTransaction::where('amount', 150000)->first();
        $this->assertNotNull($tx);
        $this->assertEquals('unmatched', $tx->status);

        // Now, pupil uploads the check with matching receipt data
        $claimResult = $humoService->claimWithReceipt($pupil, [
            'is_payment_receipt' => true,
            'amount' => 150000,
            'time' => '14:30',
        ], $appointment->id);

        $this->assertEquals('confirmed', $claimResult['status']);
        $this->assertEquals('confirmed', $appointment->fresh()->status);
        $this->assertEquals('paid', $appointment->fresh()->payment_status);
        $this->assertEquals('matched', $tx->fresh()->status);
    }
}
