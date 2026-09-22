<?php

namespace App\Services\Telegram;

use Illuminate\Support\Facades\Log;

class TelegramWebAppService
{
    protected ?string $botToken;

    public function __construct(?string $botToken = null)
    {
        $this->botToken = $botToken ?? config('services.telegram.bot_token');
    }

    /**
     * Validate Telegram WebApp initData string using HMAC-SHA256 signature.
     *
     * @param  string  $initData  Raw query string passed by Telegram.WebApp.initData
     * @param  int  $maxAgeSeconds  Maximum age allowed for auth_date (default 24 hours / 86400s)
     * @return array|null Returns parsed data array on success, or null on validation failure
     */
    public function validateInitData(string $initData, int $maxAgeSeconds = 86400): ?array
    {
        if (empty($this->botToken) || empty($initData)) {
            return null;
        }

        parse_str($initData, $params);

        if (! isset($params['hash']) || ! is_string($params['hash'])) {
            return null;
        }

        $hash = $params['hash'];
        unset($params['hash']);

        // Check freshness of auth_date to prevent replay attacks
        if (isset($params['auth_date'])) {
            $authDate = (int) $params['auth_date'];
            if (abs(time() - $authDate) > $maxAgeSeconds) {
                Log::warning('Telegram WebApp initData validation failed: auth_date expired.', [
                    'auth_date' => $authDate,
                    'current_time' => time(),
                ]);

                return null;
            }
        } else {
            return null;
        }

        // Sort keys alphabetically
        ksort($params);

        // Build data_check_string: "key=value\nkey=value..."
        $dataCheckArr = [];
        foreach ($params as $key => $value) {
            $dataCheckArr[] = "{$key}={$value}";
        }
        $dataCheckString = implode("\n", $dataCheckArr);

        // Calculate secret key: HMAC_SHA256 of botToken with constant "WebAppData"
        $secretKey = hash_hmac('sha256', $this->botToken, 'WebAppData', true);

        // Calculate hash
        $calculatedHash = hash_hmac('sha256', $dataCheckString, $secretKey);

        if (! hash_equals($calculatedHash, $hash)) {
            Log::warning('Telegram WebApp initData validation failed: signature mismatch.');

            return null;
        }

        // Parse user JSON if present
        if (isset($params['user']) && is_string($params['user'])) {
            $decodedUser = json_decode($params['user'], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $params['user'] = $decodedUser;
            }
        }

        return $params;
    }
}
