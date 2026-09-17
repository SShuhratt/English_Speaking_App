<?php

namespace Tests\Unit;

use App\Services\Sms\SmsService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SmsServiceTest extends TestCase
{
    public function test_phone_number_normalization(): void
    {
        $service = new SmsService;

        $this->assertEquals('998901234567', $service->normalizePhoneNumber('+998 (90) 123-45-67'));
        $this->assertEquals('998935554433', $service->normalizePhoneNumber('998 93 555-44-33'));
        $this->assertEquals('', $service->normalizePhoneNumber('invalid'));
    }

    public function test_log_driver_returns_true_without_http_calls(): void
    {
        Http::fake();
        Config::set('services.eskiz.driver', 'log');

        $service = new SmsService;
        $result = $service->send('+998901234567', 'Test SMS Message');

        $this->assertTrue($result);
        Http::assertNothingSent();
    }

    public function test_eskiz_driver_authenticates_and_sends_sms(): void
    {
        Cache::forget('eskiz_auth_token');

        Config::set('services.eskiz.driver', 'eskiz');
        Config::set('services.eskiz.email', 'eskiz@example.com');
        Config::set('services.eskiz.password', 'secret-pass');
        Config::set('services.eskiz.from', '4546');
        Config::set('services.eskiz.api_url', 'https://notify.eskiz.uz/api/');

        Http::fake([
            'https://notify.eskiz.uz/api/auth/login' => Http::response([
                'message' => 'token_generated',
                'data' => ['token' => 'mock-jwt-token-123'],
            ], 200),
            'https://notify.eskiz.uz/api/message/sms/send' => Http::response([
                'status' => 'waiting',
                'message' => 'Waiting for SMS provider',
            ], 200),
        ]);

        $service = new SmsService;
        $result = $service->send('+998 (90) 123-45-67', 'English Platform reminder');

        $this->assertTrue($result);

        Http::assertSent(function ($request) {
            if ($request->url() === 'https://notify.eskiz.uz/api/message/sms/send') {
                return $request->hasHeader('Authorization', 'Bearer mock-jwt-token-123')
                    && $request['mobile_phone'] === '998901234567'
                    && $request['message'] === 'English Platform reminder'
                    && $request['from'] === '4546';
            }

            return true;
        });

        // Ensure token was cached
        $this->assertEquals('mock-jwt-token-123', Cache::get('eskiz_auth_token'));
    }

    public function test_eskiz_driver_refreshes_token_on_401(): void
    {
        Cache::put('eskiz_auth_token', 'expired-token', now()->addMinutes(10));

        Config::set('services.eskiz.driver', 'eskiz');
        Config::set('services.eskiz.email', 'eskiz@example.com');
        Config::set('services.eskiz.password', 'secret-pass');
        Config::set('services.eskiz.api_url', 'https://notify.eskiz.uz/api/');

        Http::fake([
            'https://notify.eskiz.uz/api/message/sms/send' => Http::sequence()
                ->push(['message' => 'Unauthenticated'], 401)
                ->push(['status' => 'waiting'], 200),
            'https://notify.eskiz.uz/api/auth/login' => Http::response([
                'data' => ['token' => 'refreshed-token-456'],
            ], 200),
        ]);

        $service = new SmsService;
        $result = $service->send('998901234567', 'Test message');

        $this->assertTrue($result);
        $this->assertEquals('refreshed-token-456', Cache::get('eskiz_auth_token'));
    }

    public function test_send_returns_false_for_invalid_phone(): void
    {
        $service = new SmsService;
        $result = $service->send('', 'Test message');

        $this->assertFalse($result);
    }
}
