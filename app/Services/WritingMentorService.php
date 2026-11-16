<?php

namespace App\Services;

use App\Models\ExternalEntitlement;
use App\Models\IntegrationWebhookEvent;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RuntimeException;

class WritingMentorService
{
    public const PROVIDER = 'writing_mentor';

    public function isEnabled(): bool
    {
        return (bool) config('monetization.writing_mentor.enabled', false);
    }

    /**
     * Build a signed SSO launch URL for an authenticated ConvoMate user.
     */
    public function buildSsoLaunchUrl(User $user, int $ttlSeconds = 60): string
    {
        if (! $this->isEnabled()) {
            throw new RuntimeException('WritingMentor integration is currently disabled.');
        }

        $baseUrl = rtrim((string) config('monetization.writing_mentor.base_url'), '/');
        $secret = (string) config('monetization.writing_mentor.sso_secret');

        if ($baseUrl === '' || $secret === '') {
            throw new RuntimeException('WritingMentor SSO configuration is incomplete.');
        }

        $attribution = $user->partnerAttribution()->with('partnerOrganization:id,partner_code')->first();
        $activePass = $user->activePartnerPass();

        $payload = [
            'iss' => 'convomate',
            'user_id' => $user->id,
            'email' => $user->email,
            'full_name' => $user->full_name ?: $user->name,
            'role' => $user->role,
            'partner_code' => $attribution?->partnerOrganization?->partner_code,
            'partner_pass_active' => $activePass !== null,
            'partner_pass_expires_at' => $activePass?->expires_at?->toIso8601String(),
            'iat' => now()->timestamp,
            'exp' => now()->addSeconds($ttlSeconds)->timestamp,
            'jti' => (string) Str::uuid(),
        ];

        $encodedPayload = $this->base64UrlEncode((string) json_encode($payload, JSON_UNESCAPED_SLASHES));
        $signature = $this->base64UrlEncode(hash_hmac('sha256', $encodedPayload, $secret, true));
        $token = "{$encodedPayload}.{$signature}";

        $separator = str_contains($baseUrl, '?') ? '&' : '?';

        return "{$baseUrl}/sso/callback{$separator}token={$token}";
    }

    /**
     * Verify HMAC signature + replay timestamp window for an incoming WritingMentor webhook.
     */
    public function verifyWebhookSignature(string $rawBody, ?string $signature, string|int|null $timestamp): bool
    {
        $secret = (string) config('monetization.writing_mentor.webhook_secret');
        if ($secret === '' || ! $signature || ! $timestamp) {
            return false;
        }

        $ts = (int) $timestamp;
        $tolerance = (int) config('monetization.writing_mentor.webhook_tolerance_seconds', 300);

        if ($ts <= 0 || abs(now()->timestamp - $ts) > $tolerance) {
            return false;
        }

        $expectedHex = hash_hmac('sha256', "{$ts}.{$rawBody}", $secret);
        $normalizedSig = str_starts_with($signature, 'sha256=') ? substr($signature, 7) : $signature;

        return hash_equals($expectedHex, $normalizedSig);
    }

    /**
     * Idempotently record and apply a verified WritingMentor webhook event.
     */
    public function handleWebhookPayload(array $payload): IntegrationWebhookEvent
    {
        $eventId = trim((string) ($payload['event_id'] ?? ''));
        $eventType = trim((string) ($payload['event_type'] ?? ''));
        $userId = trim((string) ($payload['user_id'] ?? ''));

        if ($eventId === '' || $eventType === '' || $userId === '') {
            throw new InvalidArgumentException('Webhook payload requires event_id, event_type, and user_id.');
        }

        $existing = IntegrationWebhookEvent::where('provider', self::PROVIDER)
            ->where('event_id', $eventId)
            ->first();

        if ($existing) {
            return $existing;
        }

        $user = User::findOrFail($userId);

        return DB::transaction(function () use ($eventId, $eventType, $payload, $user) {
            $status = match ($eventType) {
                'entitlement.activated', 'entitlement.renewed' => 'active',
                'entitlement.expired' => 'expired',
                'entitlement.revoked' => 'revoked',
                default => 'active',
            };

            $startsAt = ! empty($payload['starts_at']) ? Carbon::parse((string) $payload['starts_at']) : now();
            $expiresAt = ! empty($payload['expires_at']) ? Carbon::parse((string) $payload['expires_at']) : null;

            ExternalEntitlement::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'provider' => self::PROVIDER,
                ],
                [
                    'external_user_id' => isset($payload['external_user_id']) ? (string) $payload['external_user_id'] : null,
                    'plan_code' => (string) ($payload['plan_code'] ?? 'writing_pro'),
                    'status' => $status,
                    'starts_at' => $startsAt,
                    'expires_at' => $expiresAt,
                    'metadata' => is_array($payload['metadata'] ?? null) ? $payload['metadata'] : null,
                ],
            );

            return IntegrationWebhookEvent::create([
                'provider' => self::PROVIDER,
                'event_id' => $eventId,
                'event_type' => $eventType,
                'payload' => $payload,
                'processed_at' => now(),
            ]);
        });
    }

    protected function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
