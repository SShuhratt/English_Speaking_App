<?php

namespace App\Services\Sms;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    protected string $driver;

    protected ?string $email;

    protected ?string $password;

    protected string $from;

    protected string $apiUrl;

    public function __construct()
    {
        $this->driver = config('services.eskiz.driver', 'log');
        $this->email = config('services.eskiz.email');
        $this->password = config('services.eskiz.password');
        $this->from = config('services.eskiz.from', '4546');
        $this->apiUrl = rtrim(config('services.eskiz.api_url', 'https://notify.eskiz.uz/api/'), '/').'/';
    }

    /**
     * Send SMS to the given phone number.
     */
    public function send(string $phone, string $message): bool
    {
        $normalizedPhone = $this->normalizePhoneNumber($phone);

        if (empty($normalizedPhone)) {
            Log::warning("SMS dispatch failed: invalid phone number '{$phone}'");

            return false;
        }

        if ($this->driver === 'log' || empty($this->email) || empty($this->password)) {
            Log::info("SMS [{$this->driver}] to {$normalizedPhone}: {$message}");

            return true;
        }

        return $this->sendViaEskiz($normalizedPhone, $message);
    }

    /**
     * Normalize phone number to digits only (e.g. 998901234567).
     */
    public function normalizePhoneNumber(string $phone): string
    {
        return preg_replace('/\D+/', '', $phone);
    }

    /**
     * Send SMS using Eskiz.uz API.
     */
    protected function sendViaEskiz(string $phone, string $message): bool
    {
        try {
            $token = $this->getEskizToken();

            if (! $token) {
                Log::error('Eskiz SMS failed: unable to obtain authentication token.');

                return false;
            }

            $response = Http::withToken($token)
                ->timeout(10)
                ->asForm()
                ->post($this->apiUrl.'message/sms/send', [
                    'mobile_phone' => $phone,
                    'message' => $message,
                    'from' => $this->from,
                ]);

            if ($response->status() === 401) {
                // Token might be expired, clear cache and retry once
                Cache::forget('eskiz_auth_token');
                $newToken = $this->getEskizToken();
                if ($newToken) {
                    $response = Http::withToken($newToken)
                        ->timeout(10)
                        ->asForm()
                        ->post($this->apiUrl.'message/sms/send', [
                            'mobile_phone' => $phone,
                            'message' => $message,
                            'from' => $this->from,
                        ]);
                }
            }

            if ($response->successful()) {
                return true;
            }

            Log::warning("Eskiz SMS API returned {$response->status()}: {$response->body()} for {$phone}");

            return false;
        } catch (\Throwable $e) {
            Log::error("Failed to send Eskiz SMS to {$phone}: ".$e->getMessage());

            return false;
        }
    }

    /**
     * Get or refresh Eskiz API token.
     */
    protected function getEskizToken(): ?string
    {
        return Cache::remember('eskiz_auth_token', now()->addDays(25), function () {
            try {
                $response = Http::timeout(10)->asForm()->post($this->apiUrl.'auth/login', [
                    'email' => $this->email,
                    'password' => $this->password,
                ]);

                if ($response->successful()) {
                    return $response->json('data.token');
                }

                Log::error("Eskiz auth failed with status {$response->status()}: {$response->body()}");

                return null;
            } catch (\Throwable $e) {
                Log::error('Exception while authenticating with Eskiz: '.$e->getMessage());

                return null;
            }
        });
    }
}
