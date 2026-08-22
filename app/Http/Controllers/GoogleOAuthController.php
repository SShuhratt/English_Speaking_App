<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GoogleOAuthController extends Controller
{
    /**
     * Redirect the user to the Google authentication page.
     */
    public function redirect(Request $request)
    {
        $scopes = ['openid', 'profile', 'email'];

        if ($request->boolean('calendar') || $request->has('connect_calendar')) {
            $scopes[] = 'https://www.googleapis.com/auth/calendar.events';
        }

        return Socialite::driver('google')
            ->scopes($scopes)
            ->with([
                'access_type' => 'offline',
                'prompt' => 'select_account',
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

            if (! $user) {
                // Try to find existing user by email
                $existingUser = User::where('email', $googleUser->getEmail())->first();
                if ($existingUser) {
                    $approvedScopes = $googleUser->approvedScopes ?? [];
                    $hasCalendarScope = false;
                    foreach ($approvedScopes as $scope) {
                        if (str_contains($scope, 'calendar')) {
                            $hasCalendarScope = true;
                            break;
                        }
                    }

                    $existingUser->update([
                        'google_connected' => $existingUser->google_connected || $hasCalendarScope,
                        'google_access_token' => $googleUser->token,
                        'google_refresh_token' => $googleUser->refreshToken ?? $existingUser->google_refresh_token,
                        'google_token_expires_at' => now()->addSeconds($googleUser->expiresIn),
                        'google_scopes' => ! empty($approvedScopes) ? $approvedScopes : $existingUser->google_scopes,
                    ]);

                    Auth::login($existingUser);

                    return redirect()->route('dashboard')->with('success', 'Logged in with Google successfully.');
                }

                // New user - store in session for registration prefill and verification bypass
                session([
                    'google_register' => [
                        'email' => $googleUser->getEmail(),
                        'name' => $googleUser->getName(),
                        'google_id' => $googleUser->getId(),
                        'google_token' => $googleUser->token,
                        'google_refresh_token' => $googleUser->refreshToken,
                        'google_expires_in' => $googleUser->expiresIn,
                    ],
                ]);

                return redirect()->route('register')->with('info', 'Google authenticated successfully. Please complete your registration details.');
            }

            // Connection flow for authenticated user
            $user->update([
                'google_connected' => true,
                'google_access_token' => $googleUser->token,
                'google_refresh_token' => $googleUser->refreshToken ?? $user->google_refresh_token,
                'google_token_expires_at' => now()->addSeconds($googleUser->expiresIn),
                'google_scopes' => $googleUser->approvedScopes ?? [],
            ]);

            return redirect()->route('dashboard')->with('success', 'Google account connected successfully.');
        } catch (\Exception $e) {
            $redirectRoute = Auth::check() ? 'dashboard' : 'login';

            return redirect()->route($redirectRoute)->with('error', 'Google authentication failed: '.$e->getMessage());
        }
    }

    /**
     * Disconnect Google Calendar for the authenticated user.
     */
    public function disconnect(Request $request)
    {
        $user = Auth::user();
        if ($user) {
            $user->update([
                'google_connected' => false,
                'google_access_token' => null,
                'google_refresh_token' => null,
                'google_token_expires_at' => null,
                'google_scopes' => null,
            ]);
        }

        return back()->with('success', 'Google Calendar disconnected successfully.');
    }
}
