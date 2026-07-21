<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PupilProgressRoadmapTest extends TestCase
{
    use RefreshDatabase;

    public function test_pupil_progress_loads_4_week_goals_array(): void
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $pupil->pupilProfile()->create([
            'weekly_goal' => 3,
            'weekly_goals' => [3, 2, 5, 4],
        ]);

        $response = $this->actingAs($pupil)->get('/pupil/progress');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('pupil/progress')
            ->where('progress.weekly_goals', [3, 2, 5, 4])
        );
    }

    public function test_pupil_can_update_custom_4_week_goals(): void
    {
        $pupil = User::factory()->create(['role' => 'pupil']);

        $response = $this->actingAs($pupil)->post('/pupil/progress/goal', [
            'weekly_goals' => [3, 2, 5, 4],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('pupil_profiles', [
            'user_id' => $pupil->id,
            'weekly_goal' => 3,
        ]);

        $profile = $pupil->fresh()->pupilProfile;
        $this->assertEquals([3, 2, 5, 4], $profile->weekly_goals);
    }

    public function test_pupil_goal_update_fails_if_value_exceeds_350(): void
    {
        $pupil = User::factory()->create(['role' => 'pupil']);

        $response = $this->actingAs($pupil)->post('/pupil/progress/goal', [
            'weekly_goals' => [3, 400, 2, 5],
        ]);

        $response->assertSessionHasErrors(['weekly_goals.1']);
    }
}
