<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Notifications\ConversationFiveMinuteReminderNotification;
use App\Notifications\ConversationStartedNotification;
use App\Support\PlatformTime;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SendAppointmentRemindersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'appointments:send-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send 5-minute pre-session reminders and session-started notifications for confirmed appointments';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $now = PlatformTime::now();

        // 1. Process 5-minute reminders (appointments starting between 4 and 6 minutes from now)
        $fiveMinStart = $now->copy()->addMinutes(4);
        $fiveMinEnd = $now->copy()->addMinutes(6);

        $upcomingAppointments = Appointment::with(['teacher', 'pupil'])
            ->where('status', 'confirmed')
            ->whereNull('reminder_5min_sent_at')
            ->whereBetween('start_at', [$fiveMinStart, $fiveMinEnd])
            ->get();

        $fiveMinCount = 0;
        foreach ($upcomingAppointments as $appointment) {
            $affected = Appointment::where('id', $appointment->id)
                ->whereNull('reminder_5min_sent_at')
                ->update(['reminder_5min_sent_at' => $now]);

            if ($affected > 0) {
                try {
                    $appointment->teacher?->notify(new ConversationFiveMinuteReminderNotification($appointment));
                    $appointment->pupil?->notify(new ConversationFiveMinuteReminderNotification($appointment));
                    $fiveMinCount++;
                } catch (\Throwable $e) {
                    Log::error("Failed to send 5-minute reminder for appointment {$appointment->id}: ".$e->getMessage());
                }
            }
        }

        // 2. Process session-started reminders (appointments starting between 5 minutes ago and now)
        $startedStart = $now->copy()->subMinutes(5);
        $startedEnd = $now->copy();

        $startingAppointments = Appointment::with(['teacher', 'pupil'])
            ->where('status', 'confirmed')
            ->whereNull('reminder_started_sent_at')
            ->whereBetween('start_at', [$startedStart, $startedEnd])
            ->get();

        $startedCount = 0;
        foreach ($startingAppointments as $appointment) {
            $affected = Appointment::where('id', $appointment->id)
                ->whereNull('reminder_started_sent_at')
                ->update(['reminder_started_sent_at' => $now]);

            if ($affected > 0) {
                try {
                    $appointment->teacher?->notify(new ConversationStartedNotification($appointment));
                    $appointment->pupil?->notify(new ConversationStartedNotification($appointment));
                    $startedCount++;
                } catch (\Throwable $e) {
                    Log::error("Failed to send session-started notification for appointment {$appointment->id}: ".$e->getMessage());
                }
            }
        }

        $this->info("Dispatched {$fiveMinCount} 5-minute reminder(s) and {$startedCount} session-started reminder(s).");

        return self::SUCCESS;
    }
}
