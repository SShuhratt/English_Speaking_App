<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SetLocaleTest extends TestCase
{
    public function test_default_locale_is_english(): void
    {
        $response = $this->get('/');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->where('locale', 'en')
        );
    }

    public function test_locale_cookie_uzbek_sets_locale_to_uz(): void
    {
        $response = $this->withUnencryptedCookie('locale', 'uz')->get('/');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->where('locale', 'uz')
        );
    }

    public function test_locale_cookie_russian_sets_locale_to_ru(): void
    {
        $response = $this->withUnencryptedCookie('locale', 'ru')->get('/');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->where('locale', 'ru')
        );
    }

    public function test_invalid_locale_cookie_falls_back_to_english(): void
    {
        $response = $this->withUnencryptedCookie('locale', 'fr')->get('/');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->where('locale', 'en')
        );
    }
}
