<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Services\PartnerCommissionService;
use Illuminate\Console\Command;

class CompletePastAppointmentsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'appointments:complete-past';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Mark past confirmed appointments as completed and accrue Track A net-cash partner commissions';

    /**
     * Execute the console command.
     */
    public function handle(PartnerCommissionService $commissionService): int
    {
        $completedCount = 0;
        $accruedCount = 0;

        Appointment::where('status', 'confirmed')
            ->where('end_at', '<=', now())
            ->orderBy('id')
            ->chunkById(100, function ($appointments) use ($commissionService, &$completedCount, &$accruedCount) {
                foreach ($appointments as $appointment) {
                    $completed = $commissionService->completeAppointment($appointment);
                    $completedCount++;

                    if ($completed->partnerCommissionEntry()->exists()) {
                        $accruedCount++;
                    }
                }
            });

        $this->info("Completed {$completedCount} past appointment(s); {$accruedCount} partner commission ledger row(s) active.");

        return self::SUCCESS;
    }
}
