<?php

namespace Tests\Feature;

use App\Models\Appointment;
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
}
