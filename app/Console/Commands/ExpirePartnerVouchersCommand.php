<?php

namespace App\Console\Commands;

use App\Services\PartnerVoucherService;
use Illuminate\Console\Command;

class ExpirePartnerVouchersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'partners:expire-vouchers';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Mark unused institutional Track B2 vouchers past their validity window as expired';

    /**
     * Execute the console command.
     */
    public function handle(PartnerVoucherService $voucherService): int
    {
        $expiredCount = $voucherService->expireStaleVouchers();
        $this->info("Marked {$expiredCount} expired partner voucher(s).");

        return self::SUCCESS;
    }
}
