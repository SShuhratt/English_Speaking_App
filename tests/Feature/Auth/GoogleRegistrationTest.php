<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Services\GoogleOAuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Mockery;
use Tests\TestCase;

class GoogleRegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_google_redirect_works(): void
    {
        $response = $this->get('/auth/google');
        $response->assertRedirect();
        $this->assertStringContainsString('accounts.google.com', $response->headers->get('Location'));
    }

    public function test_google_callback_logs_in_existing_user(): void
    {
        $user = User::factory()->create([
            'email' => 'existing@example.com',
            'full_name' => 'Existing User',
        ]);

        $googleUser = Mockery::mock(SocialiteUser::class);
        $googleUser->shouldReceive('getId')->andReturn('google-id-123');
        $googleUser->shouldReceive('getEmail')->andReturn('existing@example.com');
        $googleUser->shouldReceive('getName')->andReturn('Existing User');
        $googleUser->token = 'mock-access-token';
        $googleUser->refreshToken = 'mock-refresh-token';
        $googleUser->expiresIn = 3600;
        $googleUser->approvedScopes = ['https://www.googleapis.com/auth/calendar.events'];

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider = Mockery::mock());
        $provider->shouldReceive('user')->andReturn($googleUser);

        $response = $this->get('/auth/google/callback');

        $response->assertRedirect(route('dashboard'));
        $this->assertAuthenticatedAs($user);
        $this->assertTrue($user->fresh()->google_connected);
    }

    public function test_google_callback_redirects_new_user_to_register_with_session(): void
    {
        $googleUser = Mockery::mock(SocialiteUser::class);
        $googleUser->shouldReceive('getId')->andReturn('google-id-123');
        $googleUser->shouldReceive('getEmail')->andReturn('newuser@example.com');
        $googleUser->shouldReceive('getName')->andReturn('New User');
        $googleUser->token = 'mock-access-token';
        $googleUser->refreshToken = 'mock-refresh-token';
        $googleUser->expiresIn = 3600;
        $googleUser->approvedScopes = ['https://www.googleapis.com/auth/calendar.events'];

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider = Mockery::mock());
        $provider->shouldReceive('user')->andReturn($googleUser);

        $response = $this->get('/auth/google/callback');

        $response->assertRedirect(route('register'));
        $response->assertSessionHas('google_register');
        $this->assertEquals('newuser@example.com', session('google_register.email'));
    }

    public function test_register_user_with_google_session_bypasses_email_verification(): void
    {
        session([
            'google_register' => [
                'email' => 'googlepupil@example.com',
                'name' => 'Google Pupil',
                'google_id' => 'google-id-123',
                'google_token' => 'mock-access-token',
                'google_refresh_token' => 'mock-refresh-token',
                'google_expires_in' => 3600,
            ],
        ]);

        $response = $this->post(route('register.store'), [
            'role' => 'pupil',
            'age' => 18,
            'phone_number' => '+1234567890',
            'level' => 'pre-intermediate',
        ]);

        $response->assertRedirect(route('dashboard'));
        $this->assertAuthenticated();

        $user = User::where('email', 'googlepupil@example.com')->first();
        $this->assertNotNull($user);
        $this->assertNotNull($user->email_verified_at);
        $this->assertFalse($user->google_connected);
        $this->assertFalse($user->has_password);
        $this->assertEquals('Google Pupil', $user->full_name);
    }

    public function test_user_can_disconnect_google_calendar(): void
    {
        $user = User::factory()->create([
            'google_connected' => true,
            'google_access_token' => 'access-token',
            'google_refresh_token' => 'refresh-token',
        ]);

        $response = $this->actingAs($user)->post('/auth/google/disconnect');

        $response->assertRedirect();
        $freshUser = $user->fresh();
        $this->assertFalse($freshUser->google_connected);
        $this->assertNull($freshUser->google_access_token);
        $this->assertNull($freshUser->google_refresh_token);
    }

    public function test_revoked_token_resets_google_connected_status(): void
    {
        $user = User::factory()->create([
            'google_connected' => true,
            'google_access_token' => 'expired-token',
            'google_refresh_token' => 'revoked-token',
            'google_token_expires_at' => now()->subHour(),
        ]);

        Http::fake([
            'https://oauth2.googleapis.com/token' => Http::response([
                'error' => 'invalid_grant',
                'error_description' => 'Token has been expired or revoked.',
            ], 400),
        ]);

        $oauthService = app(GoogleOAuthService::class);

        try {
            $oauthService->getValidAccessToken($user);
        } catch (\Exception $e) {
            // expected
        }

        $freshUser = $user->fresh();
        $this->assertFalse($freshUser->google_connected);
        $this->assertNull($freshUser->google_refresh_token);
    }
}
