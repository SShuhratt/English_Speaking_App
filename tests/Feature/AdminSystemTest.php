<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminSystemTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admin_users_cannot_access_admin_dashboard(): void
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        $this->actingAs($pupil)->get('/admin/dashboard')->assertStatus(403);
        $this->actingAs($teacher)->get('/admin/dashboard')->assertStatus(403);
    }

    public function test_admin_user_can_access_admin_pages(): void
    {
        $admin = User::factory()->create([
            'email' => 'shuhratodilbekov513@gmail.com',
            'role' => 'admin',
        ]);

        $this->actingAs($admin)->get('/admin/dashboard')->assertStatus(200);
        $this->actingAs($admin)->get('/admin/teachers')->assertStatus(200);
        $this->actingAs($admin)->get('/admin/pupils')->assertStatus(200);
        $this->actingAs($admin)->get('/admin/support')->assertStatus(200);
    }

    public function test_payment_verification_lifecycle(): void
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);
        $admin = User::factory()->create(['role' => 'admin']);

        $appointment = Appointment::create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addMinutes(30),
            'status' => 'pending',
        ]);

        // Teacher approves appointment -> status becomes accepted (verifying...)
        $this->actingAs($teacher)
            ->post("/teacher/appointments/{$appointment->id}/approve")
            ->assertStatus(200);

        $appointment->refresh();
        $this->assertEquals('accepted', $appointment->status);
        $this->assertEquals('verifying', $appointment->payment_status);

        // Admin confirms payment -> status becomes confirmed
        $this->actingAs($admin)
            ->post("/admin/appointments/{$appointment->id}/confirm-payment")
            ->assertStatus(302);

        $appointment->refresh();
        $this->assertEquals('confirmed', $appointment->status);
        $this->assertEquals('paid', $appointment->payment_status);
    }

    public function test_admin_can_reject_payment_with_reason(): void
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);
        $admin = User::factory()->create(['role' => 'admin']);

        $appointment = Appointment::create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addMinutes(30),
            'status' => 'accepted',
            'payment_status' => 'verifying',
        ]);

        $this->actingAs($admin)
            ->post("/admin/appointments/{$appointment->id}/reject-payment", [
                'reason' => 'Invalid payment receipt',
            ])
            ->assertStatus(302);

        $appointment->refresh();
        $this->assertEquals('rejected', $appointment->status);
        $this->assertEquals('rejected', $appointment->payment_status);
        $this->assertEquals('Invalid payment receipt', $appointment->payment_rejection_reason);
    }

    public function test_support_messages_and_unread_count(): void
    {
        $pupil = User::factory()->create(['role' => 'pupil']);
        $admin = User::factory()->create(['role' => 'admin']);

        // Pupil sends support ticket
        $this->actingAs($pupil)
            ->post('/support', [
                'subject' => 'Payment Question',
                'message' => 'How do I pay for my session?',
            ])
            ->assertStatus(302);

        $this->assertDatabaseHas('support_messages', [
            'user_id' => $pupil->id,
            'subject' => 'Payment Question',
            'is_read_by_admin' => false,
        ]);

        // Admin views support page with user thread
        $this->actingAs($admin)
            ->get("/admin/support?user_id={$pupil->id}")
            ->assertStatus(200);

        // Admin reply
        $this->actingAs($admin)
            ->post('/admin/support/reply', [
                'user_id' => $pupil->id,
                'subject' => 'Payment Answer',
                'message' => 'You can pay via cards.',
            ])
            ->assertStatus(302);

        $this->assertDatabaseHas('support_messages', [
            'user_id' => $pupil->id,
            'admin_id' => $admin->id,
            'is_read_by_user' => false,
        ]);
    }

    public function test_admin_teacher_verification_and_filtering(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $teacher = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $teacher->id,
            'age' => 30,
            'phone_number' => '123456',
            'overall_level' => 'CEFR C1',
            'speaking_band' => '8.0',
            'is_verified' => false,
        ]);

        // Admin toggles verification
        $this->actingAs($admin)
            ->post("/admin/teachers/{$teacher->id}/verify", ['verified' => true])
            ->assertStatus(302);

        $this->assertDatabaseHas('teacher_profiles', [
            'user_id' => $teacher->id,
            'is_verified' => true,
        ]);
    }
}
