<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\PupilPackage;
use App\Models\TeacherPackage;
use App\Models\User;
use App\Services\Telegram\TelegramService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SmartPaymentLinkTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Config::set('services.humo.card_number', '9860260111956751');
        Config::set('services.telegram.bot_username', 'ConvomateAdminBot');
        Cache::flush();
    }

    public function test_smart_payment_page_loads_for_accepted_booking(): void
    {
        $teacher = User::factory()->teacher()->create(['full_name' => 'John Teacher']);
        $pupil = User::factory()->pupil()->create(['full_name' => 'Jane Pupil']);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addHour(),
            'status' => 'accepted',
            'payment_status' => 'verifying',
            'price' => 150000,
        ]);

        $response = $this->get(route('payment.show', ['type' => 'booking', 'id' => $appointment->id, 'app' => 'click']));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('pay/index')
            ->has('item', fn (Assert $item) => $item
                ->where('type', 'booking')
                ->where('id', $appointment->id)
                ->where('teacher_name', 'John Teacher')
                ->where('amount', 150000)
                ->where('state', 'pending_payment')
                ->etc()
            )
            ->where('selected_app', 'click')
            ->where('payment.card_number', '9860260111956751')
            ->has('payment.qr_svg')
        );
    }

    public function test_payment_qr_endpoint_returns_svg_image(): void
    {
        $teacher = User::factory()->teacher()->create();
        $pupil = User::factory()->pupil()->create();

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addHour(),
            'status' => 'accepted',
            'price' => 100000,
        ]);

        $response = $this->get(route('payment.qr', ['type' => 'booking', 'id' => $appointment->id]));

        $response->assertOk();
        $response->assertHeader('Content-Type', 'image/svg+xml');
        $this->assertStringContainsString('<svg', $response->getContent());
    }

    public function test_payment_qr_endpoint_fails_for_nonexistent_booking(): void
    {
        $response = $this->get(route('payment.qr', ['type' => 'booking', 'id' => Str::uuid()->toString()]));
        $response->assertNotFound();
    }

    public function test_smart_payment_page_shows_already_paid_state(): void
    {
        $teacher = User::factory()->teacher()->create();
        $pupil = User::factory()->pupil()->create();

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addHour(),
            'status' => 'confirmed',
            'payment_status' => 'paid',
            'price' => 150000,
        ]);

        $response = $this->get(route('payment.show', ['type' => 'booking', 'id' => $appointment->id]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('pay/index')
            ->where('item.state', 'already_paid')
        );
    }

    public function test_smart_payment_page_loads_for_package(): void
    {
        $teacher = User::factory()->teacher()->create();
        $pupil = User::factory()->pupil()->create();

        $teacherPackage = TeacherPackage::create([
            'teacher_id' => $teacher->id,
            'title' => '10 Lessons Master Pack',
            'total_hours' => 10,
            'total_minutes' => 600,
            'price' => 900000,
            'is_active' => true,
        ]);

        $pupilPackage = PupilPackage::create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'teacher_package_id' => $teacherPackage->id,
            'package_title' => '10 Lessons Master Pack',
            'total_minutes' => 600,
            'remaining_minutes' => 600,
            'price_paid' => 900000,
            'payment_status' => 'verifying',
            'status' => 'pending',
        ]);

        $response = $this->get(route('payment.show', ['type' => 'package', 'id' => $pupilPackage->id, 'app' => 'payme']));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('pay/index')
            ->where('item.type', 'package')
            ->where('item.amount', 900000)
            ->where('selected_app', 'payme')
        );
    }

    public function test_send_telegram_link_dispatches_message_and_throttles(): void
    {
        $pupil = User::factory()->pupil()->create([
            'telegram_chat_id' => '998877665',
        ]);
        $teacher = User::factory()->teacher()->create();

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addHour(),
            'status' => 'accepted',
            'price' => 120000,
        ]);

        $mockTelegram = $this->mock(TelegramService::class);
        $mockTelegram->shouldReceive('sendMessage')
            ->once()
            ->withArgs(function ($chatId, $text, $replyMarkup) {
                return $chatId === '998877665'
                    && str_contains($text, '120 000')
                    && isset($replyMarkup['inline_keyboard']);
            })
            ->andReturn(true);

        // First call sends
        $response = $this->actingAs($pupil)->postJson(route('pupil.bookings.send-telegram-link', $appointment->id));
        $response->assertOk();
        $response->assertJson(['sent' => true]);

        // Second call is throttled
        $response2 = $this->actingAs($pupil)->postJson(route('pupil.bookings.send-telegram-link', $appointment->id));
        $response2->assertOk();
        $response2->assertJson(['sent' => true, 'throttled' => true]);
    }

    public function test_telegram_webhook_accepts_document_receipt(): void
    {
        $pupil = User::factory()->pupil()->create([
            'telegram_chat_id' => '11223344',
        ]);
        $teacher = User::factory()->teacher()->create();

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addHour(),
            'status' => 'accepted',
            'payment_status' => 'verifying',
            'price' => 80000,
        ]);

        $mockTelegram = $this->mock(TelegramService::class);
        $mockTelegram->shouldReceive('downloadFile')
            ->with('doc_file_id_999')
            ->andReturn('dummy_pdf_content');

        $mockTelegram->shouldReceive('sendMessage')
            ->once()
            ->andReturn(true);

        $payload = [
            'message' => [
                'chat' => ['id' => 11223344],
                'from' => ['username' => 'pupiltest'],
                'document' => [
                    'file_id' => 'doc_file_id_999',
                    'file_name' => 'receipt.pdf',
                    'mime_type' => 'application/pdf',
                ],
            ],
        ];

        $response = $this->postJson('/api/telegram/webhook', $payload);
        $response->assertOk();
        $response->assertJson(['ok' => true]);
    }
}
