<?php

namespace App\Console\Commands;

use App\Services\GroupSessionService;
use Illuminate\Console\Command;

class ExpireUnpaidGroupEnrollmentsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'group-sessions:expire-unpaid';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Release expired unpaid seat reservations back to group sessions';

    /**
     * Execute the console command.
     */
    public function handle(GroupSessionService $groupSessionService): int
    {
        $expiredCount = $groupSessionService->expireUnpaidHolds();

        $this->info("Expired {$expiredCount} unpaid group seat hold(s).");

        return self::SUCCESS;
    }
}
