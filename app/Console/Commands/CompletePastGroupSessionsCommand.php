<?php

namespace App\Console\Commands;

use App\Models\GroupSession;
use App\Services\GroupSessionService;
use Illuminate\Console\Command;

class CompletePastGroupSessionsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'group-sessions:complete-past';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Complete ended started group sessions and accrue partner commission entries';

    /**
     * Execute the console command.
     */
    public function handle(GroupSessionService $groupSessionService): int
    {
        $completedCount = 0;

        GroupSession::where('status', 'in_progress')
            ->where('meeting_started', true)
            ->where('end_at', '<=', now())
            ->orderBy('id')
            ->chunkById(100, function ($sessions) use ($groupSessionService, &$completedCount) {
                foreach ($sessions as $session) {
                    $groupSessionService->completeSession($session);
                    $completedCount++;
                }
            });

        $this->info("Completed {$completedCount} past group session(s).");

        return self::SUCCESS;
    }
}
