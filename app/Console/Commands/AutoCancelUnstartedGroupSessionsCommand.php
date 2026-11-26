<?php

namespace App\Console\Commands;

use App\Services\GroupSessionService;
use Illuminate\Console\Command;

class AutoCancelUnstartedGroupSessionsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'group-sessions:auto-cancel-unstarted {--minutes=15 : Grace period in minutes after start_at}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Auto-cancel scheduled group sessions that the teacher did not start within 15 minutes';

    /**
     * Execute the console command.
     */
    public function handle(GroupSessionService $groupSessionService): int
    {
        $minutes = max(1, (int) $this->option('minutes'));
        $cancelledCount = $groupSessionService->cancelUnstartedSessions($minutes);

        $this->info("Auto-cancelled {$cancelledCount} unstarted group session(s).");

        return self::SUCCESS;
    }
}
