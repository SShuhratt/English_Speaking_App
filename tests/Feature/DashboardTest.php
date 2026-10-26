<?php

namespace Tests\Feature;

use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertOk();
    }

    public function test_teacher_dashboard_loads_with_cached_conversation_stats(): void
    {
        $teacher = User::factory()->teacher()->create();

        $response = $this->actingAs($teacher)->get(route('dashboard'));
        $response->assertOk();

        $this->assertTrue(Cache::has("teacher_conv_stats_{$teacher->id}"));

        $cached = Cache::get("teacher_conv_stats_{$teacher->id}");
        $this->assertIsArray($cached);
        $this->assertArrayHasKey('total_conversations', $cached);
        $this->assertArrayHasKey('total_minutes', $cached);

        TeacherProfile::clearConversationStatsCache($teacher->id);
        $this->assertFalse(Cache::has("teacher_conv_stats_{$teacher->id}"));
    }

    public function test_font_stylesheet_is_non_render_blocking_in_layout(): void
    {
        $response = $this->get(route('login'));
        $response->assertOk();

        $response->assertSee('rel="preload" as="style"', false);
        $response->assertSee('media="print" onload="this.media=\'all\'"', false);
    }
}
