<?php

namespace Tests\Unit;

use App\Services\Telegram\TelegramWebAppService;
use Tests\TestCase;

class TelegramWebAppServiceTest extends TestCase
{
    protected string $botToken = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11';

    protected TelegramWebAppService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new TelegramWebAppService($this->botToken);
    }

    /**
     * Helper to generate a valid Telegram WebApp initData string with valid HMAC.
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

    public function test_validate_init_data_returns_null_when_empty(): void
    {
        $this->assertNull($this->service->validateInitData(''));
    }

    public function test_validate_init_data_returns_null_when_hash_missing(): void
    {
        $queryString = 'auth_date='.time().'&user={"id":12345}';
        $this->assertNull($this->service->validateInitData($queryString));
    }

    public function test_validate_init_data_returns_null_when_auth_date_expired(): void
    {
        $expiredTime = time() - 90000; // More than 24 hours (86400s)
        $initData = $this->generateValidInitData([
            'auth_date' => $expiredTime,
            'query_id' => 'AAHdF6IQAAAAAN0XohDhrOrc',
            'user' => json_encode(['id' => 888777, 'first_name' => 'John']),
        ]);

        $this->assertNull($this->service->validateInitData($initData, 86400));
    }

    public function test_validate_init_data_returns_null_with_tampered_payload(): void
    {
        $initData = $this->generateValidInitData([
            'auth_date' => time(),
            'query_id' => 'AAHdF6IQAAAAAN0XohDhrOrc',
            'user' => json_encode(['id' => 888777, 'first_name' => 'John']),
        ]);

        // Tamper by altering one parameter
        $tampered = $initData.'&hacked=true';
        $this->assertNull($this->service->validateInitData($tampered));
    }

    public function test_validate_init_data_succeeds_with_valid_signature_and_parses_user(): void
    {
        $userData = [
            'id' => 999888,
            'first_name' => 'Alice',
            'last_name' => 'Smith',
            'username' => 'alicesmith',
        ];

        $initData = $this->generateValidInitData([
            'auth_date' => time(),
            'query_id' => 'AAHdF6IQAAAAAN0XohDhrOrc',
            'user' => json_encode($userData),
        ]);

        $result = $this->service->validateInitData($initData);

        $this->assertIsArray($result);
        $this->assertArrayHasKey('user', $result);
        $this->assertEquals(999888, $result['user']['id']);
        $this->assertEquals('Alice', $result['user']['first_name']);
        $this->assertEquals('Smith', $result['user']['last_name']);
        $this->assertEquals('alicesmith', $result['user']['username']);
    }
}
