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
        $user = User::factory()->create();

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

        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        // User 1 joins queue
        $this->actingAs($user1)->postJson(route('matchmaking.join'));

        // User 2 joins queue
        $response = $this->actingAs($user2)->postJson(route('matchmaking.join'));

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'matched',
            'opponent_id' => $user1->id,
        ]);

        $this->assertNotNull($response->json('room_id'));

        // Assert UserMatched events were dispatched
        Event::assertDispatched(UserMatched::class, function ($event) use ($user1, $user2) {
            return $event->userId === $user1->id && $event->opponentId === $user2->id;
        });

        Event::assertDispatched(UserMatched::class, function ($event) use ($user1, $user2) {
            return $event->userId === $user2->id && $event->opponentId === $user1->id;
        });

        // Queue should be empty now
        $this->assertEquals(0, Redis::llen('speaking_matchmaking_queue'));
    }

    public function test_user_can_leave_matchmaking_queue(): void
    {
        $user = User::factory()->create();

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
}
