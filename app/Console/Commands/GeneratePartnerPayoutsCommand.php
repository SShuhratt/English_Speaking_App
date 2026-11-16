<?php

namespace App\Console\Commands;

use App\Services\PartnerCommissionService;
use Illuminate\Console\Command;

class GeneratePartnerPayoutsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'partners:generate-payouts {--year= : Target year} {--month= : Target month (1-12)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate monthly draft corporate payouts for partner organizations meeting the minimum payout threshold';

    /**
     * Execute the console command.
     */
    public function handle(PartnerCommissionService $commissionService): int
    {
        $defaultPeriod = now()->subMonthNoOverflow();
        $year = (int) ($this->option('year') ?: $defaultPeriod->year);
        $month = (int) ($this->option('month') ?: $defaultPeriod->month);

        $result = $commissionService->generateMonthlyPayouts($year, $month);

        $this->info(sprintf(
            'Generated %d payout(s) for %04d-%02d; %d partner(s) rolled over below minimum threshold.',
            $result['created_payouts']->count(),
            $year,
            $month,
            count($result['rolled_over_partners']),
        ));

        return self::SUCCESS;
    }
}
