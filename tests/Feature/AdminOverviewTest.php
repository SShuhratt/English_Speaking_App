<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Conversation;
use App\Models\Feedback;
use App\Models\PupilPackage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminOverviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_access_overview_page(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->get('/admin/overview');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('admin/overview')
            ->has('metrics')
            ->has('trends')
            ->has('matrix')
            ->has('timeline')
            ->has('recentTransactions')
            ->has('recentUsers')
            ->has('pendingVerificationsCount')
            ->where('period', 'this_month')
        );
    }

    public function test_non_admin_cannot_access_overview_page(): void
    {
        $pupil = User::factory()->create(['role' => 'pupil']);

        $response = $this->actingAs($pupil)->get('/admin/overview');

        $response->assertStatus(403);
    }

    public function test_admin_overview_calculates_revenue_without_double_counting_package_bookings(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        // 1. Direct confirmed booking (100,000 UZS)
        Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addHour(),
            'end_at' => now()->addHours(2),
            'status' => 'confirmed',
            'price' => 100000,
            'is_package_booking' => false,
        ]);

        // 2. Package booking confirmed session ($0 / is_package_booking = true)
        Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addDays(2),
            'end_at' => now()->addDays(2)->addHour(),
            'status' => 'confirmed',
            'price' => 0,
            'is_package_booking' => true,
        ]);

        // 3. Paid Conversation Pack (300,000 UZS)
        PupilPackage::create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'package_title' => '5-Hour Pack',
            'total_minutes' => 300,
            'remaining_minutes' => 240,
            'price_paid' => 300000,
            'payment_status' => 'paid',
            'status' => 'active',
        ]);

        $response = $this->actingAs($admin)->get('/admin/overview?period=this_month');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('admin/overview')
            ->where('metrics.direct_booking_revenue', 100000)
            ->where('metrics.package_sales_revenue', 300000)
            ->where('metrics.total_revenue', 400000)
            ->where('metrics.paid_transactions_count', 2)
        );
    }

    public function test_admin_overview_supports_period_filtering(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        foreach (['today', 'this_week', 'this_month', 'last_30_days', 'all_time'] as $period) {
            $response = $this->actingAs($admin)->get("/admin/overview?period={$period}");

            $response->assertStatus(200);
            $response->assertInertia(fn (Assert $page) => $page
                ->component('admin/overview')
                ->where('period', $period)
            );
        }
    }

    public function test_admin_can_filter_overview_by_specific_month_and_year(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $teacher = User::factory()->create(['role' => 'teacher']);
        $pupil = User::factory()->create(['role' => 'pupil']);

        // September 2026 booking (150,000 UZS)
        $sepBooking = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => '2026-09-10 10:00:00',
            'end_at' => '2026-09-10 11:00:00',
            'status' => 'confirmed',
            'price' => 150000,
            'is_package_booking' => false,
        ]);
        $sepBooking->created_at = '2026-09-10 10:00:00';
        $sepBooking->save();

        // August 2026 booking (200,000 UZS)
        $augBooking = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => '2026-08-15 10:00:00',
            'end_at' => '2026-08-15 11:00:00',
            'status' => 'confirmed',
            'price' => 200000,
            'is_package_booking' => false,
        ]);
        $augBooking->created_at = '2026-08-15 10:00:00';
        $augBooking->save();

        $response = $this->actingAs($admin)->get('/admin/overview?period=custom_month&year=2026&month=9');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('admin/overview')
            ->where('period', 'custom_month')
            ->where('selectedYear', 2026)
            ->where('selectedMonth', 9)
            ->where('metrics.direct_booking_revenue', 150000)
            ->where('metrics.total_revenue', 150000)
            ->where('metrics.paid_transactions_count', 1)
        );
    }

    public function test_admin_overview_timeline_contains_all_days_of_selected_month(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        // September 2026 has 30 days
        $sepResponse = $this->actingAs($admin)->get('/admin/overview?period=custom_month&year=2026&month=9');
        $sepResponse->assertStatus(200);
        $sepResponse->assertInertia(fn (Assert $page) => $page
            ->component('admin/overview')
            ->has('timeline', 30)
        );

        // October 2026 has 31 days
        $octResponse = $this->actingAs($admin)->get('/admin/overview?period=custom_month&year=2026&month=10');
        $octResponse->assertStatus(200);
        $octResponse->assertInertia(fn (Assert $page) => $page
            ->component('admin/overview')
            ->has('timeline', 31)
        );
    }

    public function test_admin_overview_handles_invalid_or_out_of_bounds_month_parameters(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->get('/admin/overview?period=custom_month&year=9999&month=99');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('admin/overview')
            ->where('period', 'custom_month')
            ->where('selectedYear', now()->year)
            ->where('selectedMonth', now()->month)
        );
    }

    public function test_admin_overview_calculates_satisfaction_rating_on_ten_point_scale(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $pupil = User::factory()->create(['role' => 'pupil']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        $conversation = Conversation::create([
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'started_at' => now(),
        ]);

        // 1. Pupil gives 8/10
        Feedback::create([
            'conversation_id' => $conversation->id,
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'rating_score' => 8,
            'comment_text' => 'Great lesson!',
        ]);

        // 2. Pupil gives 9/10
        Feedback::create([
            'conversation_id' => $conversation->id,
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'rating_score' => 9,
            'comment_text' => 'Very helpful lesson!',
        ]);

        // 3. Teacher feedback without rating_score (text-only)
        Feedback::create([
            'conversation_id' => $conversation->id,
            'pupil_id' => $pupil->id,
            'teacher_id' => $teacher->id,
            'rating_score' => null,
            'comment_text' => 'Pupil was attentive.',
        ]);

        $response = $this->actingAs($admin)->get('/admin/overview?period=this_month');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('admin/overview')
            ->where('metrics.satisfaction_rating', 8.5)
        );
    }

    public function test_admin_overview_satisfaction_rating_defaults_to_ten_when_no_feedbacks_exist(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->get('/admin/overview?period=this_month');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('admin/overview')
            ->where('metrics.satisfaction_rating', fn ($val) => (float) $val === 10.0)
        );
    }
}
