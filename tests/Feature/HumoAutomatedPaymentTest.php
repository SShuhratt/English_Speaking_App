<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\HumoTransaction;
use App\Models\PupilPackage;
use App\Models\TeacherPackage;
use App\Models\User;
use App\Services\HumoPaymentService;
use App\Services\ReceiptOcrService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class HumoAutomatedPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected HumoPaymentService $humoService;

    protected string $secret = 'test-humo-secret-key';

    protected function setUp(): void
    {
        parent::setUp();
        Config::set('services.humo.webhook_secret', $this->secret);
        Config::set('services.humo.card_last_digits', '6751');
        Cache::flush();

        $this->humoService = app(HumoPaymentService::class);
    }

    public function test_single_candidate_auto_confirms_immediately(): void
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
            'price' => 120000,
        ]);

        $humoMsg = "🎉 To'ldirish\n➕ 120.000,00 UZS\n📍 CLICK P2P\n💳 HUMOCARD *6751\n🕓 18:30 12.10.2026";
        $result = $this->humoService->process($humoMsg);

        $this->assertSame('matched_appointment', $result['status']);
        $this->assertSame('confirmed', $appointment->fresh()->status);
        $this->assertSame('paid', $appointment->fresh()->payment_status);

        $this->assertDatabaseHas('humo_transactions', [
            'amount' => 120000,
            'status' => 'matched',
            'matched_type' => 'appointment',
            'matched_id' => $appointment->id,
        ]);
    }

    public function test_multiple_candidates_same_amount_triggers_quarantine(): void
    {
        $teacher = User::factory()->teacher()->create();
        $pupil1 = User::factory()->pupil()->create();
        $pupil2 = User::factory()->pupil()->create();

        // 2 separate pupils book lessons with identical price 100 000 UZS
        $apt1 = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil1->id,
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addHour(),
            'status' => 'accepted',
            'payment_status' => 'verifying',
            'price' => 100000,
            'created_at' => now()->subMinutes(10),
        ]);

        $apt2 = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil2->id,
            'start_at' => now()->addDay()->addHours(2),
            'end_at' => now()->addDay()->addHours(3),
            'status' => 'accepted',
            'payment_status' => 'verifying',
            'price' => 100000,
            'created_at' => now()->subMinutes(5),
        ]);

        $humoMsg = "🎉 To'ldirish\n➕ 100.000,00 UZS\n📍 PAYME P2P\n💳 HUMOCARD *6751\n🕓 18:40 12.10.2026";
        $result = $this->humoService->process($humoMsg);

        // Crucial: Must NOT blindly confirm apt1!
        $this->assertSame('quarantined', $result['status']);
        $this->assertSame('verifying', $apt1->fresh()->payment_status);
        $this->assertSame('verifying', $apt2->fresh()->payment_status);

        $this->assertDatabaseHas('humo_transactions', [
            'amount' => 100000,
            'status' => 'quarantined',
        ]);
    }

    public function test_quarantined_payment_is_confirmed_for_the_pupil_who_provides_matching_receipt(): void
    {
        $teacher = User::factory()->teacher()->create();
        $pupil1 = User::factory()->pupil()->create();
        $pupil2 = User::factory()->pupil()->create();

        $apt1 = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil1->id,
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addHour(),
            'status' => 'accepted',
            'payment_status' => 'verifying',
            'price' => 100000,
            'created_at' => now()->subMinutes(10),
        ]);

        $apt2 = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil2->id,
            'start_at' => now()->addDay()->addHours(2),
            'end_at' => now()->addDay()->addHours(3),
            'status' => 'accepted',
            'payment_status' => 'verifying',
            'price' => 100000,
            'created_at' => now()->subMinutes(5),
        ]);

        // Humo transaction arrives and is quarantined
        $humoMsg = "🎉 To'ldirish\n➕ 100.000,00 UZS\n📍 PAYME P2P\n💳 HUMOCARD *6751\n🕓 18:40 12.10.2026";
        $this->humoService->process($humoMsg);

        // Mock Receipt OCR returning Pupil 2's receipt data (matching amount 100000 and time 18:41)
        $this->mock(ReceiptOcrService::class, function ($mock) {
            $mock->shouldReceive('parseText')->andReturn([
                'is_payment_receipt' => true,
                'amount' => 100000,
                'card_last_digits' => '6751',
                'time' => '18:41',
                'date' => '12.10.2026',
                'provider' => 'Payme',
            ]);
        });

        // Pupil 2 claims with their receipt
        $claimResult = $this->humoService->claimWithReceipt(
            pupil: $pupil2,
            receiptDataOrText: 'Payme transfer 100 000 UZS to *6751 at 18:41',
            appointmentId: $apt2->id
        );

        $this->assertSame('confirmed', $claimResult['status']);

        // Pupil 2 is confirmed!
        $this->assertSame('confirmed', $apt2->fresh()->status);
        $this->assertSame('paid', $apt2->fresh()->payment_status);

        // Pupil 1 remains unconfirmed!
        $this->assertSame('accepted', $apt1->fresh()->status);
        $this->assertSame('verifying', $apt1->fresh()->payment_status);

        // Transaction is now matched to apt2
        $this->assertDatabaseHas('humo_transactions', [
            'amount' => 100000,
            'status' => 'matched',
            'matched_type' => 'appointment',
            'matched_id' => $apt2->id,
        ]);
    }

    public function test_pupil_can_submit_receipt_before_bank_notification_arrives(): void
    {
        $teacher = User::factory()->teacher()->create();
        $pupil = User::factory()->pupil()->create();

        $apt = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addHour(),
            'status' => 'accepted',
            'payment_status' => 'verifying',
            'price' => 150000,
        ]);

        $this->mock(ReceiptOcrService::class, function ($mock) {
            $mock->shouldReceive('parseText')->andReturn([
                'is_payment_receipt' => true,
                'amount' => 150000,
                'card_last_digits' => '6751',
                'time' => '19:15',
                'date' => '12.10.2026',
                'provider' => 'Click',
            ]);
        });

        // 1. Pupil uploads receipt first (bank hasn't alerted yet)
        $claimResult = $this->humoService->claimWithReceipt(
            pupil: $pupil,
            receiptDataOrText: 'Click receipt 150 000 UZS',
            appointmentId: $apt->id
        );

        $this->assertSame('receipt_saved', $claimResult['status']);
        $this->assertSame('verifying', $apt->fresh()->payment_status);
        $this->assertNotNull($apt->fresh()->receipt_data);

        // 2. Bank notification arrives 1 minute later
        $humoMsg = "🎉 To'ldirish\n➕ 150.000,00 UZS\n📍 CLICK P2P\n💳 HUMOCARD *6751\n🕓 19:16 12.10.2026";
        $processResult = $this->humoService->process($humoMsg);

        $this->assertSame('matched_appointment', $processResult['status']);
        $this->assertSame('confirmed', $apt->fresh()->status);
        $this->assertSame('paid', $apt->fresh()->payment_status);
    }

    public function test_conversation_package_matches_and_activates_correctly(): void
    {
        $teacher = User::factory()->teacher()->create();
        $pupil = User::factory()->pupil()->create();
        $tPackage = TeacherPackage::factory()->create([
            'teacher_id' => $teacher->id,
            'price' => 450000,
        ]);

        $package = PupilPackage::create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'teacher_package_id' => $tPackage->id,
            'package_title' => 'Speaking Pack',
            'total_minutes' => 300,
            'remaining_minutes' => 300,
            'price_paid' => 450000,
            'payment_status' => 'verifying',
            'status' => 'pending',
        ]);

        $humoMsg = "🎉 To'ldirish\n➕ 450.000,00 UZS\n📍 CLICK P2P\n💳 HUMOCARD *6751\n🕓 19:30 12.10.2026";
        $result = $this->humoService->process($humoMsg);

        $this->assertSame('matched_package', $result['status']);
        $this->assertSame('paid', $package->fresh()->payment_status);
        $this->assertSame('active', $package->fresh()->status);
    }

    public function test_pupil_can_upload_receipt_via_web_route(): void
    {
        $teacher = User::factory()->teacher()->create();
        $pupil = User::factory()->pupil()->create();

        $apt = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addHour(),
            'status' => 'accepted',
            'payment_status' => 'verifying',
            'price' => 200000,
        ]);

        // Pre-existing quarantined Humo transaction
        HumoTransaction::create([
            'hash' => 'hash-test-200k',
            'amount' => 200000,
            'card_last_digits' => '6751',
            'channel' => 'CLICK P2P',
            'bank_timestamp' => '20:15 12.10.2026',
            'raw_text' => 'sample',
            'status' => 'quarantined',
        ]);

        $this->mock(ReceiptOcrService::class, function ($mock) {
            $mock->shouldReceive('parseText')->andReturn([
                'is_payment_receipt' => true,
                'amount' => 200000,
                'card_last_digits' => '6751',
                'time' => '20:15',
                'date' => '12.10.2026',
                'provider' => 'Click',
            ]);
        });

        $response = $this->actingAs($pupil)->post("/pupil/bookings/{$apt->id}/receipt", [
            'receipt_text' => 'Click transfer 200 000 UZS at 20:15',
        ]);

        $response->assertSessionHas('success');
        $this->assertSame('confirmed', $apt->fresh()->status);
        $this->assertSame('paid', $apt->fresh()->payment_status);
    }

    public function test_stranger_cannot_upload_receipt_for_another_pupil_booking(): void
    {
        $teacher = User::factory()->teacher()->create();
        $pupil = User::factory()->pupil()->create();
        $stranger = User::factory()->pupil()->create();

        $apt = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addHour(),
            'status' => 'accepted',
            'payment_status' => 'verifying',
            'price' => 150000,
        ]);

        $response = $this->actingAs($stranger)->post("/pupil/bookings/{$apt->id}/receipt", [
            'receipt_text' => 'Some text',
        ]);

        $response->assertStatus(403);
    }
}
