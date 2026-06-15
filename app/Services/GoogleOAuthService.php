<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;

class GoogleOAuthService
{
    /**
     * Retrieve a valid Google access token for the given user, refreshing it if expired.
     */
    public function getValidAccessToken(User $user): string
    {
        if (!$user->google_connected || !$user->google_refresh_token) {
            throw new \Exception('Google account not connected.');
        }

        // If token is still valid (with a 5-minute safety margin), use it
        if ($user->google_token_expires_at && $user->google_token_expires_at->subMinutes(5)->isFuture()) {
            return $user->google_access_token;
        }

        // Otherwise, refresh the token
        $response = Http::post('https://oauth2.googleapis.com/token', [
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'refresh_token' => $user->google_refresh_token,
            'grant_type' => 'refresh_token',
        ]);

        if (!$response->successful()) {
            throw new \Exception('Failed to refresh Google access token: ' . $response->body());
        }

        $data = $response->json();

        $user->update([
            'google_access_token' => $data['access_token'],
            'google_token_expires_at' => now()->addSeconds($data['expires_in']),
        ]);

        return $data['access_token'];
    }
}
