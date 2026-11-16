<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\PartnerCommissionEntry;
use App\Models\PartnerOrganization;
use App\Models\PartnerOrganizationUser;
use App\Models\PartnerPass;
use App\Models\PartnerPassBatch;
use App\Models\PartnerPayout;
use App\Models\PartnerVoucherBatch;
use App\Models\User;
use App\Services\PartnerAttributionService;
use App\Services\PartnerCommissionService;
use App\Services\PartnerPassService;
use App\Services\PartnerVoucherService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminPartnerController extends Controller
{
    public function __construct(
        protected PartnerAttributionService $attributionService,
        protected PartnerCommissionService $commissionService,
        protected PartnerVoucherService $voucherService,
        protected PartnerPassService $partnerPassService,
    ) {}

    /**
     * Display the Admin B2B2C Partners, Track A Ledger, Payouts, and Track B2 Vouchers hub.
     */
    public function index(Request $request): Response
    {
        $meetingFilter = (string) $request->query('meeting', 'all');
        if (! in_array($meetingFilter, ['all', 'started', 'unstarted'], true)) {
            $meetingFilter = 'all';
        }

        $partners = PartnerOrganization::withCount(['attributions', 'voucherBatches', 'staffMemberships'])
            ->with([
                'staffMemberships' => fn ($q) => $q
                    ->with('user:id,full_name,email,phone_number')
                    ->orderBy('created_at'),
            ])
            ->withSum(
                ['commissionEntries as accrued_balance_uzs' => fn ($q) => $q->where('status', 'accrued')],
                'partner_amount'
            )
            ->withSum(
                ['commissionEntries as paid_total_uzs' => fn ($q) => $q->where('status', 'paid')],
                'partner_amount'
            )
            ->latest()
            ->get();

        $batches = PartnerVoucherBatch::with(['partnerOrganization:id,name,partner_code'])
            ->withCount([
                'vouchers as available_count' => fn ($q) => $q->where('status', 'available'),
                'vouchers as redeemed_count' => fn ($q) => $q->where('status', 'redeemed'),
                'vouchers as expired_count' => fn ($q) => $q->where('status', 'expired'),
            ])
            ->with(['vouchers' => fn ($q) => $q->orderBy('created_at')->take(25)])
            ->latest()
            ->take(20)
            ->get();

        $entriesQuery = PartnerCommissionEntry::with([
            'partnerOrganization:id,name,partner_code',
            'pupil:id,full_name,email',
            'teacher:id,full_name,email',
            'appointment:id,start_at,end_at,duration_minutes,meeting_started,status,completion_voided_at',
        ])->latest('accrued_at');

        if ($meetingFilter === 'started') {
            $entriesQuery->where('meeting_started', true);
        } elseif ($meetingFilter === 'unstarted') {
            $entriesQuery->where('meeting_started', false);
        }

        $commissionEntries = $entriesQuery->paginate(15)->withQueryString();

        $unstartedReviewAppointments = Appointment::with([
            'pupil:id,full_name,email',
            'teacher:id,full_name,email',
            'partnerCommissionEntry:id,appointment_id,partner_amount,status',
        ])
            ->where('status', 'completed')
            ->where('meeting_started', false)
            ->whereNull('completion_voided_at')
            ->latest('end_at')
            ->take(15)
            ->get();

        $payouts = PartnerPayout::with(['partnerOrganization:id,name,legal_name,inn_stir,bank_account,bank_mfo'])
            ->latest()
            ->paginate(12, ['*'], 'payouts_page')
            ->withQueryString();

        $passBatches = PartnerPassBatch::with(['partnerOrganization:id,name,partner_code'])
            ->withCount([
                'passes as unclaimed_count' => fn ($q) => $q->where('status', 'unclaimed'),
                'passes as active_count' => fn ($q) => $q->where('status', 'active'),
                'passes as expired_count' => fn ($q) => $q->where('status', 'expired'),
            ])
            ->with(['passes' => fn ($q) => $q->orderBy('created_at')->take(25)])
            ->latest()
            ->take(20)
            ->get();

        $pendingRetailPasses = PartnerPass::with(['user:id,full_name,email,phone_number', 'partnerOrganization:id,name,partner_code'])
            ->where('source', 'b2c_retail')
            ->where('payment_status', 'verifying')
            ->latest()
            ->take(20)
            ->get();

        $pricingConfig = $this->partnerPassService->getPricingConfig();

        $summary = [
            'active_partners' => PartnerOrganization::where('status', 'active')->count(),
            'attributed_pupils' => DB::table('partner_attributions')->count(),
            'total_accrued_uzs' => (int) PartnerCommissionEntry::where('status', 'accrued')->sum('partner_amount'),
            'total_paid_uzs' => (int) PartnerPayout::where('status', 'paid')->sum('total_commission_amount'),
            'unstarted_completed_count' => Appointment::where('status', 'completed')
                ->where('meeting_started', false)
                ->whereNull('completion_voided_at')
                ->count(),
            'track_b2_upfront_uzs' => (int) PartnerVoucherBatch::where('payment_status', 'paid')->sum('total_paid_upfront_uzs'),
            'track_b1_upfront_uzs' => (int) PartnerPassBatch::where('payment_status', 'paid')->sum('total_paid_upfront_uzs'),
            'active_partner_passes' => PartnerPass::where('status', 'active')->where('expires_at', '>', now())->count(),
            'pending_retail_passes_count' => PartnerPass::where('source', 'b2c_retail')->where('payment_status', 'verifying')->count(),
            'minimum_payout_uzs' => (int) config('monetization.minimum_payout_uzs', 100000),
            'gateway_fee_percent' => ((int) config('monetization.gateway_fee_bps', 200)) / 100,
        ];

        return Inertia::render('admin/partners', [
            'partners' => $partners,
            'batches' => $batches,
            'passBatches' => $passBatches,
            'pendingRetailPasses' => $pendingRetailPasses,
            'pricingConfig' => $pricingConfig,
            'commissionEntries' => $commissionEntries,
            'unstartedReviewAppointments' => $unstartedReviewAppointments,
            'payouts' => $payouts,
            'summary' => $summary,
            'meetingFilter' => $meetingFilter,
        ]);
    }

    /**
     * Register a new partner learning center.
     */
    public function storePartner(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'legal_name' => ['required', 'string', 'max:255'],
            'legal_type' => ['required', 'string', Rule::in(['mchj', 'yatt'])],
            'inn_stir' => ['nullable', 'string', 'max:30'],
            'bank_account' => ['nullable', 'string', 'max:64'],
            'bank_mfo' => ['nullable', 'string', 'max:20'],
            'bank_name' => ['nullable', 'string', 'max:150'],
            'contact_phone' => ['nullable', 'string', 'max:40'],
            'contact_email' => ['nullable', 'email', 'max:150'],
            'partner_code' => ['nullable', 'string', 'max:32', 'alpha_num', 'unique:partner_organizations,partner_code', 'unique:users,referral_code'],
            'commission_rate_bps' => ['nullable', 'integer', 'min:100', 'max:1500'],
            'contract_number' => ['nullable', 'string', 'max:80'],
            'contract_signed_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $partnerCode = ! empty($validated['partner_code'])
            ? strtoupper(trim($validated['partner_code']))
            : $this->attributionService->generateUniquePartnerCode($validated['name']);

        PartnerOrganization::create([
            'name' => trim($validated['name']),
            'legal_name' => trim($validated['legal_name']),
            'legal_type' => $validated['legal_type'],
            'inn_stir' => $validated['inn_stir'] ?? null,
            'bank_account' => $validated['bank_account'] ?? null,
            'bank_mfo' => $validated['bank_mfo'] ?? null,
            'bank_name' => $validated['bank_name'] ?? null,
            'contact_phone' => $validated['contact_phone'] ?? null,
            'contact_email' => $validated['contact_email'] ?? null,
            'partner_code' => $partnerCode,
            'commission_rate_bps' => (int) ($validated['commission_rate_bps'] ?? config('monetization.shares.partner_bps', 500)),
            'contract_number' => $validated['contract_number'] ?? null,
            'contract_signed_at' => $validated['contract_signed_at'] ?? null,
            'status' => 'active',
            'notes' => $validated['notes'] ?? null,
        ]);

        return back()->with('success', "Partner organization created with code {$partnerCode}.");
    }

    /**
     * Update partner legal/bank info or operational status.
     */
    public function updatePartner(Request $request, PartnerOrganization $partner): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'legal_name' => ['sometimes', 'required', 'string', 'max:255'],
            'legal_type' => ['sometimes', 'required', 'string', Rule::in(['mchj', 'yatt'])],
            'inn_stir' => ['nullable', 'string', 'max:30'],
            'bank_account' => ['nullable', 'string', 'max:64'],
            'bank_mfo' => ['nullable', 'string', 'max:20'],
            'bank_name' => ['nullable', 'string', 'max:150'],
            'contact_phone' => ['nullable', 'string', 'max:40'],
            'contact_email' => ['nullable', 'email', 'max:150'],
            'contract_number' => ['nullable', 'string', 'max:80'],
            'contract_signed_at' => ['nullable', 'date'],
            'status' => ['sometimes', 'required', 'string', Rule::in(['active', 'paused', 'terminated'])],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $partner->update($validated);

        return back()->with('success', 'Partner organization updated.');
    }

    /**
     * Issue a Track B2 wholesale prepaid voucher batch for a partner center.
     */
    public function storeVoucherBatch(Request $request, PartnerOrganization $partner): RedirectResponse
    {
        $minDays = (int) config('monetization.voucher_validity_min_days', 30);
        $maxDays = (int) config('monetization.voucher_validity_max_days', 90);
        $minDiscount = (int) config('monetization.voucher_min_wholesale_discount_percent', 10);
        $maxDiscount = (int) config('monetization.voucher_max_wholesale_discount_percent', 15);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'bundle_type' => ['required', 'string', Rule::in(['mock_speaking', 'lesson_1on1'])],
            'lesson_duration_minutes' => ['required', 'integer', Rule::in([20, 30, 45, 60])],
            'max_lesson_price_uzs' => ['required', 'integer', 'min:10000'],
            'unit_face_value_uzs' => ['required', 'integer', 'min:10000'],
            'wholesale_discount_percent' => ['required', 'integer', "min:{$minDiscount}", "max:{$maxDiscount}"],
            'quantity' => ['required', 'integer', 'min:1', 'max:1000'],
            'validity_days' => ['required', 'integer', "min:{$minDays}", "max:{$maxDays}"],
            'mark_paid' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $batch = $this->voucherService->createBatch($partner, [
            ...$validated,
            'payment_status' => ! empty($validated['mark_paid']) ? 'paid' : 'pending',
        ]);

        return back()->with('success', "Track B2 batch '{$batch->title}' created ({$batch->quantity} vouchers).");
    }

    /**
     * Confirm payment for a pending Track B2 voucher batch and generate its codes.
     */
    public function activateVoucherBatch(PartnerVoucherBatch $batch): RedirectResponse
    {
        $generated = $this->voucherService->activatePaidBatch($batch);

        return back()->with('success', "Batch marked paid and {$generated} voucher code(s) generated.");
    }

    /**
     * Trigger completion sync for past confirmed sessions immediately from admin panel.
     */
    public function syncCompletedAppointments(): RedirectResponse
    {
        Artisan::call('appointments:complete-past');

        return back()->with('success', trim(Artisan::output()) ?: 'Past confirmed appointments synced.');
    }

    /**
     * Void and refund a completed unstarted lesson due to teacher no-show, voiding any partner commission.
     */
    public function voidUnstartedAppointment(Request $request, Appointment $appointment): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:3', 'max:500'],
        ]);

        if ($appointment->meeting_started) {
            return back()->with('error', 'Sessions where the meeting actually started cannot be voided as a teacher no-show.');
        }

        $this->commissionService->voidForTeacherNoShow($appointment, $request->user(), $validated['reason']);

        return back()->with('success', 'Session voided as teacher no-show and any pending partner commission was cancelled.');
    }

    /**
     * Generate monthly draft corporate payouts for centers meeting the 100,000 UZS threshold.
     */
    public function generatePayouts(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'year' => ['required', 'integer', 'min:2025', 'max:2035'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
        ]);

        $result = $this->commissionService->generateMonthlyPayouts(
            (int) $validated['year'],
            (int) $validated['month'],
        );

        $createdCount = $result['created_payouts']->count();
        $rolledCount = count($result['rolled_over_partners']);

        return back()->with('success', "Generated {$createdCount} monthly payout draft(s); {$rolledCount} center(s) rolled over below threshold.");
    }

    /**
     * Record Didox E-faktura document and corporate bank transfer reference on a payout.
     */
    public function markPayoutPaid(Request $request, PartnerPayout $payout): RedirectResponse
    {
        $validated = $request->validate([
            'didox_document_id' => ['required', 'string', 'max:120'],
            'payment_reference' => ['nullable', 'string', 'max:120'],
        ]);

        $this->commissionService->markPayoutPaid(
            payout: $payout,
            didoxDocumentId: $validated['didox_document_id'],
            paymentReference: $validated['payment_reference'] ?? null,
        );

        return back()->with('success', 'Monthly partner payout marked as paid.');
    }

    /**
     * Export CSV breakdown of commission entries attached to a monthly payout for Didox reconciliation.
     */
    public function exportPayoutCsv(PartnerPayout $payout): StreamedResponse
    {
        $payout->load([
            'partnerOrganization',
            'commissionEntries.pupil:id,full_name,email',
            'commissionEntries.teacher:id,full_name',
            'commissionEntries.appointment:id,start_at,duration_minutes,meeting_started',
        ]);

        $filename = sprintf(
            'payout-%s-%04d-%02d.csv',
            strtolower($payout->partnerOrganization?->partner_code ?? 'partner'),
            $payout->period_year,
            $payout->period_month,
        );

        return response()->streamDownload(function () use ($payout): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'Partner Center',
                'Legal Name',
                'INN/STIR',
                'Appointment ID',
                'Lesson Date',
                'Student',
                'Teacher',
                'Source',
                'Meeting Started',
                'Gross Value (UZS)',
                'Gateway Fee (UZS)',
                'Net Cash Basis (UZS)',
                'Partner Share (5% UZS)',
                'Status',
            ]);

            foreach ($payout->commissionEntries as $entry) {
                fputcsv($handle, [
                    $payout->partnerOrganization?->name,
                    $payout->partnerOrganization?->legal_name,
                    $payout->partnerOrganization?->inn_stir,
                    $entry->appointment_id,
                    $entry->appointment?->start_at?->toDateTimeString(),
                    $entry->pupil?->full_name,
                    $entry->teacher?->full_name,
                    $entry->entry_source,
                    $entry->meeting_started ? 'Yes' : 'No',
                    $entry->gross_lesson_value,
                    $entry->gateway_fee_amount,
                    $entry->net_cash_basis,
                    $entry->partner_amount,
                    $entry->status,
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    /**
     * Save Admin-configurable Track B1 Partner Pass prices and daily P2P quota rules.
     */
    public function updateMonetizationSettings(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'partner_pass_b2c_price_uzs' => ['required', 'integer', 'min:5000', 'max:500000'],
            'partner_pass_b2b_default_price_uzs' => ['required', 'integer', 'min:5000', 'max:500000'],
            'partner_pass_b2b_min_price_uzs' => ['required', 'integer', 'min:5000', 'max:500000'],
            'partner_pass_default_days' => ['required', 'integer', 'min:7', 'max:365'],
            'p2p_free_daily_minutes' => ['required', 'integer', 'min:10', 'max:720'],
            'p2p_attributed_daily_minutes' => ['required', 'integer', 'min:10', 'max:1440'],
        ]);

        if ((int) $validated['partner_pass_b2b_default_price_uzs'] < (int) $validated['partner_pass_b2b_min_price_uzs']) {
            return back()->with('error', 'Default B2B seat price cannot be lower than the minimum B2B floor.');
        }

        $this->partnerPassService->updatePricingConfig($validated, $request->user()?->id);

        return back()->with('success', 'Partner Pass pricing and P2P daily limits updated.');
    }

    /**
     * Issue a Track B1 wholesale Partner Pass seat batch for a learning center.
     */
    public function storePassBatch(Request $request, PartnerOrganization $partner): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'duration_days' => ['required', 'integer', 'min:7', 'max:365'],
            'unit_wholesale_price_uzs' => ['required', 'integer', 'min:5000', 'max:500000'],
            'quantity' => ['required', 'integer', 'min:1', 'max:1000'],
            'payment_status' => ['required', 'string', Rule::in(['pending', 'paid'])],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $batch = $this->partnerPassService->createB2bBatch($partner, $validated);

        return back()->with('success', "Partner Pass batch '{$batch->title}' created ({$batch->quantity} seats).");
    }

    /**
     * Activate a pending Track B1 wholesale Partner Pass batch and generate activation codes.
     */
    public function activatePassBatch(PartnerPassBatch $batch): RedirectResponse
    {
        $generated = $this->partnerPassService->activatePaidBatch($batch);

        return back()->with('success', "Batch marked paid and {$generated} Partner Pass code(s) generated.");
    }

    /**
     * Confirm payment for a direct B2C retail Partner Pass order and accrue attributed partner commission.
     */
    public function confirmRetailPass(PartnerPass $partnerPass): RedirectResponse
    {
        $this->partnerPassService->confirmRetailPurchase($partnerPass);

        return back()->with('success', 'B2C Partner Pass activated.');
    }

    /**
     * Reject a pending B2C retail Partner Pass payment order.
     */
    public function rejectRetailPass(PartnerPass $partnerPass): RedirectResponse
    {
        $this->partnerPassService->rejectRetailPurchase($partnerPass);

        return back()->with('success', 'B2C Partner Pass payment rejected.');
    }

    /**
     * Provision or link a partner staff login to a learning center.
     */
    public function storeStaff(Request $request, PartnerOrganization $partner): RedirectResponse
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:255'],
            'phone_number' => ['nullable', 'string', 'max:40'],
            'staff_role' => ['required', 'string', Rule::in(['director', 'manager', 'accountant'])],
            'password' => ['nullable', 'string', 'min:8', 'max:120'],
            'send_setup_email' => ['nullable', 'boolean'],
        ]);

        $email = strtolower(trim($validated['email']));
        $existingUser = User::where('email', $email)->first();

        if ($existingUser && $existingUser->role !== 'partner') {
            return back()->withErrors([
                'email' => 'This email already belongs to a non-partner user account.',
            ]);
        }

        $isNewUser = $existingUser === null;
        $hasManualPassword = ! empty($validated['password']);

        $user = DB::transaction(function () use ($validated, $partner, $email, $existingUser, $hasManualPassword) {
            if ($existingUser) {
                $updates = [
                    'full_name' => trim($validated['full_name']),
                    'phone_number' => $validated['phone_number'] ?? $existingUser->phone_number,
                ];
                if ($hasManualPassword) {
                    $updates['password'] = Hash::make($validated['password']);
                    $updates['has_password'] = true;
                }
                if (! $existingUser->email_verified_at) {
                    $updates['email_verified_at'] = now();
                }
                $existingUser->update($updates);
                $user = $existingUser->fresh();
            } else {
                $user = User::create([
                    'full_name' => trim($validated['full_name']),
                    'email' => $email,
                    'phone_number' => $validated['phone_number'] ?? null,
                    'role' => 'partner',
                    'password' => Hash::make($hasManualPassword ? $validated['password'] : Str::random(32)),
                    'has_password' => true,
                    'email_verified_at' => now(),
                ]);
            }

            PartnerOrganizationUser::updateOrCreate(
                [
                    'partner_organization_id' => $partner->id,
                    'user_id' => $user->id,
                ],
                [
                    'staff_role' => $validated['staff_role'],
                    'is_active' => true,
                ],
            );

            if ($validated['staff_role'] === 'director' && ! $partner->director_user_id) {
                $partner->update(['director_user_id' => $user->id]);
            }

            return $user;
        });

        $shouldSendInvite = ! $hasManualPassword || ! empty($validated['send_setup_email']);
        if ($isNewUser && $shouldSendInvite) {
            try {
                Password::broker()->sendResetLink(['email' => $user->email]);
            } catch (\Throwable) {
                // Keep provisioning atomic even when outbound mail is disabled locally.
            }
        }

        return back()->with('success', "Partner staff access saved for {$user->email}.");
    }

    /**
     * Activate or suspend a partner staff login.
     */
    public function toggleStaffStatus(PartnerOrganizationUser $membership): RedirectResponse
    {
        $membership->update([
            'is_active' => ! $membership->is_active,
        ]);

        return back()->with('success', $membership->is_active ? 'Partner staff login enabled.' : 'Partner staff login suspended.');
    }

    /**
     * Remove a staff login association from a partner organization.
     */
    public function destroyStaff(PartnerOrganizationUser $membership): RedirectResponse
    {
        $org = $membership->partnerOrganization;
        $userId = $membership->user_id;
        $membership->delete();

        if ($org && $org->director_user_id === $userId) {
            $nextDirector = PartnerOrganizationUser::where('partner_organization_id', $org->id)
                ->where('is_active', true)
                ->orderByRaw("CASE WHEN staff_role = 'director' THEN 0 ELSE 1 END")
                ->first();
            $org->update(['director_user_id' => $nextDirector?->user_id]);
        }

        return back()->with('success', 'Partner staff membership removed.');
    }
}
