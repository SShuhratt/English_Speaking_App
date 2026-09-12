<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\GoogleOAuthService;
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
        $isCalendar = $request->boolean('calendar') || $request->has('connect_calendar');

        if ($isCalendar) {
            return Socialite::driver('google')
                ->scopes([
                    'openid',
                    'profile',
                    'email',
                    'https://www.googleapis.com/auth/calendar.events',
                ])
                ->with([
                    'access_type' => 'offline',
                    'prompt' => 'consent select_account',
                    'include_granted_scopes' => 'true',
                ])
                ->redirect();
        }

        return Socialite::driver('google')
            ->scopes(['openid', 'profile', 'email'])
            ->with([
                'access_type' => 'offline',
                'prompt' => 'select_account',
                'include_granted_scopes' => 'true',
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

            $approvedScopes = $googleUser->approvedScopes ?? [];
            $hasCalendarScope = false;
            foreach ($approvedScopes as $scope) {
                if (str_contains($scope, 'calendar')) {
                    $hasCalendarScope = true;
                    break;
                }
            }

            if (! $user) {
                // Try to find existing user by email
                $existingUser = User::where('email', $googleUser->getEmail())->first();
                if ($existingUser) {
                    $refreshToken = $googleUser->refreshToken ?? $existingUser->google_refresh_token;
                    $isConnected = (bool) ($refreshToken && ($hasCalendarScope || $existingUser->google_connected));

                    $mergedScopes = array_values(array_unique(array_merge(
                        $existingUser->google_scopes ?? [],
                        $approvedScopes
                    )));

                    $updatePayload = [
                        'google_connected' => $isConnected,
                        'google_scopes' => $mergedScopes,
                    ];

                    if ($refreshToken) {
                        $updatePayload['google_refresh_token'] = $refreshToken;
                    }

                    // Only overwrite google_access_token if the incoming token contains calendar scope,
                    // or if the user doesn't have calendar connected. This prevents a basic Google login
                    // from downgrading an active calendar connection with a token lacking calendar permissions.
                    if ($hasCalendarScope || ! $existingUser->google_connected) {
                        $updatePayload['google_access_token'] = $googleUser->token;
                        $updatePayload['google_token_expires_at'] = now()->addSeconds($googleUser->expiresIn);
                    }

                    $existingUser->update($updatePayload);

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
                        'scopes' => $approvedScopes,
                    ],
                ]);

                return redirect()->route('register')->with('info', 'Google authenticated successfully. Please complete your registration details.');
            }

            // Connection flow for authenticated user (Incremental Calendar Authorization)
            $refreshToken = $googleUser->refreshToken ?? $user->google_refresh_token;
            $mergedScopes = array_values(array_unique(array_merge(
                $user->google_scopes ?? [],
                $approvedScopes
            )));

            $updatePayload = [
                'google_connected' => (bool) ($refreshToken && ($hasCalendarScope || $user->google_connected)),
                'google_scopes' => $mergedScopes,
            ];

            if ($refreshToken) {
                $updatePayload['google_refresh_token'] = $refreshToken;
            }

            if ($hasCalendarScope || ! $user->google_connected) {
                $updatePayload['google_access_token'] = $googleUser->token;
                $updatePayload['google_token_expires_at'] = now()->addSeconds($googleUser->expiresIn);
            }

            $user->update($updatePayload);

            return redirect()->route('dashboard')->with('success', 'Google Calendar connected successfully.');
        } catch (\Exception $e) {
            $redirectRoute = Auth::check() ? 'dashboard' : 'login';

            return redirect()->route($redirectRoute)->with('error', 'Google authentication failed: '.$e->getMessage());
        }
    }

    /**
     * Disconnect Google Calendar for the authenticated user and revoke remote access.
     */
    public function disconnect(Request $request, GoogleOAuthService $oauthService)
    {
        $user = Auth::user();
        if ($user) {
            $oauthService->revokeUserAccess($user);

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
