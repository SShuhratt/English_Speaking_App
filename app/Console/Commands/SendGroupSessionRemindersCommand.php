<?php

namespace App\Console\Commands;

use App\Models\GroupSession;
use App\Notifications\GroupSessionNotification;
use App\Support\PlatformTime;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Throwable;

class SendGroupSessionRemindersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'group-sessions:send-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send 5-minute pre-session reminders for scheduled group conversations';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $now = PlatformTime::now();
        $windowStart = $now->copy()->addMinutes(4);
        $windowEnd = $now->copy()->addMinutes(6);

        $sessions = GroupSession::with(['teacher', 'paidEnrollments.pupil'])
            ->where('status', 'scheduled')
            ->whereNull('reminder_5min_sent_at')
            ->whereBetween('start_at', [$windowStart, $windowEnd])
            ->get();

        $count = 0;
        foreach ($sessions as $session) {
            $updated = GroupSession::where('id', $session->id)
                ->whereNull('reminder_5min_sent_at')
                ->update(['reminder_5min_sent_at' => $now]);

            if ($updated === 0) {
                continue;
            }

            try {
                $session->teacher?->notify(new GroupSessionNotification($session, 'reminder_5min'));
                foreach ($session->paidEnrollments as $enrollment) {
                    $enrollment->pupil?->notify(new GroupSessionNotification($session, 'reminder_5min'));
                }
                $count++;
            } catch (Throwable $e) {
                Log::warning("Failed sending 5-minute reminder for group session {$session->id}: ".$e->getMessage());
            }
        }

        $this->info("Sent 5-minute reminders for {$count} group session(s).");

        return self::SUCCESS;
    }
}
