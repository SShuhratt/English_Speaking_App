<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AuthPageLocalizationTest extends TestCase
{
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
        $response = $this->withUnencryptedCookie('locale', 'ru')->get('/register');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('auth/register')
            ->where('locale', 'ru')
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
}
