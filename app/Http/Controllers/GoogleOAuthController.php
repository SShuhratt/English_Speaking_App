<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GoogleOAuthController extends Controller
{
    /**
     * Redirect the user to the Google authentication page.
     */
    public function redirect()
    {
        return Socialite::driver('google')
            ->scopes([
                'https://www.googleapis.com/auth/calendar.events',
            ])
            ->with([
                'access_type' => 'offline',
                'prompt' => 'consent select_account',
            ])
            ->redirect();
    }

    /**
     * Obtain the user information from Google.
     */
    public function callback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')->user();
            $user = Auth::user();

            if (!$user) {
                return redirect()->route('login')->with('error', 'Please log in first.');
            }

            $user->update([
                'google_connected' => true,
                'google_access_token' => $googleUser->token,
                'google_refresh_token' => $googleUser->refreshToken ?? $user->google_refresh_token,
                'google_token_expires_at' => now()->addSeconds($googleUser->expiresIn),
                'google_scopes' => $googleUser->approvedScopes ?? [],
            ]);

            return redirect()->route('dashboard')->with('success', 'Google account connected successfully.');
        } catch (\Exception $e) {
            return redirect()->route('dashboard')->with('error', 'Google authentication failed: ' . $e->getMessage());
        }
    }
}
