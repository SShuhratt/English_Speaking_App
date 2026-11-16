<?php

namespace App\Http\Controllers;

use App\Services\PartnerPortalService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PartnerPortalController extends Controller
{
    public function __construct(
        protected PartnerPortalService $portalService,
    ) {}

    /**
     * Partner Center overview dashboard.
     */
    public function dashboard(Request $request): Response
    {
        $context = $this->portalService->resolvePortalContext($request->user());
        if (! $context['is_accessible'] || ! $context['organization']) {
            return $this->renderUnavailable($context);
        }

        $overview = $this->portalService->getOverviewData($context['organization']);

        return Inertia::render('partner/dashboard', [
            ...$overview,
            'staffRole' => $context['staff_role'],
        ]);
    }

    /**
     * Attributed students directory with P2P tiers, Partner Pass status, lessons, and commission generated.
     */
    public function students(Request $request): Response
    {
        $context = $this->portalService->resolvePortalContext($request->user());
        if (! $context['is_accessible'] || ! $context['organization']) {
            return $this->renderUnavailable($context);
        }

        $search = $request->query('search');
        $students = $this->portalService->getStudentsPaginator(
            $context['organization'],
            is_string($search) ? $search : null,
        );

        return Inertia::render('partner/students', [
            'organization' => [
                'id' => $context['organization']->id,
                'name' => $context['organization']->name,
                'partner_code' => $context['organization']->partner_code,
                'referral_url' => url('/register?partner='.$context['organization']->partner_code),
            ],
            'students' => $students,
            'search' => is_string($search) ? $search : '',
            'staffRole' => $context['staff_role'],
        ]);
    }

    /**
     * Track B2 vouchers & Track B1 Partner Pass batches allocated to this organization.
     */
    public function codes(Request $request): Response
    {
        $context = $this->portalService->resolvePortalContext($request->user());
        if (! $context['is_accessible'] || ! $context['organization']) {
            return $this->renderUnavailable($context);
        }

        $data = $this->portalService->getCodesAndBatchesData($context['organization']);

        return Inertia::render('partner/codes', [
            'organization' => [
                'id' => $context['organization']->id,
                'name' => $context['organization']->name,
                'partner_code' => $context['organization']->partner_code,
            ],
            ...$data,
            'staffRole' => $context['staff_role'],
        ]);
    }

    /**
     * Commission ledger & monthly Didox/corporate payout history.
     */
    public function payouts(Request $request): Response
    {
        $context = $this->portalService->resolvePortalContext($request->user());
        if (! $context['is_accessible'] || ! $context['organization']) {
            return $this->renderUnavailable($context);
        }

        $validated = $request->validate([
            'status' => ['nullable', 'string'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $overview = $this->portalService->getOverviewData($context['organization']);
        $ledgerData = $this->portalService->getPayoutsAndLedgerData(
            $context['organization'],
            $validated['status'] ?? null,
            $validated['from'] ?? null,
            $validated['to'] ?? null,
        );

        return Inertia::render('partner/payouts', [
            'organization' => $overview['organization'],
            'metrics' => $overview['metrics'],
            ...$ledgerData,
            'staffRole' => $context['staff_role'],
        ]);
    }

    /**
     * Export organization-scoped commission ledger as a formula-safe CSV.
     */
    public function exportLedgerCsv(Request $request): StreamedResponse
    {
        $context = $this->portalService->resolvePortalContext($request->user());
        if (! $context['is_accessible'] || ! $context['organization']) {
            abort(403, 'Partner organization access is unavailable.');
        }

        $validated = $request->validate([
            'status' => ['nullable', 'string'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $org = $context['organization'];
        $entries = $this->portalService->buildFilteredLedgerQuery(
            $org,
            $validated['status'] ?? null,
            $validated['from'] ?? null,
            $validated['to'] ?? null,
        )->get();

        $filename = sprintf('partner-ledger-%s-%s.csv', strtolower($org->partner_code), now()->format('Y-m-d'));

        return response()->streamDownload(function () use ($entries): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'Accrued At',
                'Entry Source',
                'Student Name',
                'Student Email',
                'Teacher Name',
                'Lesson Date',
                'Meeting Started',
                'Gross Value (UZS)',
                'Gateway Fee (UZS)',
                'Net Cash Basis (UZS)',
                'Partner Rate (%)',
                'Partner Commission (UZS)',
                'Status',
                'Payout Period',
                'Didox Document ID',
            ]);

            foreach ($entries as $entry) {
                $payoutPeriod = $entry->payout
                    ? sprintf('%04d-%02d', $entry->payout->period_year, $entry->payout->period_month)
                    : '';

                fputcsv($handle, [
                    $this->portalService->sanitizeCsvCell($entry->accrued_at?->toDateTimeString()),
                    $this->portalService->sanitizeCsvCell($entry->entry_source),
                    $this->portalService->sanitizeCsvCell($entry->pupil?->full_name),
                    $this->portalService->sanitizeCsvCell($entry->pupil?->email),
                    $this->portalService->sanitizeCsvCell($entry->teacher?->full_name),
                    $this->portalService->sanitizeCsvCell($entry->appointment?->start_at?->toDateTimeString()),
                    $entry->meeting_started ? 'Yes' : 'No',
                    $entry->gross_lesson_value,
                    $entry->gateway_fee_amount,
                    $entry->net_cash_basis,
                    round(((int) $entry->partner_rate_bps) / 100, 2),
                    $entry->partner_amount,
                    $this->portalService->sanitizeCsvCell($entry->status),
                    $this->portalService->sanitizeCsvCell($payoutPeriod),
                    $this->portalService->sanitizeCsvCell($entry->payout?->didox_document_id),
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Export organization-scoped attributed students summary as a formula-safe CSV.
     */
    public function exportStudentsCsv(Request $request): StreamedResponse
    {
        $context = $this->portalService->resolvePortalContext($request->user());
        if (! $context['is_accessible'] || ! $context['organization']) {
            abort(403, 'Partner organization access is unavailable.');
        }

        $search = $request->query('search');
        $org = $context['organization'];
        $rows = $this->portalService->getStudentsForExport($org, is_string($search) ? $search : null);

        $filename = sprintf('partner-students-%s-%s.csv', strtolower($org->partner_code), now()->format('Y-m-d'));

        return response()->streamDownload(function () use ($rows): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'Full Name',
                'Email',
                'Phone Number',
                'Attribution Source',
                'Attributed At',
                'Daily P2P Speaking Tier',
                'Partner Pass Expires At',
                'Completed Lessons',
                'Net Cash Generated (UZS)',
                'Partner Commission Earned (UZS)',
            ]);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $this->portalService->sanitizeCsvCell($row['full_name']),
                    $this->portalService->sanitizeCsvCell($row['email']),
                    $this->portalService->sanitizeCsvCell($row['phone_number']),
                    $this->portalService->sanitizeCsvCell($row['attribution_source']),
                    $this->portalService->sanitizeCsvCell($row['attributed_at']),
                    $this->portalService->sanitizeCsvCell($row['p2p_tier_label']),
                    $this->portalService->sanitizeCsvCell($row['partner_pass_expires_at']),
                    $row['completed_lessons_count'],
                    $row['total_net_cash_uzs'],
                    $row['total_commission_uzs'],
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * @param  array{organization: mixed, staff_role: string|null, is_accessible: bool}  $context
     */
    protected function renderUnavailable(array $context): Response
    {
        return Inertia::render('partner/unavailable', [
            'organizationName' => $context['organization']?->name,
            'organizationStatus' => $context['organization']?->status ?? 'unassigned',
        ]);
    }
}
