<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Fortify\Features;
use Tests\TestCase;

class RegistrationPasswordRulesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->skipUnlessFortifyHas(Features::registration());
    }

    public function test_register_page_shares_consistent_six_character_password_rules(): void
    {
        $response = $this->get(route('register'));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('auth/register')
                ->where('passwordRules', function (string $rules): bool {
                    return str_contains($rules, 'minlength: 6;')
                        && str_contains($rules, 'required: lower;')
                        && str_contains($rules, 'required: upper;')
                        && str_contains($rules, 'required: digit;')
                        && ! str_contains($rules, 'minlength: 12;')
                        && ! str_contains($rules, 'required: special;');
                })
            );
    }

    public function test_reset_password_and_security_pages_share_consistent_password_rules(): void
    {
        $user = User::factory()->create();

        $this->get(route('password.reset', ['token' => 'sample-token', 'email' => $user->email]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('auth/reset-password')
                ->where('passwordRules', function (string $rules): bool {
                    return str_contains($rules, 'minlength: 6;')
                        && str_contains($rules, 'required: lower;')
                        && str_contains($rules, 'required: upper;')
                        && str_contains($rules, 'required: digit;')
                        && ! str_contains($rules, 'minlength: 12;')
                        && ! str_contains($rules, 'required: special;');
                })
            );

        $this->actingAs($user)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->get(route('security.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('settings/security')
                ->where('passwordRules', function (string $rules): bool {
                    return str_contains($rules, 'minlength: 6;')
                        && str_contains($rules, 'required: lower;')
                        && str_contains($rules, 'required: upper;')
                        && str_contains($rules, 'required: digit;')
                        && ! str_contains($rules, 'minlength: 12;')
                        && ! str_contains($rules, 'required: special;');
                })
            );
    }

    public function test_registration_accepts_six_character_mixed_case_alphanumeric_password_without_symbols(): void
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Six Char User',
            'email' => 'sixchar@example.com',
            'password' => 'Abc123',
            'password_confirmation' => 'Abc123',
            'role' => 'pupil',
            'age' => 19,
            'phone_number' => '+998901234567',
            'level' => 'pre-intermediate',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'sixchar@example.com',
        ]);
    }

    public function test_registration_rejects_passwords_violating_each_rule(): void
    {
        $invalidPasswords = [
            'too_short' => 'Abc12',
            'missing_uppercase' => 'abc123',
            'missing_lowercase' => 'ABC123',
            'missing_number' => 'Abcdef',
        ];

        foreach ($invalidPasswords as $case => $password) {
            $response = $this->post(route('register.store'), [
                'name' => 'Invalid Password User',
                'email' => "invalid_{$case}@example.com",
                'password' => $password,
                'password_confirmation' => $password,
                'role' => 'pupil',
                'age' => 20,
                'phone_number' => '+998901234567',
                'level' => 'beginner',
            ]);

            $response->assertSessionHasErrors(['password']);
            $this->assertGuest();
            $this->assertDatabaseMissing('users', ['email' => "invalid_{$case}@example.com"]);
        }
    }

    public function test_registration_rejects_mismatched_password_confirmation(): void
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Mismatch User',
            'email' => 'mismatch@example.com',
            'password' => 'Abc123',
            'password_confirmation' => 'Abc124',
            'role' => 'pupil',
            'age' => 20,
            'phone_number' => '+998901234567',
            'level' => 'beginner',
        ]);

        $response->assertSessionHasErrors(['password']);
        $this->assertGuest();
    }

    public function test_reset_password_and_security_update_enforce_consistent_six_character_rules(): void
    {
        Notification::fake();

        $user = User::factory()->create();

        $this->post(route('password.email'), ['email' => $user->email]);

        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use ($user): bool {
            $invalidReset = $this->post(route('password.update'), [
                'token' => $notification->token,
                'email' => $user->email,
                'password' => 'abc12',
                'password_confirmation' => 'abc12',
            ]);

            $invalidReset->assertSessionHasErrors(['password']);

            $validReset = $this->post(route('password.update'), [
                'token' => $notification->token,
                'email' => $user->email,
                'password' => 'Abc123',
                'password_confirmation' => 'Abc123',
            ]);

            $validReset->assertSessionHasNoErrors()
                ->assertRedirect(route('login'));

            $this->assertTrue(Hash::check('Abc123', $user->fresh()->password));

            return true;
        });

        $user = $user->fresh();

        $invalidSecurityUpdate = $this->actingAs($user)
            ->from(route('security.edit'))
            ->put(route('user-password.update'), [
                'current_password' => 'Abc123',
                'password' => 'onlylower1',
                'password_confirmation' => 'onlylower1',
            ]);

        $invalidSecurityUpdate->assertSessionHasErrors(['password']);

        $validSecurityUpdate = $this->actingAs($user)
            ->from(route('security.edit'))
            ->put(route('user-password.update'), [
                'current_password' => 'Abc123',
                'password' => 'Xyz789',
                'password_confirmation' => 'Xyz789',
            ]);

        $validSecurityUpdate->assertSessionHasNoErrors()
            ->assertRedirect(route('security.edit'));

        $this->assertTrue(Hash::check('Xyz789', $user->fresh()->password));
    }

    public function test_google_registration_still_succeeds_without_user_supplied_password(): void
    {
        $response = $this->withSession([
            'google_register' => [
                'google_id' => 'google-pw-test-123',
                'name' => 'Google User',
                'email' => 'google_pw_test@example.com',
                'avatar' => 'https://example.com/avatar.png',
            ],
        ])->post(route('register.store'), [
            'name' => 'Google User',
            'email' => 'google_pw_test@example.com',
            'role' => 'pupil',
            'age' => 21,
            'phone_number' => '+998901234567',
            'level' => 'pre-intermediate',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'google_pw_test@example.com',
        ]);
    }
}
