<?php

namespace App\Services;

use App\Models\PartnerAttribution;
use App\Models\PartnerCommissionEntry;
use App\Models\PartnerOrganization;
use App\Models\PartnerPass;
use App\Models\PartnerPassBatch;
use App\Models\PartnerPayout;
use App\Models\PartnerVoucher;
use App\Models\PartnerVoucherBatch;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class PartnerPortalService
{
    public function __construct(
        protected PartnerPassService $partnerPassService,
    ) {}

    /**
     * Resolve the partner organization and portal access status for the authenticated user.
     *
     * @return array{
     *     organization: PartnerOrganization|null,
     *     staff_role: string|null,
     *     is_accessible: bool,
     * }
     */
    public function resolvePortalContext(User $user): array
    {
        $membership = $user->activePartnerMembership();
        $organization = $user->primaryPartnerOrganization();
        $staffRole = $membership?->staff_role;

        if (! $staffRole && $organization && $organization->director_user_id === $user->id) {
            $staffRole = 'director';
        }

        return [
            'organization' => $organization,
            'staff_role' => $staffRole,
            'is_accessible' => $organization !== null && $organization->isActive(),
        ];
    }

    /**
     * Build overview metrics, payout threshold progress, code utilization, and recent activity.
     *
     * @return array<string, mixed>
     */
    public function getOverviewData(PartnerOrganization $organization): array
    {
        $minimumPayout = (int) config('monetization.minimum_payout_uzs', 100000);
        $attributedPupilQuery = PartnerAttribution::where('partner_organization_id', $organization->id);
        $attributedCount = (clone $attributedPupilQuery)->count();
        $attributedPupilIds = (clone $attributedPupilQuery)->pluck('pupil_id');

        $activePassHoldersCount = $attributedPupilIds->isEmpty()
            ? 0
            : PartnerPass::whereIn('user_id', $attributedPupilIds)
                ->where('status', 'active')
                ->where('expires_at', '>', now())
                ->distinct('user_id')
                ->count('user_id');

        $activeEntriesQuery = PartnerCommissionEntry::where('partner_organization_id', $organization->id)
            ->where('status', '!=', 'voided');

        $accruedBalance = (int) (clone $activeEntriesQuery)->where('status', 'accrued')->sum('partner_amount');
        $inPayoutBalance = (int) (clone $activeEntriesQuery)->where('status', 'included_in_payout')->sum('partner_amount');
        $paidTotal = (int) (clone $activeEntriesQuery)->where('status', 'paid')->sum('partner_amount');
        $totalEarned = $accruedBalance + $inPayoutBalance + $paidTotal;
        $totalNetCashGmv = (int) (clone $activeEntriesQuery)->sum('net_cash_basis');

        $completedLessonsCount = (int) (clone $activeEntriesQuery)
            ->where('entry_source', '!=', 'b2c_partner_pass')
            ->count();

        $voidedEntriesCount = PartnerCommissionEntry::where('partner_organization_id', $organization->id)
            ->where('status', 'voided')
            ->count();

        $payoutProgressPercent = $minimumPayout > 0
            ? min(100, (int) round(($accruedBalance / $minimumPayout) * 100))
            : 100;

        $vouchersSummary = [
            'total' => PartnerVoucher::where('partner_organization_id', $organization->id)->count(),
            'available' => PartnerVoucher::where('partner_organization_id', $organization->id)->where('status', 'available')->count(),
            'redeemed' => PartnerVoucher::where('partner_organization_id', $organization->id)->where('status', 'redeemed')->count(),
            'expired' => PartnerVoucher::where('partner_organization_id', $organization->id)->where('status', 'expired')->count(),
        ];

        $b2bPassQuery = PartnerPass::where('partner_organization_id', $organization->id)
            ->where('source', 'b2b_wholesale');

        $passesSummary = [
            'total_b2b' => (clone $b2bPassQuery)->count(),
            'unclaimed' => (clone $b2bPassQuery)->where('status', 'unclaimed')->count(),
            'active_b2b' => (clone $b2bPassQuery)->where('status', 'active')->where('expires_at', '>', now())->count(),
            'expired_b2b' => (clone $b2bPassQuery)->where('status', 'expired')->count(),
        ];

        $recentEntries = PartnerCommissionEntry::with([
            'pupil:id,full_name,email,phone_number',
            'teacher:id,full_name',
            'appointment:id,start_at,duration_minutes,meeting_started',
        ])
            ->where('partner_organization_id', $organization->id)
            ->latest('accrued_at')
            ->take(8)
            ->get();

        $staffMembers = $organization->staffMemberships()
            ->with('user:id,full_name,email,phone_number')
            ->orderByDesc('is_active')
            ->orderBy('created_at')
            ->get();

        $pricing = $this->partnerPassService->getPricingConfig();

        return [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
                'legal_name' => $organization->legal_name,
                'legal_type' => $organization->legal_type,
                'inn_stir' => $organization->inn_stir,
                'partner_code' => $organization->partner_code,
                'referral_url' => url('/register?partner='.$organization->partner_code),
                'commission_rate_bps' => (int) $organization->commission_rate_bps,
                'commission_rate_percent' => ((int) $organization->commission_rate_bps) / 100,
                'contract_number' => $organization->contract_number,
                'contract_signed_at' => $organization->contract_signed_at?->toDateString(),
                'status' => $organization->status,
            ],
            'metrics' => [
                'attributed_students_count' => $attributedCount,
                'active_pass_holders_count' => $activePassHoldersCount,
                'completed_lessons_count' => $completedLessonsCount,
                'total_net_cash_gmv_uzs' => $totalNetCashGmv,
                'accrued_balance_uzs' => $accruedBalance,
                'in_payout_balance_uzs' => $inPayoutBalance,
                'paid_total_uzs' => $paidTotal,
                'total_earned_uzs' => $totalEarned,
                'voided_entries_count' => $voidedEntriesCount,
                'minimum_payout_uzs' => $minimumPayout,
                'payout_progress_percent' => $payoutProgressPercent,
                'remaining_to_threshold_uzs' => max(0, $minimumPayout - $accruedBalance),
                'attributed_daily_p2p_minutes' => $pricing['p2p_attributed_daily_minutes'],
            ],
            'vouchers_summary' => $vouchersSummary,
            'passes_summary' => $passesSummary,
            'recent_entries' => $recentEntries,
            'staff_members' => $staffMembers,
        ];
    }

    /**
     * Get searchable paginated attributed students enriched with P2P tier, Partner Pass expiry, lessons, and revenue.
     */
    public function getStudentsPaginator(
        PartnerOrganization $organization,
        ?string $search = null,
        int $perPage = 15,
    ): LengthAwarePaginator {
        $pricing = $this->partnerPassService->getPricingConfig();
        $attributedMinutes = (int) $pricing['p2p_attributed_daily_minutes'];

        $query = PartnerAttribution::with(['pupil:id,full_name,email,phone_number,created_at'])
            ->where('partner_organization_id', $organization->id)
            ->latest('attributed_at');

        if ($search !== null && trim($search) !== '') {
            $term = '%'.strtolower(trim($search)).'%';
            $query->whereHas('pupil', function ($q) use ($term): void {
                $q->whereRaw('LOWER(full_name) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(email) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(COALESCE(phone_number, \'\')) LIKE ?', [$term]);
            });
        }

        $paginator = $query->paginate($perPage)->withQueryString();
        $rows = $this->enrichAttributions($organization, $paginator->getCollection(), $attributedMinutes);
        $paginator->setCollection($rows);

        return $paginator;
    }

    /**
     * Get full unpaginated student rows for sanitized CSV export.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function getStudentsForExport(PartnerOrganization $organization, ?string $search = null): Collection
    {
        $pricing = $this->partnerPassService->getPricingConfig();
        $attributedMinutes = (int) $pricing['p2p_attributed_daily_minutes'];

        $query = PartnerAttribution::with(['pupil:id,full_name,email,phone_number,created_at'])
            ->where('partner_organization_id', $organization->id)
            ->latest('attributed_at');

        if ($search !== null && trim($search) !== '') {
            $term = '%'.strtolower(trim($search)).'%';
            $query->whereHas('pupil', function ($q) use ($term): void {
                $q->whereRaw('LOWER(full_name) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(email) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(COALESCE(phone_number, \'\')) LIKE ?', [$term]);
            });
        }

        return $this->enrichAttributions($organization, $query->get(), $attributedMinutes);
    }

    /**
     * Load partner's Track B2 voucher batches and Track B1 pass batches with code distribution statuses.
     *
     * @return array<string, mixed>
     */
    public function getCodesAndBatchesData(PartnerOrganization $organization): array
    {
        $voucherBatches = PartnerVoucherBatch::where('partner_organization_id', $organization->id)
            ->withCount([
                'vouchers as available_count' => fn ($q) => $q->where('status', 'available'),
                'vouchers as redeemed_count' => fn ($q) => $q->where('status', 'redeemed'),
                'vouchers as expired_count' => fn ($q) => $q->where('status', 'expired'),
            ])
            ->with([
                'vouchers' => fn ($q) => $q
                    ->with(['claimedByUser:id,full_name,email', 'redeemedAppointment:id,start_at'])
                    ->orderBy('created_at')
                    ->take(100),
            ])
            ->latest()
            ->take(30)
            ->get();

        $passBatches = PartnerPassBatch::where('partner_organization_id', $organization->id)
            ->withCount([
                'passes as unclaimed_count' => fn ($q) => $q->where('status', 'unclaimed'),
                'passes as active_count' => fn ($q) => $q->where('status', 'active')->where('expires_at', '>', now()),
                'passes as expired_count' => fn ($q) => $q->where('status', 'expired'),
            ])
            ->with([
                'passes' => fn ($q) => $q
                    ->with(['user:id,full_name,email'])
                    ->orderBy('created_at')
                    ->take(100),
            ])
            ->latest()
            ->take(30)
            ->get();

        return [
            'voucherBatches' => $voucherBatches,
            'passBatches' => $passBatches,
        ];
    }

    /**
     * Build paginated commission ledger (filterable by status & dates) and corporate payout history.
     *
     * @return array<string, mixed>
     */
    public function getPayoutsAndLedgerData(
        PartnerOrganization $organization,
        ?string $status = null,
        ?string $from = null,
        ?string $to = null,
    ): array {
        $ledgerQuery = $this->buildFilteredLedgerQuery($organization, $status, $from, $to);
        $commissionEntries = $ledgerQuery->paginate(15, ['*'], 'ledger_page')->withQueryString();

        $payouts = PartnerPayout::where('partner_organization_id', $organization->id)
            ->latest('period_year')
            ->latest('period_month')
            ->paginate(12, ['*'], 'payouts_page')
            ->withQueryString();

        return [
            'commissionEntries' => $commissionEntries,
            'payouts' => $payouts,
            'filters' => [
                'status' => $status && in_array($status, ['accrued', 'included_in_payout', 'paid', 'voided'], true)
                    ? $status
                    : 'all',
                'from' => $from ?: '',
                'to' => $to ?: '',
            ],
        ];
    }

    /**
     * Build scoped ledger query for UI pagination or CSV streaming.
     */
    public function buildFilteredLedgerQuery(
        PartnerOrganization $organization,
        ?string $status = null,
        ?string $from = null,
        ?string $to = null,
    ) {
        $query = PartnerCommissionEntry::with([
            'pupil:id,full_name,email,phone_number',
            'teacher:id,full_name',
            'appointment:id,start_at,duration_minutes,meeting_started',
            'payout:id,period_year,period_month,didox_document_id,status',
        ])
            ->where('partner_organization_id', $organization->id)
            ->latest('accrued_at');

        if ($status && in_array($status, ['accrued', 'included_in_payout', 'paid', 'voided'], true)) {
            $query->where('status', $status);
        }

        if ($from) {
            $query->whereDate('accrued_at', '>=', $from);
        }

        if ($to) {
            $query->whereDate('accrued_at', '<=', $to);
        }

        return $query;
    }

    /**
     * Neutralize spreadsheet formula prefixes (=, +, -, @, tab, CR) before writing to CSV.
     */
    public function sanitizeCsvCell(mixed $value): string
    {
        if ($value === null) {
            return '';
        }

        $str = (string) $value;
        if ($str !== '' && preg_match('/^[=+\-@\t\r]/', $str) === 1) {
            return "'".$str;
        }

        return $str;
    }

    /**
     * Enrich attribution rows in bulk without N+1 queries.
     *
     * @param  Collection<int, PartnerAttribution>  $attributions
     * @return Collection<int, array<string, mixed>>
     */
    protected function enrichAttributions(
        PartnerOrganization $organization,
        Collection $attributions,
        int $attributedMinutes,
    ): Collection {
        $pupilIds = $attributions->pluck('pupil_id')->filter()->unique()->values();

        if ($pupilIds->isEmpty()) {
            return collect();
        }

        $activePassesByUser = PartnerPass::whereIn('user_id', $pupilIds)
            ->where('status', 'active')
            ->where('expires_at', '>', now())
            ->orderByDesc('expires_at')
            ->get()
            ->groupBy('user_id')
            ->map(fn (Collection $passes) => $passes->first());

        $statsByPupil = PartnerCommissionEntry::where('partner_organization_id', $organization->id)
            ->whereIn('pupil_id', $pupilIds)
            ->where('status', '!=', 'voided')
            ->selectRaw("pupil_id, COUNT(CASE WHEN entry_source != 'b2c_partner_pass' THEN 1 END) as lessons_count, COALESCE(SUM(partner_amount), 0) as total_commission_uzs, COALESCE(SUM(net_cash_basis), 0) as total_net_cash_uzs, MAX(accrued_at) as last_activity_at")
            ->groupBy('pupil_id')
            ->get()
            ->keyBy('pupil_id');

        return $attributions->map(function (PartnerAttribution $attr) use ($activePassesByUser, $statsByPupil, $attributedMinutes) {
            $pupil = $attr->pupil;
            $activePass = $activePassesByUser->get($attr->pupil_id);
            $stat = $statsByPupil->get($attr->pupil_id);

            return [
                'attribution_id' => $attr->id,
                'pupil_id' => $attr->pupil_id,
                'full_name' => $pupil?->full_name ?? 'Unknown Student',
                'email' => $pupil?->email ?? '',
                'phone_number' => $pupil?->phone_number,
                'attribution_source' => $attr->attribution_source,
                'attributed_at' => $attr->attributed_at?->toIso8601String(),
                'p2p_tier' => $activePass ? 'unlimited' : 'attributed_2x',
                'p2p_tier_label' => $activePass
                    ? 'Unlimited (Partner Pass)'
                    : "{$attributedMinutes} min/day (2x Partner Bonus)",
                'partner_pass_expires_at' => $activePass?->expires_at?->toIso8601String(),
                'completed_lessons_count' => (int) ($stat->lessons_count ?? 0),
                'total_net_cash_uzs' => (int) ($stat->total_net_cash_uzs ?? 0),
                'total_commission_uzs' => (int) ($stat->total_commission_uzs ?? 0),
                'last_activity_at' => $stat?->last_activity_at,
            ];
        });
    }
}
