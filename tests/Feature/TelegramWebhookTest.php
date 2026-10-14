<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\HumoTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class TelegramWebhookTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Config::set('services.telegram.bot_token', 'test-bot-token');
        Http::fake([
            'https://api.telegram.org/*/getFile*' => Http::response([
                'ok' => true,
                'result' => ['file_path' => 'photos/test_check.jpg'],
            ], 200),
            'https://api.telegram.org/file/*' => Http::response('fake-binary-image-data', 200),
            'https://api.telegram.org/*' => Http::response(['ok' => true], 200),
        ]);
    }

    public function test_webhook_links_account_via_start_deep_link_token(): void
    {
        $user = User::factory()->create();
        $token = 'test-unique-token-123';
        Cache::put("telegram_link_token:{$token}", $user->id, now()->addMinutes(15));

        $payload = [
            'update_id' => 1001,
            'message' => [
                'message_id' => 1,
                'chat' => ['id' => 999111],
                'from' => ['id' => 999111, 'username' => 'testuser_tg'],
                'text' => "/start {$token}",
            ],
        ];

        $response = $this->postJson('/api/telegram/webhook', $payload);

        $response->assertOk()
            ->assertJson(['ok' => true]);

        $fresh = $user->fresh();
        $this->assertEquals('999111', $fresh->telegram_chat_id);
        $this->assertEquals('testuser_tg', $fresh->telegram_username);
    }

    public function test_webhook_prompts_welcome_and_magic_link_on_direct_start(): void
    {
        $payload = [
            'update_id' => 1002,
            'message' => [
                'message_id' => 2,
                'chat' => ['id' => 888222],
                'from' => ['id' => 888222, 'username' => 'newuser', 'language_code' => 'en'],
                'text' => '/start',
            ],
        ];

        $response = $this->postJson('/api/telegram/webhook', $payload);

        $response->assertOk()
            ->assertJson(['ok' => true]);

        Http::assertSent(function ($request) {
            return $request['chat_id'] === '888222'
                && str_contains($request['text'], 'Welcome to ConvoMate');
        });
    }

    public function test_webhook_links_account_via_6_digit_code(): void
    {
        $user = User::factory()->create();
        $code = '654321';
        Cache::put("telegram_pairing:{$code}", $user->id, now()->addMinutes(15));

        $payload = [
            'update_id' => 1003,
            'message' => [
                'message_id' => 3,
                'chat' => ['id' => 777333],
                'from' => ['id' => 777333, 'username' => 'coded_user'],
                'text' => '654321',
            ],
        ];

        $response = $this->postJson('/api/telegram/webhook', $payload);

        $response->assertOk()
            ->assertJson(['ok' => true]);

        $fresh = $user->fresh();
        $this->assertEquals('777333', $fresh->telegram_chat_id);
        $this->assertEquals('coded_user', $fresh->telegram_username);
    }

    public function test_signed_magic_connect_url_links_user_account(): void
    {
        $user = User::factory()->create();

        $signedUrl = URL::temporarySignedRoute(
            'telegram.connect',
            now()->addMinutes(15),
            ['chat_id' => '123987']
        );

        $response = $this->actingAs($user)->get($signedUrl);

        $response->assertRedirect(route('profile.edit'));
        $this->assertEquals('123987', $user->fresh()->telegram_chat_id);
    }

    public function test_signed_magic_connect_url_rejects_tampered_signature(): void
    {
        $user = User::factory()->create();

        $tamperedUrl = url('/telegram/connect?chat_id=123987&signature=invalid');

        $response = $this->actingAs($user)->get($tamperedUrl);

        $response->assertStatus(403);
    }

    public function test_profile_settings_generate_deep_link(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/settings/telegram/deep-link');

        $response->assertOk()
            ->assertJsonStructure(['deep_link']);
    }

    public function test_profile_settings_generate_pairing_code(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/settings/telegram/pairing-code');

        $response->assertOk()
            ->assertJsonStructure(['code', 'expires_in_minutes']);

        $code = $response->json('code');
        $this->assertMatchesRegularExpression('/^\d{6}$/', (string) $code);
    }

    public function test_profile_settings_unlink_telegram(): void
    {
        $user = User::factory()->create([
            'telegram_chat_id' => '123456',
            'telegram_username' => 'test_user',
        ]);

        $response = $this->actingAs($user)->post('/settings/telegram/unlink');

        $response->assertRedirect();
        $fresh = $user->fresh();
        $this->assertNull($fresh->telegram_chat_id);
        $this->assertNull($fresh->telegram_username);
    }

    public function test_webhook_intercepts_and_confirms_forwarded_humo_receipt(): void
    {
        Config::set('services.humo.card_last_digits', '4458');

        User::factory()->create([
            'role' => 'admin',
            'telegram_chat_id' => '999111',
            'telegram_username' => 'admin_user',
        ]);

        $teacher = User::factory()->teacher()->create();
        $pupil = User::factory()->pupil()->create();

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addHour(),
            'status' => 'accepted',
            'payment_status' => 'verifying',
            'price' => 75000,
        ]);

        $payload = [
            'update_id' => 1004,
            'message' => [
                'message_id' => 4,
                'chat' => ['id' => 999111],
                'from' => ['id' => 999111, 'username' => 'admin_user'],
                'text' => "🎉 To'ldirish\n➕ 75.000,00 UZS\n📍 PAYNET P2P\n💳 HUMOCARD *4458\n🕓 18:40 12.10.2026",
            ],
        ];

        $response = $this->postJson('/api/telegram/webhook', $payload);

        $response->assertOk()->assertJson(['ok' => true]);

        $this->assertSame('confirmed', $appointment->fresh()->status);
        $this->assertSame('paid', $appointment->fresh()->payment_status);
    }

    public function test_webhook_rejects_auto_confirm_if_non_admin_pastes_humo_receipt_for_another_booking(): void
    {
        Config::set('services.humo.card_last_digits', '4458');

        $stranger = User::factory()->create([
            'role' => 'pupil',
            'telegram_chat_id' => '888777',
        ]);

        $teacher = User::factory()->teacher()->create();
        $legitPupil = User::factory()->pupil()->create();

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $legitPupil->id,
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addHour(),
            'status' => 'accepted',
            'payment_status' => 'verifying',
            'price' => 90000,
        ]);

        $payload = [
            'update_id' => 1005,
            'message' => [
                'message_id' => 5,
                'chat' => ['id' => 888777],
                'from' => ['id' => 888777, 'username' => 'stranger'],
                'text' => "🎉 To'ldirish\n➕ 90.000,00 UZS\n📍 PAYNET P2P\n💳 HUMOCARD *4458\n🕓 18:45 12.10.2026",
            ],
        ];

        $response = $this->postJson('/api/telegram/webhook', $payload);

        $response->assertOk();

        // Stranger has no pending 90,000 UZS booking, so legitPupil's appointment must remain unconfirmed!
        $this->assertSame('accepted', $appointment->fresh()->status);
        $this->assertSame('verifying', $appointment->fresh()->payment_status);
    }

    public function test_webhook_prompts_welcome_in_russian_when_language_code_is_ru(): void
    {
        $payload = [
            'update_id' => 1006,
            'message' => [
                'message_id' => 6,
                'chat' => ['id' => 888333],
                'from' => ['id' => 888333, 'username' => 'ru_user', 'language_code' => 'ru'],
                'text' => '/start',
            ],
        ];

        $response = $this->postJson('/api/telegram/webhook', $payload);

        $response->assertOk()->assertJson(['ok' => true]);

        Http::assertSent(function ($request) {
            return $request['chat_id'] === '888333'
                && str_contains($request['text'], 'Добро пожаловать в ConvoMate');
        });
    }

    public function test_webhook_switches_language_via_lang_command(): void
    {
        $user = User::factory()->create([
            'telegram_chat_id' => '555111',
            'telegram_locale' => 'uz',
        ]);

        $payload = [
            'update_id' => 1007,
            'message' => [
                'message_id' => 7,
                'chat' => ['id' => 555111],
                'from' => ['id' => 555111, 'username' => 'switcher'],
                'text' => '/lang ru',
            ],
        ];

        $response = $this->postJson('/api/telegram/webhook', $payload);

        $response->assertOk();
        $this->assertSame('ru', $user->fresh()->telegram_locale);

        Http::assertSent(function ($request) {
            return $request['chat_id'] === '555111'
                && str_contains($request['text'], 'Язык успешно изменен на русский');
        });
    }

    public function test_webhook_switches_language_via_callback_query(): void
    {
        $user = User::factory()->create([
            'telegram_chat_id' => '555222',
            'telegram_locale' => 'uz',
        ]);

        $payload = [
            'update_id' => 1008,
            'callback_query' => [
                'id' => 'cb_123',
                'from' => ['id' => 555222],
                'message' => ['chat' => ['id' => 555222]],
                'data' => 'set_lang:en',
            ],
        ];

        $response = $this->postJson('/api/telegram/webhook', $payload);

        $response->assertOk();
        $this->assertSame('en', $user->fresh()->telegram_locale);

        Http::assertSent(function ($request) {
            return isset($request['chat_id'])
                && $request['chat_id'] === '555222'
                && str_contains($request['text'], 'Language successfully changed to English');
        });
    }

    public function test_webhook_processes_photo_receipt_via_ocr_and_confirms_appointment_in_russian(): void
    {
        Config::set('services.gemini.api_key', 'test-api-key');

        Http::fake([
            'https://api.telegram.org/bot*/getFile*' => Http::response([
                'ok' => true,
                'result' => ['file_path' => 'photos/test_check.jpg'],
            ], 200),
            'https://api.telegram.org/file/bot*/photos/*' => Http::response('fake-binary-image-data', 200),
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'is_payment_receipt' => true,
                                        'amount' => 75000,
                                        'card_last_digits' => '4458',
                                        'time' => '18:40',
                                        'date' => '12.10.2026',
                                        'provider' => 'Click',
                                    ]),
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
            'https://api.telegram.org/*' => Http::response(['ok' => true], 200),
        ]);

        $teacher = User::factory()->teacher()->create();
        $pupil = User::factory()->pupil()->create([
            'telegram_chat_id' => '555333',
            'telegram_locale' => 'ru',
        ]);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addHour(),
            'status' => 'accepted',
            'payment_status' => 'verifying',
            'price' => 75000,
        ]);

        HumoTransaction::create([
            'hash' => 'hash_photo_russian_test',
            'amount' => 75000,
            'card_last_digits' => '4458',
            'channel' => 'CLICK P2P',
            'bank_timestamp' => '18:40',
            'raw_text' => 'sample',
            'status' => 'unmatched',
        ]);

        $payload = [
            'update_id' => 1009,
            'message' => [
                'message_id' => 9,
                'chat' => ['id' => 555333],
                'from' => ['id' => 555333, 'username' => 'ru_pupil'],
                'photo' => [
                    ['file_id' => 'photo_small', 'file_size' => 100],
                    ['file_id' => 'photo_large', 'file_size' => 5000],
                ],
            ],
        ];

        $response = $this->postJson('/api/telegram/webhook', $payload);

        $response->assertOk();

        // Appointment status should update to confirmed and payment to paid
        $this->assertSame('confirmed', $appointment->fresh()->status);
        $this->assertSame('paid', $appointment->fresh()->payment_status);

        Http::assertSent(function ($request) {
            return isset($request['chat_id'])
                && $request['chat_id'] === '555333'
                && str_contains($request['text'], 'Чек об оплате успешно подтвержден');
        });
    }

    public function test_webhook_processes_pasted_click_text_receipt_and_confirms_in_english(): void
    {
        $teacher = User::factory()->teacher()->create();
        $pupil = User::factory()->pupil()->create([
            'telegram_chat_id' => '555444',
            'telegram_locale' => 'en',
        ]);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addHour(),
            'status' => 'accepted',
            'payment_status' => 'verifying',
            'price' => 150000,
        ]);

        HumoTransaction::create([
            'hash' => 'hash_text_english_test',
            'amount' => 150000,
            'card_last_digits' => '6751',
            'channel' => 'CLICK P2P',
            'bank_timestamp' => '21:42',
            'raw_text' => 'sample',
            'status' => 'unmatched',
        ]);

        $payload = [
            'update_id' => 1010,
            'message' => [
                'message_id' => 10,
                'chat' => ['id' => 555444],
                'from' => ['id' => 555444, 'username' => 'en_pupil'],
                'text' => "To'lov muvaffaqiyatli: 150 000 UZS. Karta: *6751. Vaqt: 21:42. Sana: 12.10.2026. CLICK P2P",
            ],
        ];

        $response = $this->postJson('/api/telegram/webhook', $payload);

        $response->assertOk();

        $this->assertSame('confirmed', $appointment->fresh()->status);
        $this->assertSame('paid', $appointment->fresh()->payment_status);

        Http::assertSent(function ($request) {
            return isset($request['chat_id'])
                && $request['chat_id'] === '555444'
                && str_contains($request['text'], 'Payment receipt verified successfully');
        });
    }

    public function test_webhook_prompts_unlinked_user_in_russian_when_uploading_photo_check(): void
    {
        $payload = [
            'update_id' => 1011,
            'message' => [
                'message_id' => 11,
                'chat' => ['id' => 999888],
                'from' => ['id' => 999888, 'username' => 'unlinked_user', 'language_code' => 'ru'],
                'photo' => [
                    ['file_id' => 'some_photo_id', 'file_size' => 2000],
                ],
            ],
        ];

        $response = $this->postJson('/api/telegram/webhook', $payload);

        $response->assertOk();

        Http::assertSent(function ($request) {
            return isset($request['chat_id'])
                && $request['chat_id'] === '999888'
                && str_contains($request['text'], 'Ваш аккаунт еще не подключен к ConvoMate');
        });
    }
}
