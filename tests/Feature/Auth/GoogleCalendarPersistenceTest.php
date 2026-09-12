<?php

namespace Tests\Feature\Auth;

use App\Models\Appointment;
use App\Models\User;
use App\Services\GoogleCalendarService;
use App\Services\GoogleOAuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Mockery;
use Tests\TestCase;

class GoogleCalendarPersistenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_with_google_does_not_downgrade_or_wipe_calendar_access_token_or_scopes(): void
    {
        $teacher = User::factory()->create([
            'role' => 'teacher',
            'email' => 'teacher@example.com',
            'google_connected' => true,
            'google_access_token' => 'existing-calendar-access-token',
            'google_refresh_token' => 'long-lived-refresh-token',
            'google_token_expires_at' => now()->addMinutes(45),
            'google_scopes' => ['openid', 'profile', 'email', 'https://www.googleapis.com/auth/calendar.events'],
        ]);

        $googleUser = Mockery::mock(SocialiteUser::class);
        $googleUser->shouldReceive('getId')->andReturn('google-id-123');
        $googleUser->shouldReceive('getEmail')->andReturn('teacher@example.com');
        $googleUser->shouldReceive('getName')->andReturn($teacher->full_name);
        $googleUser->token = 'basic-profile-only-token';
        $googleUser->refreshToken = null;
        $googleUser->expiresIn = 3600;
        $googleUser->approvedScopes = ['openid', 'profile', 'email'];

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider = Mockery::mock());
        $provider->shouldReceive('user')->andReturn($googleUser);

        $response = $this->get('/auth/google/callback');

        $response->assertRedirect(route('dashboard'));
        $this->assertAuthenticatedAs($teacher);

        $freshTeacher = $teacher->fresh();
        $this->assertTrue($freshTeacher->google_connected);
        $this->assertEquals('long-lived-refresh-token', $freshTeacher->google_refresh_token);
        // Calendar access token must NOT have been replaced with the basic profile-only token
        $this->assertEquals('existing-calendar-access-token', $freshTeacher->google_access_token);
        $this->assertContains('https://www.googleapis.com/auth/calendar.events', $freshTeacher->google_scopes);
    }

    public function test_get_valid_access_token_auto_refreshes_when_expired(): void
    {
        $teacher = User::factory()->create([
            'role' => 'teacher',
            'google_connected' => true,
            'google_access_token' => 'expired-token',
            'google_refresh_token' => 'valid-refresh-token',
            'google_token_expires_at' => now()->subHour(),
        ]);

        Http::fake([
            'https://oauth2.googleapis.com/token' => Http::response([
                'access_token' => 'new-refreshed-token',
                'expires_in' => 3600,
            ], 200),
        ]);

        $oauthService = app(GoogleOAuthService::class);
        $token = $oauthService->getValidAccessToken($teacher);

        $this->assertEquals('new-refreshed-token', $token);
        $fresh = $teacher->fresh();
        $this->assertEquals('new-refreshed-token', $fresh->google_access_token);
        $this->assertTrue($fresh->google_connected);
        $this->assertTrue($fresh->google_token_expires_at->isAfter(now()->addMinutes(50)));
    }

    public function test_get_valid_access_token_persists_rotated_refresh_token(): void
    {
        $teacher = User::factory()->create([
            'role' => 'teacher',
            'google_connected' => true,
            'google_access_token' => 'expired-token',
            'google_refresh_token' => 'old-refresh-token',
            'google_token_expires_at' => now()->subHour(),
        ]);

        Http::fake([
            'https://oauth2.googleapis.com/token' => Http::response([
                'access_token' => 'new-access-token',
                'expires_in' => 3600,
                'refresh_token' => 'new-rotated-refresh-token',
            ], 200),
        ]);

        $oauthService = app(GoogleOAuthService::class);
        $token = $oauthService->getValidAccessToken($teacher);

        $this->assertEquals('new-access-token', $token);
        $fresh = $teacher->fresh();
        $this->assertEquals('new-rotated-refresh-token', $fresh->google_refresh_token);
    }

    public function test_google_calendar_create_event_retries_with_force_refresh_on_401_or_403(): void
    {
        $teacher = User::factory()->create([
            'role' => 'teacher',
            'google_connected' => true,
            'google_access_token' => 'forbidden-token',
            'google_refresh_token' => 'valid-refresh-token',
            'google_token_expires_at' => now()->addMinutes(30),
        ]);

        $callCount = 0;

        Http::fake([
            'https://oauth2.googleapis.com/token' => Http::response([
                'access_token' => 'freshly-authorized-token',
                'expires_in' => 3600,
            ], 200),
            'https://www.googleapis.com/calendar/v3/calendars/primary/events*' => function ($request) use (&$callCount) {
                $callCount++;
                if ($callCount === 1) {
                    // First call with old token fails with 403 Insufficient Permission
                    return Http::response([
                        'error' => [
                            'code' => 403,
                            'message' => 'Insufficient Permission',
                        ],
                    ], 403);
                }

                // Second call with freshly refreshed token succeeds
                return Http::response([
                    'id' => 'google-event-789',
                    'hangoutLink' => 'https://meet.google.com/xyz-uvwx-rst',
                    'htmlLink' => 'https://calendar.google.com/event?eid=789',
                ], 200);
            },
        ]);

        $calendarService = app(GoogleCalendarService::class);
        $event = $calendarService->createEvent($teacher, [
            'title' => 'Test Meeting',
            'start' => now()->toIso8601String(),
            'end' => now()->addHour()->toIso8601String(),
        ]);

        $this->assertEquals('google-event-789', $event['event_id']);
        $this->assertEquals('https://meet.google.com/xyz-uvwx-rst', $event['meet_link']);
        $this->assertEquals(2, $callCount);
    }

    public function test_transient_error_does_not_set_requires_google_calendar_in_appointment_start(): void
    {
        $teacher = User::factory()->create([
            'role' => 'teacher',
            'google_connected' => true,
            'google_access_token' => 'valid-token',
            'google_refresh_token' => 'valid-refresh-token',
            'google_token_expires_at' => now()->addMinutes(30),
        ]);

        $pupil = User::factory()->create(['role' => 'pupil']);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addMinutes(10),
            'end_at' => now()->addMinutes(70),
            'status' => 'confirmed',
            'google_meet_link' => null,
            'google_event_id' => null,
        ]);

        Http::fake([
            'https://www.googleapis.com/calendar/v3/calendars/primary/events*' => Http::response([
                'error' => 'Service Unavailable',
            ], 503),
        ]);

        $response = $this->actingAs($teacher)->postJson("/teacher/appointments/{$appointment->id}/start");

        $response->assertStatus(422);
        $response->assertJson([
            'requires_google_calendar' => false,
        ]);
        $this->assertStringContainsString('temporary', strtolower($response->json('message')));

        $freshTeacher = $teacher->fresh();
        $this->assertTrue($freshTeacher->google_connected);
        $this->assertEquals('valid-refresh-token', $freshTeacher->google_refresh_token);
    }

    public function test_permanent_revocation_invalid_grant_resets_connection_and_requires_reconnect(): void
    {
        $teacher = User::factory()->create([
            'role' => 'teacher',
            'google_connected' => true,
            'google_access_token' => 'expired-token',
            'google_refresh_token' => 'revoked-refresh-token',
            'google_token_expires_at' => now()->subHour(),
        ]);

        $pupil = User::factory()->create(['role' => 'pupil']);

        $appointment = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addMinutes(10),
            'end_at' => now()->addMinutes(70),
            'status' => 'confirmed',
            'google_meet_link' => null,
            'google_event_id' => null,
        ]);

        Http::fake([
            'https://oauth2.googleapis.com/token' => Http::response([
                'error' => 'invalid_grant',
                'error_description' => 'Token has been expired or revoked.',
            ], 400),
        ]);

        $response = $this->actingAs($teacher)->postJson("/teacher/appointments/{$appointment->id}/start");

        $response->assertStatus(422);
        $response->assertJson([
            'requires_google_calendar' => true,
            'connect_url' => '/auth/google?calendar=1',
        ]);

        $freshTeacher = $teacher->fresh();
        $this->assertFalse($freshTeacher->google_connected);
        $this->assertNull($freshTeacher->google_refresh_token);
    }
}
