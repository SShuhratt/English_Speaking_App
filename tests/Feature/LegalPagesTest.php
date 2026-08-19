<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LegalPagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_privacy_policy_page_is_publicly_accessible(): void
    {
        $response = $this->get(route('privacy'));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('privacy')
            );
    }

    public function test_terms_of_service_page_is_publicly_accessible(): void
    {
        $response = $this->get(route('terms'));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('terms')
            );
    }

    public function test_authenticated_user_can_access_legal_pages(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('privacy'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('privacy'));

        $this->actingAs($user)
            ->get(route('terms'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('terms'));
    }
}
