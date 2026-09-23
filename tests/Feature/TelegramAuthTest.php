<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\TelegramLinkOtpNotification;
use App\Notifications\WelcomeNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TelegramAuthTest extends TestCase
{
    use RefreshDatabase;

    protected string $botToken = '987654:TEST_BOT_TOKEN_FOR_TMA_AUTH';

    protected function setUp(): void
    {
        parent::setUp();
        Config::set('services.telegram.bot_token', $this->botToken);
    }

    /**
     * Generate valid HMAC-SHA256 signed initData query string.
     *
     * @param  array<string, mixed>  $params
     */
    protected function generateValidInitData(array $params): string
    {
        ksort($params);
        $dataCheckArr = [];
        foreach ($params as $key => $value) {
            $dataCheckArr[] = "{$key}={$value}";
        }
        $dataCheckString = implode("\n", $dataCheckArr);

        $secretKey = hash_hmac('sha256', $this->botToken, 'WebAppData', true);
        $hash = hash_hmac('sha256', $dataCheckString, $secretKey);

        $params['hash'] = $hash;

        return http_build_query($params);
    }

    public function test_telegram_auth_fails_with_invalid_signature(): void
    {
        $response = $this->postJson(route('telegram.auth'), [
            'initData' => 'auth_date='.time().'&hash=invalid_hash&user={"id":123}',
        ]);

        $response->assertStatus(403);
        $response->assertJson([
            'error' => 'Invalid or expired Telegram signature.',
        ]);
    }

    public function test_telegram_auth_logs_in_existing_linked_user(): void
    {
        $user = User::factory()->create([
            'telegram_chat_id' => '12345678',
            'telegram_username' => 'existing_user',
        ]);

        $initData = $this->generateValidInitData([
            'auth_date' => time(),
            'query_id' => 'AAHdF6IQAAAAAN0XohDhrOrc',
            'user' => json_encode([
                'id' => 12345678,
                'first_name' => 'Existing',
                'last_name' => 'Pupil',
                'username' => 'updated_username',
            ]),
        ]);

        $response = $this->postJson(route('telegram.auth'), [
            'initData' => $initData,
        ]);

        $response->assertOk();
        $response->assertJson([
            'status' => 'authenticated',
        ]);
        $redirectUrl = $response->json('redirect');
        $this->assertStringContainsString('/telegram/token/', $redirectUrl);

        $consumeResponse = $this->get($redirectUrl);
        $consumeResponse->assertRedirect(route('dashboard'));

        $this->assertAuthenticatedAs($user);
        $this->assertEquals('updated_username', $user->fresh()->telegram_username);
    }

    public function test_telegram_auth_links_currently_authenticated_user(): void
    {
        $user = User::factory()->create([
            'telegram_chat_id' => null,
            'telegram_username' => null,
        ]);

        $initData = $this->generateValidInitData([
            'auth_date' => time(),
            'query_id' => 'AAHdF6IQAAAAAN0XohDhrOrc',
            'user' => json_encode([
                'id' => 88899911,
                'first_name' => 'New',
                'username' => 'brand_new_handle',
            ]),
        ]);

        $response = $this->actingAs($user)->postJson(route('telegram.auth'), [
            'initData' => $initData,
        ]);

        $response->assertOk();
        $response->assertJson([
            'status' => 'linked',
        ]);
        $this->assertStringContainsString('/telegram/token/', $response->json('redirect'));

        $this->assertEquals('88899911', $user->fresh()->telegram_chat_id);
        $this->assertEquals('brand_new_handle', $user->fresh()->telegram_username);
    }

    public function test_telegram_auth_stores_session_and_returns_needs_onboarding_for_new_user(): void
    {
        $initData = $this->generateValidInitData([
            'auth_date' => time(),
            'query_id' => 'AAHdF6IQAAAAAN0XohDhrOrc',
            'user' => json_encode([
                'id' => 55566677,
                'first_name' => 'Shuhrat',
                'last_name' => 'Dev',
                'username' => 'shuhratdev',
            ]),
        ]);

        $response = $this->postJson(route('telegram.auth'), [
            'initData' => $initData,
        ]);

        $response->assertOk();
        $response->assertJson([
            'status' => 'needs_onboarding',
            'redirect' => route('telegram.tma'),
            'telegram_user' => [
                'id' => '55566677',
                'name' => 'Shuhrat Dev',
                'username' => 'shuhratdev',
            ],
        ]);

        $response->assertSessionHas('telegram_register', [
            'telegram_chat_id' => '55566677',
            'telegram_username' => 'shuhratdev',
            'name' => 'Shuhrat Dev',
        ]);
    }

    public function test_telegram_tma_entry_renders_welcome_page_for_guest(): void
    {
        $response = $this->get(route('telegram.tma'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page->component('telegram/welcome'));
    }

    public function test_telegram_tma_entry_redirects_authenticated_user_to_dashboard(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('telegram.tma'));

        $response->assertRedirect(route('dashboard'));
    }

    public function test_send_link_code_sends_email_otp_to_existing_user(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'pupil@example.com',
            'telegram_chat_id' => null,
        ]);

        $initData = $this->generateValidInitData([
            'auth_date' => time(),
            'query_id' => 'AAHdF6IQAAAAAN0XohDhrOrc',
            'user' => json_encode([
                'id' => 99887766,
                'username' => 'testuser',
            ]),
        ]);

        $response = $this->postJson(route('telegram.send-link-code'), [
            'initData' => $initData,
            'email' => 'pupil@example.com',
        ]);

        $response->assertOk();
        $response->assertJson([
            'status' => 'code_sent',
            'email' => 'pupil@example.com',
        ]);

        Notification::assertSentTo($user, TelegramLinkOtpNotification::class);
        $cached = Cache::get("telegram_otp:{$user->id}");
        $this->assertNotNull($cached);
        $this->assertEquals(6, strlen($cached['code']));
        $this->assertEquals('99887766', $cached['telegram_id']);
    }

    public function test_send_link_code_returns_404_if_email_not_found(): void
    {
        $initData = $this->generateValidInitData([
            'auth_date' => time(),
            'query_id' => 'AAHdF6IQAAAAAN0XohDhrOrc',
            'user' => json_encode([
                'id' => 99887766,
            ]),
        ]);

        $response = $this->postJson(route('telegram.send-link-code'), [
            'initData' => $initData,
            'email' => 'nonexistent@example.com',
        ]);

        $response->assertStatus(404);
        $response->assertJsonFragment([
            'error' => 'No ConvoMate account found with this email. You can start with Quick Sign-Up instead!',
        ]);
    }

    public function test_verify_link_code_links_account_and_authenticates(): void
    {
        $user = User::factory()->create([
            'email' => 'pupil@example.com',
            'telegram_chat_id' => null,
            'telegram_username' => null,
        ]);

        Cache::put("telegram_otp:{$user->id}", [
            'code' => '123456',
            'telegram_id' => '77665544',
            'telegram_username' => 'linkeduser',
        ], now()->addMinutes(10));

        $initData = $this->generateValidInitData([
            'auth_date' => time(),
            'query_id' => 'AAHdF6IQAAAAAN0XohDhrOrc',
            'user' => json_encode([
                'id' => 77665544,
                'username' => 'linkeduser',
            ]),
        ]);

        $response = $this->postJson(route('telegram.verify-link-code'), [
            'initData' => $initData,
            'email' => 'pupil@example.com',
            'code' => '123456',
        ]);

        $response->assertOk();
        $response->assertJson([
            'status' => 'authenticated',
        ]);
        $redirectUrl = $response->json('redirect');
        $this->assertStringContainsString('/telegram/token/', $redirectUrl);

        $consumeResponse = $this->get($redirectUrl);
        $consumeResponse->assertRedirect(route('dashboard'));

        $this->assertAuthenticatedAs($user);
        $this->assertEquals('77665544', $user->fresh()->telegram_chat_id);
        $this->assertEquals('linkeduser', $user->fresh()->telegram_username);
        $this->assertNull(Cache::get("telegram_otp:{$user->id}"));
    }

    public function test_verify_link_code_rejects_invalid_code(): void
    {
        $user = User::factory()->create([
            'email' => 'pupil@example.com',
        ]);

        Cache::put("telegram_otp:{$user->id}", [
            'code' => '123456',
            'telegram_id' => '77665544',
            'telegram_username' => 'linkeduser',
        ], now()->addMinutes(10));

        $initData = $this->generateValidInitData([
            'auth_date' => time(),
            'query_id' => 'AAHdF6IQAAAAAN0XohDhrOrc',
            'user' => json_encode([
                'id' => 77665544,
            ]),
        ]);

        $response = $this->postJson(route('telegram.verify-link-code'), [
            'initData' => $initData,
            'email' => 'pupil@example.com',
            'code' => '999999',
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment([
            'error' => 'Incorrect verification code. Please check your email and try again.',
        ]);
    }

    public function test_quick_register_creates_pupil_and_profile_and_authenticates(): void
    {
        Notification::fake();

        $initData = $this->generateValidInitData([
            'auth_date' => time(),
            'query_id' => 'AAHdF6IQAAAAAN0XohDhrOrc',
            'user' => json_encode([
                'id' => 11223344,
                'first_name' => 'Fast',
                'last_name' => 'Learner',
                'username' => 'fastlearner',
            ]),
        ]);

        $response = $this->postJson(route('telegram.quick-register'), [
            'initData' => $initData,
            'name' => 'Fast Learner',
            'email' => 'fast@example.com',
            'role' => 'pupil',
            'level' => 'upper-intermediate',
            'age' => 22,
            'phone_number' => '+998901234567',
        ]);

        $response->assertOk();
        $response->assertJson([
            'status' => 'authenticated',
        ]);
        $redirectUrl = $response->json('redirect');
        $this->assertStringContainsString('/telegram/token/', $redirectUrl);

        $consumeResponse = $this->get($redirectUrl);
        $consumeResponse->assertRedirect(route('dashboard'));

        $user = User::where('email', 'fast@example.com')->first();
        $this->assertNotNull($user);
        $this->assertEquals('Fast Learner', $user->full_name);
        $this->assertEquals('11223344', $user->telegram_chat_id);
        $this->assertEquals('fastlearner', $user->telegram_username);
        $this->assertNotNull($user->pupilProfile);
        $this->assertEquals('upper-intermediate', $user->pupilProfile->level);
        $this->assertEquals(22, $user->pupilProfile->age);

        $this->assertAuthenticatedAs($user);
        Notification::assertSentTo($user, WelcomeNotification::class);
    }

    public function test_consume_token_authenticates_user_and_redirects_to_dashboard(): void
    {
        $user = User::factory()->create();
        $token = 'test_valid_cryptographic_token_for_consumption_1234567890';
        Cache::put("telegram_login_token:{$token}", $user->id, now()->addSeconds(60));

        $response = $this->get(route('telegram.consume-token', ['token' => $token]));

        $response->assertRedirect(route('dashboard'));
        $this->assertAuthenticatedAs($user);
    }

    public function test_consume_token_burns_token_so_it_cannot_be_reused(): void
    {
        $user = User::factory()->create();
        $token = 'single_use_token_1234567890';
        Cache::put("telegram_login_token:{$token}", $user->id, now()->addSeconds(60));

        // First use succeeds
        $firstResponse = $this->get(route('telegram.consume-token', ['token' => $token]));
        $firstResponse->assertRedirect(route('dashboard'));

        // Log out to verify second use cannot log in
        Auth::logout();

        // Second use fails because token was pulled from cache
        $secondResponse = $this->get(route('telegram.consume-token', ['token' => $token]));
        $secondResponse->assertRedirect(route('telegram.tma'));
        $secondResponse->assertSessionHas('error');
        $this->assertGuest();
    }

    public function test_consume_token_fails_with_invalid_or_expired_token(): void
    {
        $response = $this->get(route('telegram.consume-token', ['token' => 'completely_invalid_or_expired_token']));

        $response->assertRedirect(route('telegram.tma'));
        $response->assertSessionHas('error');
        $this->assertGuest();
    }

    public function test_quick_register_rejects_duplicate_email(): void
    {
        User::factory()->create([
            'email' => 'existing@example.com',
        ]);

        $initData = $this->generateValidInitData([
            'auth_date' => time(),
            'query_id' => 'AAHdF6IQAAAAAN0XohDhrOrc',
            'user' => json_encode([
                'id' => 11223344,
            ]),
        ]);

        $response = $this->postJson(route('telegram.quick-register'), [
            'initData' => $initData,
            'name' => 'Another User',
            'email' => 'existing@example.com',
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment([
            'error' => 'An account with this email already exists. Click "Link Account" to connect your Telegram account with a verification code.',
        ]);
    }

    public function test_telegram_set_menu_button_artisan_command(): void
    {
        Http::fake([
            'https://api.telegram.org/bot'.$this->botToken.'/setChatMenuButton' => Http::response(['ok' => true, 'result' => true], 200),
        ]);

        $this->artisan('telegram:set-menu-button', [
            '--url' => 'https://convomate.uz/tma',
            '--text' => 'Practice Speaking',
        ])
            ->expectsOutputToContain('Setting Telegram chat menu button to')
            ->expectsOutputToContain('Successfully configured Telegram chat menu button')
            ->assertSuccessful();

        Http::assertSent(function ($request) {
            return $request['menu_button']['type'] === 'web_app'
                && $request['menu_button']['text'] === 'Practice Speaking'
                && $request['menu_button']['web_app']['url'] === 'https://convomate.uz/tma';
        });
    }
}
