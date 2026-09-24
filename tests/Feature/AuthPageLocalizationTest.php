<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AuthPageLocalizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_page_shares_locale_from_cookie(): void
    {
        $response = $this->withUnencryptedCookie('locale', 'uz')->get('/login');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('auth/login')
            ->where('locale', 'uz')
        );
    }

    public function test_register_page_shares_locale_from_cookie(): void
    {
        $response = $this->withUnencryptedCookie('locale', 'uz')->get('/register');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('auth/register')
            ->where('locale', 'uz')
        );
    }

    public function test_forgot_password_page_shares_locale_from_cookie(): void
    {
        $response = $this->withUnencryptedCookie('locale', 'uz')->get('/forgot-password');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('auth/forgot-password')
            ->where('locale', 'uz')
        );
    }

    public function test_teacher_can_register_without_teaching_focus_labels(): void
    {
        $response = $this->post(route('register.store'), [
            'name' => 'No Labels Teacher',
            'email' => 'teacher_no_labels@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'teacher',
            'age' => 29,
            'phone_number' => '+998901234567',
            'price' => 50000,
        ]);

        $this->assertAuthenticated();
        $user = User::where('email', 'teacher_no_labels@example.com')->first();
        $this->assertNotNull($user);
        $this->assertNotNull($user->teacherProfile);
        $this->assertNull($user->teacherProfile->labels);
    }
}
