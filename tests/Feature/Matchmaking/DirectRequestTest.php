<?php

namespace Tests\Feature\Matchmaking;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

class DirectRequestTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Clear Redis testing database
        Redis::flushdb();
    }

    public function test_teacher_cannot_access_speaking_page_or_matchmaking()
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        // Speaking page
        $response = $this
            ->actingAs($teacher)
            ->get(route('speaking'));

        $response->assertStatus(403);

        // Join matchmaking
        $response = $this
            ->actingAs($teacher)
            ->post(route('matchmaking.join'));

        $response->assertStatus(403);
    }

    public function test_pupil_can_access_speaking_page()
    {
        $pupil = User::factory()->create(['role' => 'pupil']);

        $response = $this
            ->actingAs($pupil)
            ->get(route('speaking'));

        $response->assertOk();
    }

    public function test_pupil_can_send_direct_matchmaking_request()
    {
        $pupilA = User::factory()->create(['role' => 'pupil']);
        $pupilB = User::factory()->create(['role' => 'pupil']);

        // Pupil A sends a direct matchmaking request to Pupil B
        $response = $this
            ->actingAs($pupilA)
            ->post(route('matchmaking.request'), [
                'receiver_id' => $pupilB->id,
            ]);

        $response->assertOk();
        $response->assertJson(['status' => 'requested']);

        // Pupil B sends a heartbeat and sees Pupil A's request
        $response = $this
            ->actingAs($pupilB)
            ->post(route('matchmaking.heartbeat'));

        $response->assertOk();
        $data = $response->json();
        
        $this->assertCount(1, $data['incoming_requests']);
        $this->assertEquals($pupilA->id, $data['incoming_requests'][0]['id']);
    }

    public function test_pupil_can_decline_direct_request()
    {
        $pupilA = User::factory()->create(['role' => 'pupil']);
        $pupilB = User::factory()->create(['role' => 'pupil']);

        // Pupil A requests B
        $this->actingAs($pupilA)->post(route('matchmaking.request'), ['receiver_id' => $pupilB->id]);

        // Pupil B declines
        $response = $this
            ->actingAs($pupilB)
            ->post(route('matchmaking.decline'), [
                'sender_id' => $pupilA->id,
            ]);

        $response->assertOk();
        $response->assertJson(['status' => 'declined']);

        // Heartbeat has no more incoming requests
        $response = $this->actingAs($pupilB)->post(route('matchmaking.heartbeat'));
        $response->assertOk();
        $this->assertEmpty($response->json()['incoming_requests']);
    }

    public function test_pupil_can_accept_direct_request_creating_session()
    {
        $pupilA = User::factory()->create(['role' => 'pupil']);
        $pupilB = User::factory()->create(['role' => 'pupil']);

        // Heartbeat sets online presence
        $this->actingAs($pupilA)->post(route('matchmaking.heartbeat'));
        $this->actingAs($pupilB)->post(route('matchmaking.heartbeat'));

        // Pupil A requests B
        $this->actingAs($pupilA)->post(route('matchmaking.request'), ['receiver_id' => $pupilB->id]);

        // Pupil B accepts
        $response = $this
            ->actingAs($pupilB)
            ->post(route('matchmaking.accept'), [
                'sender_id' => $pupilA->id,
            ]);

        $response->assertOk();
        $response->assertJsonStructure(['status', 'room_id', 'partner_id']);

        // Active session is created for both in Redis
        $this->assertNotEmpty(Redis::get("active_speaking_session:{$pupilA->id}"));
        $this->assertNotEmpty(Redis::get("active_speaking_session:{$pupilB->id}"));
    }
}
