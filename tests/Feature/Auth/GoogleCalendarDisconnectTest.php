<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GoogleCalendarDisconnectTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_disconnects_google_calendar_revokes_token_and_resets_database(): void
    {
        $teacher = User::factory()->create([
            'role' => 'teacher',
            'google_connected' => true,
            'google_access_token' => 'access-token-123',
            'google_refresh_token' => 'refresh-token-456',
            'google_scopes' => ['openid', 'profile', 'email', 'https://www.googleapis.com/auth/calendar.events'],
        ]);

        Http::fake([
            'https://oauth2.googleapis.com/revoke' => Http::response(['success' => true], 200),
        ]);

        $response = $this->actingAs($teacher)->post('/auth/google/disconnect');

        $response->assertRedirect();
        $response->assertSessionHas('success');

        Http::assertSent(function (Request $request) {
            return $request->url() === 'https://oauth2.googleapis.com/revoke'
                && $request['token'] === 'refresh-token-456';
        });

        $fresh = $teacher->fresh();
        $this->assertFalse($fresh->google_connected);
        $this->assertNull($fresh->google_access_token);
        $this->assertNull($fresh->google_refresh_token);
        $this->assertNull($fresh->google_token_expires_at);
        $this->assertNull($fresh->google_scopes);
    }

    public function test_disconnect_succeeds_even_if_google_revocation_fails(): void
    {
        $teacher = User::factory()->create([
            'role' => 'teacher',
            'google_connected' => true,
            'google_access_token' => 'access-token-123',
            'google_refresh_token' => 'refresh-token-456',
        ]);

        Http::fake([
            'https://oauth2.googleapis.com/revoke' => Http::response(['error' => 'server_error'], 500),
        ]);

        $response = $this->actingAs($teacher)->post('/auth/google/disconnect');

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $fresh = $teacher->fresh();
        $this->assertFalse($fresh->google_connected);
        $this->assertNull($fresh->google_refresh_token);
    }

    public function test_account_deletion_revokes_google_token_when_user_is_connected(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('password'),
            'google_connected' => true,
            'google_refresh_token' => 'user-refresh-token-789',
        ]);

        Http::fake([
            'https://oauth2.googleapis.com/revoke' => Http::response(['success' => true], 200),
        ]);

        $response = $this->actingAs($user)->delete(route('profile.destroy'), [
            'password' => 'password',
        ]);

        $response->assertRedirect('/');
        $this->assertGuest();
        $this->assertNull(User::find($user->id));

        Http::assertSent(function (Request $request) {
            return $request->url() === 'https://oauth2.googleapis.com/revoke'
                && $request['token'] === 'user-refresh-token-789';
        });
    }

    public function test_account_deletion_succeeds_even_if_google_revocation_fails(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('password'),
            'google_connected' => true,
            'google_refresh_token' => 'user-refresh-token-789',
        ]);

        Http::fake([
            'https://oauth2.googleapis.com/revoke' => Http::response(['error' => 'timeout'], 504),
        ]);

        $response = $this->actingAs($user)->delete(route('profile.destroy'), [
            'password' => 'password',
        ]);

        $response->assertRedirect('/');
        $this->assertGuest();
        $this->assertNull(User::find($user->id));
    }
}
