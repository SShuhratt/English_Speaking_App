<?php

namespace App\Console\Commands;

use App\Events\BookingUpdated;
use App\Models\Appointment;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ExpireUnpaidAppointmentsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bookings:expire-unpaid {--minutes=60 : The expiration threshold in minutes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically cancel accepted bookings that have not been paid within 60 minutes';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $minutes = (int) $this->option('minutes');
        $cutoff = Carbon::now()->subMinutes($minutes);

        $expiredAppointments = Appointment::where('status', 'accepted')
            ->where('payment_status', 'verifying')
            ->where('is_package_booking', false)
            ->whereNull('receipt_path')
            ->whereNull('receipt_data')
            ->where('updated_at', '<=', $cutoff)
            ->get();

        if ($expiredAppointments->isEmpty()) {
            $this->info('No unpaid appointments to expire.');

            return self::SUCCESS;
        }

        $count = 0;
        foreach ($expiredAppointments as $appointment) {
            DB::transaction(function () use ($appointment, &$count) {
                $apt = Appointment::where('id', $appointment->id)
                    ->where('status', 'accepted')
                    ->where('payment_status', 'verifying')
                    ->whereNull('receipt_path')
                    ->whereNull('receipt_data')
                    ->lockForUpdate()
                    ->first();

                if (! $apt) {
                    return;
                }

                $apt->update([
                    'status' => 'cancelled',
                    'cancellation_reason' => 'Booking expired: payment receipt was not uploaded within the 60-minute window.',
                    'cancelled_by' => null,
                ]);

                $count++;

                DB::afterCommit(function () use ($apt) {
                    try {
                        BookingUpdated::dispatch($apt);
                    } catch (\Exception $e) {
                        Log::error('Failed to broadcast BookingUpdated on expiration: '.$e->getMessage());
                    }
                });
            });
        }

        $this->info("Expired and cancelled {$count} unpaid appointment(s).");

        return self::SUCCESS;
    }
}
