<?php

namespace App\Console\Commands;

use App\Services\PartnerPassService;
use Illuminate\Console\Command;

class ExpirePartnerPassesCommand extends Command
{
    protected $signature = 'partner-passes:expire';

    protected $description = 'Mark active B2B/B2C Partner Passes whose expiry date has passed as expired';

    public function handle(PartnerPassService $partnerPassService): int
    {
        $count = $partnerPassService->expireElapsedPasses();
        $this->info("Expired {$count} elapsed partner pass(es).");

        return self::SUCCESS;
    }
}
