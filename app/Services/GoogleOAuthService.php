<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleOAuthService
{
    /**
     * Retrieve a valid Google access token for the given user, refreshing it if expired or forced.
     */
    public function getValidAccessToken(User $user, bool $forceRefresh = false): string
    {
        $freshUser = $user->fresh() ?? $user;

        if (! $freshUser->google_connected || ! $freshUser->google_refresh_token) {
            throw new \Exception('Google account not connected.');
        }

        // Check if cached token has calendar scope if scopes are recorded
        $hasCalendarScope = false;
        if (is_array($freshUser->google_scopes)) {
            foreach ($freshUser->google_scopes as $scope) {
                if (str_contains($scope, 'calendar')) {
                    $hasCalendarScope = true;
                    break;
                }
            }
        }
        $scopeIsSufficient = empty($freshUser->google_scopes) || $hasCalendarScope;

        // If token is still valid and has calendar scope, use it without mutating the model attribute
        if (! $forceRefresh && $scopeIsSufficient && $freshUser->google_access_token && $freshUser->google_token_expires_at && $freshUser->google_token_expires_at->isAfter(now()->addMinutes(5))) {
            return $freshUser->google_access_token;
        }

        return $this->refreshTokenWithLock($freshUser, $forceRefresh);
    }

    /**
     * Refresh the Google access token, protected by an atomic lock to avoid concurrent stampedes.
     */
    protected function refreshTokenWithLock(User $user, bool $forceRefresh = false): string
    {
        $lockKey = "google_token_refresh:{$user->id}";
        $lock = null;

        try {
            $lock = Cache::lock($lockKey, 10);
            $lock->block(3);
        } catch (\Throwable $e) {
            $lock = null;
        }

        try {
            // Re-check after lock acquired
            $freshUser = $user->fresh() ?? $user;
            if (! $forceRefresh && $freshUser->google_access_token && $freshUser->google_token_expires_at && $freshUser->google_token_expires_at->isAfter(now()->addMinutes(5))) {
                return $freshUser->google_access_token;
            }

            $response = Http::post('https://oauth2.googleapis.com/token', [
                'client_id' => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
                'refresh_token' => $freshUser->google_refresh_token,
                'grant_type' => 'refresh_token',
            ]);

            if (! $response->successful()) {
                $body = $response->json() ?? [];
                $error = $body['error'] ?? '';
                $description = strtolower($body['error_description'] ?? '');

                // Only clear connection if Google explicitly confirms the refresh token was permanently revoked or expired
                if ($error === 'invalid_grant' && (str_contains($description, 'revoked') || str_contains($description, 'expired'))) {
                    $freshUser->update([
                        'google_connected' => false,
                        'google_access_token' => null,
                        'google_refresh_token' => null,
                        'google_token_expires_at' => null,
                    ]);
                }

                throw new \Exception('Failed to refresh Google access token: '.$response->body());
            }

            $data = $response->json();

            $updateData = [
                'google_access_token' => $data['access_token'],
                'google_token_expires_at' => now()->addSeconds($data['expires_in']),
                'google_connected' => true,
            ];

            // Persist rotated refresh token if provided by Google
            if (! empty($data['refresh_token'])) {
                $updateData['google_refresh_token'] = $data['refresh_token'];
            }

            // Merge scopes if returned
            if (! empty($data['scope'])) {
                $scopes = explode(' ', $data['scope']);
                $updateData['google_scopes'] = array_values(array_unique(array_merge(
                    $freshUser->google_scopes ?? [],
                    $scopes
                )));
            }

            $freshUser->update($updateData);

            return $data['access_token'];
        } finally {
            if ($lock) {
                try {
                    $lock->release();
                } catch (\Throwable $e) {
                    // Ignore release failure
                }
            }
        }
    }

    /**
     * Revoke the user's OAuth tokens directly with Google's revocation endpoint.
     */
    public function revokeUserAccess(User $user): bool
    {
        $token = $user->google_refresh_token ?? $user->google_access_token;

        if (! $token) {
            return false;
        }

        try {
            $response = Http::asForm()
                ->timeout(5)
                ->post('https://oauth2.googleapis.com/revoke', [
                    'token' => $token,
                ]);

            return $response->successful();
        } catch (\Throwable $e) {
            Log::warning("Failed to revoke Google token for user {$user->id}: ".$e->getMessage());

            return false;
        }
    }
}
