<?php

namespace Tests\Unit;

use App\Models\User;
use App\Services\Telegram\TelegramService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TelegramServiceTest extends TestCase
{
    use RefreshDatabase;

    protected TelegramService $service;

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('services.telegram.bot_token', 'test-bot-token');
        Config::set('services.telegram.bot_username', 'TestBot');

        $this->service = new TelegramService;
    }

    public function test_send_message_dispatches_http_request_with_correct_payload(): void
    {
        Http::fake([
            'https://api.telegram.org/bottest-bot-token/sendMessage' => Http::response(['ok' => true], 200),
        ]);

        $result = $this->service->sendMessage('123456', 'Hello world!');

        $this->assertTrue($result);
        Http::assertSent(function ($request) {
            return $request['chat_id'] === '123456'
                && $request['text'] === 'Hello world!'
                && $request['parse_mode'] === 'HTML';
        });
    }

    public function test_send_message_gracefully_handles_api_failure(): void
    {
        Http::fake([
            'https://api.telegram.org/bottest-bot-token/sendMessage' => Http::response(['ok' => false, 'description' => 'Forbidden'], 403),
        ]);

        $result = $this->service->sendMessage('invalid-chat', 'Hello');

        $this->assertFalse($result);
    }

    public function test_generate_signed_connect_url_produces_valid_signed_url(): void
    {
        $url = $this->service->generateSignedConnectUrl('987654');

        $this->assertStringContainsString('chat_id=987654', $url);
        $this->assertStringContainsString('signature=', $url);
    }

    public function test_generate_deep_link_caches_token_and_returns_bot_url(): void
    {
        $user = User::factory()->create();

        $deepLink = $this->service->generateDeepLink($user);

        $this->assertStringStartsWith('https://t.me/TestBot?start=', $deepLink);

        $token = str_replace('https://t.me/TestBot?start=', '', $deepLink);
        $this->assertEquals($user->id, Cache::get("telegram_link_token:{$token}"));
    }

    public function test_link_by_token_links_user_and_sends_confirmation(): void
    {
        Http::fake([
            'https://api.telegram.org/bottest-bot-token/sendMessage' => Http::response(['ok' => true], 200),
        ]);

        $user = User::factory()->create();
        $token = 'test-deep-token-123';
        Cache::put("telegram_link_token:{$token}", $user->id, now()->addMinutes(15));

        $linkedUser = $this->service->linkByToken($token, '777888', 'telegram_user');

        $this->assertNotNull($linkedUser);
        $this->assertEquals('777888', $linkedUser->telegram_chat_id);
        $this->assertEquals('telegram_user', $linkedUser->telegram_username);
        $this->assertNull(Cache::get("telegram_link_token:{$token}")); // Token should be consumed
    }

    public function test_link_by_code_links_user_and_consumes_cache(): void
    {
        Http::fake([
            'https://api.telegram.org/bottest-bot-token/sendMessage' => Http::response(['ok' => true], 200),
        ]);

        $user = User::factory()->create();
        $code = '482195';
        Cache::put("telegram_pairing:{$code}", $user->id, now()->addMinutes(15));
        Cache::put("user_telegram_code:{$user->id}", $code, now()->addMinutes(15));

        $linkedUser = $this->service->linkByCode('482 195', '555444', 'code_user');

        $this->assertNotNull($linkedUser);
        $this->assertEquals('555444', $linkedUser->telegram_chat_id);
        $this->assertEquals('code_user', $linkedUser->telegram_username);
        $this->assertNull(Cache::get("telegram_pairing:{$code}"));
        $this->assertNull(Cache::get("user_telegram_code:{$user->id}"));
    }

    public function test_link_by_code_returns_null_for_invalid_code(): void
    {
        $result = $this->service->linkByCode('000000', '123456');

        $this->assertNull($result);
    }
}
