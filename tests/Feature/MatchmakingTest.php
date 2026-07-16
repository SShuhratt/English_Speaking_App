<?php

namespace Tests\Feature;

use App\Events\UserMatched;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

class MatchmakingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Clear Redis matchmaking queue before each test
        Redis::del('speaking_matchmaking_queue');
    }

    public function test_user_can_join_matchmaking_queue_and_gets_waiting(): void
    {
        $user = User::factory()->create(['role' => 'pupil']);

        $response = $this->actingAs($user)->postJson(route('matchmaking.join'));

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'waiting',
        ]);

        $this->assertEquals(1, Redis::llen('speaking_matchmaking_queue'));
    }

    public function test_two_users_are_matched_instantly(): void
    {
        Event::fake([UserMatched::class]);

        $user1 = User::factory()->create(['role' => 'pupil']);
        $user2 = User::factory()->create(['role' => 'pupil']);

        // User 1 joins queue
        $this->actingAs($user1)->postJson(route('matchmaking.join'));

        // User 2 joins queue
        $response = $this->actingAs($user2)->postJson(route('matchmaking.join'));

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'matched',
            'partner_id' => $user1->id,
        ]);

        $this->assertNotNull($response->json('room_id'));

        // Assert UserMatched events were dispatched
        Event::assertDispatched(UserMatched::class, function ($event) use ($user1, $user2) {
            return $event->userId === $user1->id && $event->partnerId === $user2->id;
        });

        Event::assertDispatched(UserMatched::class, function ($event) use ($user1, $user2) {
            return $event->userId === $user2->id && $event->partnerId === $user1->id;
        });

        // Queue should be empty now
        $this->assertEquals(0, Redis::llen('speaking_matchmaking_queue'));
    }

    public function test_user_can_leave_matchmaking_queue(): void
    {
        $user = User::factory()->create(['role' => 'pupil']);

        // Join queue
        $this->actingAs($user)->postJson(route('matchmaking.join'));
        $this->assertEquals(1, Redis::llen('speaking_matchmaking_queue'));

        // Leave queue
        $response = $this->actingAs($user)->postJson(route('matchmaking.leave'));
        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'left',
        ]);

        $this->assertEquals(0, Redis::llen('speaking_matchmaking_queue'));
    }

    public function test_user_can_retrieve_active_speaking_session(): void
    {
        $user1 = User::factory()->create(['role' => 'pupil', 'full_name' => 'Alice']);
        $user2 = User::factory()->create(['role' => 'pupil', 'full_name' => 'Bob']);

        // Directly seed active session in Redis
        $session = json_encode(['room_id' => 'room_1_2', 'partner_id' => $user2->id]);
        Redis::set("active_speaking_session:{$user1->id}", $session);

        $response = $this->actingAs($user1)->getJson(route('matchmaking.active-session'));

        $response->assertStatus(200);
        $response->assertJson([
            'room_id' => 'room_1_2',
            'partner_id' => $user2->id,
            'partner_name' => 'Bob',
        ]);
    }

    public function test_heartbeat_keeps_session_alive_or_terminates_if_partner_offline(): void
    {
        $user1 = User::factory()->create(['role' => 'pupil']);
        $user2 = User::factory()->create(['role' => 'pupil']);

        // Seed active session
        $session1 = json_encode(['room_id' => 'room_1_2', 'partner_id' => $user2->id]);
        $session2 = json_encode(['room_id' => 'room_1_2', 'partner_id' => $user1->id]);
        Redis::set("active_speaking_session:{$user1->id}", $session1);
        Redis::set("active_speaking_session:{$user2->id}", $session2);

        // Seed user2 heartbeat key to mimic them being active
        Redis::setex("speaking_heartbeat:{$user2->id}", 30, 'active');

        // Heartbeat initially checks and user1 is alive
        $response = $this->actingAs($user1)->postJson(route('matchmaking.heartbeat'));
        $response->assertStatus(200);
        $response->assertJson(['status' => 'alive']);

        // Delete user2's heartbeat to simulate offline status
        Redis::del("speaking_heartbeat:{$user2->id}");

        $response = $this->actingAs($user1)->postJson(route('matchmaking.heartbeat'));
        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'terminated',
            'reason' => 'partner_offline',
        ]);

        $this->assertNull(Redis::get("active_speaking_session:{$user1->id}"));
    }
}
