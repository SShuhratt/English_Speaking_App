<?php

namespace Tests\Feature;

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
                'from' => ['id' => 888222, 'username' => 'newuser'],
                'text' => '/start',
            ],
        ];

        $response = $this->postJson('/api/telegram/webhook', $payload);

        $response->assertOk()
            ->assertJson(['ok' => true]);

        Http::assertSent(function ($request) {
            return $request['chat_id'] === '888222'
                && str_contains($request['text'], 'Welcome to English Speaking Platform');
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
}
