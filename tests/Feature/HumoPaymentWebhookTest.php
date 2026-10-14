<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\PupilPackage;
use App\Models\TeacherPackage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class HumoPaymentWebhookTest extends TestCase
{
    use RefreshDatabase;

    protected string $secret = 'test-humo-secret-key';

    protected function setUp(): void
    {
        parent::setUp();
        Config::set('services.humo.webhook_secret', $this->secret);
        Config::set('services.humo.card_last_digits', '4458');
        Cache::flush();
    }

    public function test_it_rejects_unauthorized_webhook_requests(): void
    {
        $response = $this->postJson('/api/webhooks/humo-payment', [
            'text' => "🎉 To'ldirish\n➕ 150.000,00 UZS\n📍 CLICK P2P\n💳 HUMOCARD *4458\n🕓 18:17 12.10.2026",
        ]);

        $response->assertStatus(401);
    }

    public function test_it_ignores_outgoing_or_invalid_messages(): void
    {
        $response = $this->withHeaders([
            'X-Humo-Secret' => $this->secret,
        ])->postJson('/api/webhooks/humo-payment', [
            'text' => "💸 To'lov\n➖ 50.000,00 UZS\n📍 KORZINKA\n💳 HUMOCARD *4458\n🕓 18:20 12.10.2026",
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'ignored',
            ]);
    }

    public function test_it_auto_confirms_pending_appointment_on_matching_payment(): void
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
        ]);

        $message = "🎉 To'ldirish\n➕ 150.000,00 UZS\n📍 CLICK P2P\n💳 HUMOCARD *4458\n🕓 18:17 12.10.2026";

        $response = $this->withHeaders([
            'X-Humo-Secret' => $this->secret,
        ])->postJson('/api/webhooks/humo-payment', [
            'text' => $message,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'matched_appointment',
                'amount' => 150000,
            ]);

        $appointment->refresh();
        $this->assertSame('confirmed', $appointment->status);
        $this->assertSame('paid', $appointment->payment_status);
    }

    public function test_it_auto_confirms_pending_pupil_package_on_matching_payment(): void
    {
        $teacher = User::factory()->teacher()->create();
        $pupil = User::factory()->pupil()->create();
        $tPackage = TeacherPackage::factory()->create([
            'teacher_id' => $teacher->id,
            'price' => 500000,
        ]);

        $package = PupilPackage::create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'teacher_package_id' => $tPackage->id,
            'package_title' => '5 Lessons Pack',
            'total_minutes' => 150,
            'remaining_minutes' => 150,
            'price_paid' => 500000,
            'payment_status' => 'verifying',
            'status' => 'pending',
        ]);

        $message = "🎉 To'ldirish\n➕ 500.000,00 UZS\n📍 PAYME P2P\n💳 HUMOCARD *4458\n🕓 18:25 12.10.2026";

        $response = $this->withHeaders([
            'X-Humo-Secret' => $this->secret,
        ])->postJson('/api/webhooks/humo-payment', [
            'text' => $message,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'matched_package',
                'amount' => 500000,
            ]);

        $package->refresh();
        $this->assertSame('paid', $package->payment_status);
        $this->assertSame('active', $package->status);
    }

    public function test_it_prevents_duplicate_processing_of_same_notification(): void
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
            'price' => 100000,
        ]);

        $message = "🎉 To'ldirish\n➕ 100.000,00 UZS\n📍 PAYNET P2P\n💳 HUMOCARD *4458\n🕓 18:30 12.10.2026";

        // First attempt -> matched
        $first = $this->withHeaders([
            'X-Humo-Secret' => $this->secret,
        ])->postJson('/api/webhooks/humo-payment', ['text' => $message]);

        $first->assertStatus(200)->assertJson(['status' => 'matched_appointment']);

        // Second attempt -> duplicate
        $second = $this->withHeaders([
            'X-Humo-Secret' => $this->secret,
        ])->postJson('/api/webhooks/humo-payment', ['text' => $message]);

        $second->assertStatus(200)->assertJson(['status' => 'duplicate']);
    }
}
