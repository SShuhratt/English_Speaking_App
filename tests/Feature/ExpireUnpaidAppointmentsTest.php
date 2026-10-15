<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class ExpireUnpaidAppointmentsTest extends TestCase
{
    use RefreshDatabase;

    public function test_unpaid_appointments_older_than_60_minutes_are_expired_and_cancelled(): void
    {
        $teacher = User::factory()->teacher()->create();
        $pupil = User::factory()->pupil()->create();

        // 1. Appointment accepted 70 minutes ago with NO receipt (should be expired)
        $oldUnpaid = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addDays(2),
            'end_at' => now()->addDays(2)->addHour(),
            'status' => 'accepted',
            'payment_status' => 'verifying',
            'price' => 150000,
            'receipt_path' => null,
            'receipt_data' => null,
            'updated_at' => Carbon::now()->subMinutes(70),
        ]);
        // Force updated_at timestamp in DB
        Appointment::where('id', $oldUnpaid->id)->update([
            'updated_at' => Carbon::now()->subMinutes(70),
        ]);

        // 2. Appointment accepted 20 minutes ago with NO receipt (should NOT be expired)
        $recentUnpaid = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addDays(3),
            'end_at' => now()->addDays(3)->addHour(),
            'status' => 'accepted',
            'payment_status' => 'verifying',
            'price' => 150000,
            'receipt_path' => null,
            'receipt_data' => null,
            'updated_at' => Carbon::now()->subMinutes(20),
        ]);
        Appointment::where('id', $recentUnpaid->id)->update([
            'updated_at' => Carbon::now()->subMinutes(20),
        ]);

        // 3. Appointment accepted 80 minutes ago BUT has an uploaded receipt (should NOT be expired)
        $withReceipt = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addDays(4),
            'end_at' => now()->addDays(4)->addHour(),
            'status' => 'accepted',
            'payment_status' => 'verifying',
            'price' => 150000,
            'receipt_path' => 'receipts/test.jpg',
            'receipt_data' => ['is_payment_receipt' => true],
            'updated_at' => Carbon::now()->subMinutes(80),
        ]);
        Appointment::where('id', $withReceipt->id)->update([
            'updated_at' => Carbon::now()->subMinutes(80),
        ]);

        // 4. Prepaid package appointment (payment_status = paid, should NOT be expired)
        $packageApt = Appointment::create([
            'teacher_id' => $teacher->id,
            'pupil_id' => $pupil->id,
            'start_at' => now()->addDays(5),
            'end_at' => now()->addDays(5)->addHour(),
            'status' => 'confirmed',
            'payment_status' => 'paid',
            'is_package_booking' => true,
            'price' => 0,
            'updated_at' => Carbon::now()->subMinutes(90),
        ]);

        // Execute command
        $this->artisan('bookings:expire-unpaid')
            ->assertSuccessful();

        // Verify status
        $this->assertEquals('cancelled', $oldUnpaid->fresh()->status);
        $this->assertStringContainsString('expired', strtolower($oldUnpaid->fresh()->cancellation_reason ?? ''));

        $this->assertEquals('accepted', $recentUnpaid->fresh()->status);
        $this->assertEquals('accepted', $withReceipt->fresh()->status);
        $this->assertEquals('confirmed', $packageApt->fresh()->status);
    }
}
