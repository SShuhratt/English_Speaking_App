<?php

namespace App\Http\Controllers;

use App\Models\OffPlatformReport;
use App\Models\UserDiscountVoucher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AdminOffPlatformReportController extends Controller
{
    /**
     * Display a listing of off-platform solicitation reports.
     */
    public function index(Request $request)
    {
        $status = $request->query('status', 'all');

        $query = OffPlatformReport::with([
            'pupil:id,full_name,email,avatar',
            'teacher:id,full_name,email,avatar',
            'teacher.teacherProfile:id,user_id,phone_number',
            'reviewer:id,full_name',
            'rewardedVoucher:id,voucher_code,is_redeemed,discount_percent',
            'appointment:id,start_at,end_at,duration_minutes',
        ])->latest();

        if (in_array($status, ['pending', 'verified', 'rejected'])) {
            $query->where('status', $status);
        }

        $reports = $query->paginate(20)->withQueryString();

        $stats = [
            'pending' => OffPlatformReport::where('status', 'pending')->count(),
            'verified' => OffPlatformReport::where('status', 'verified')->count(),
            'rejected' => OffPlatformReport::where('status', 'rejected')->count(),
            'all' => OffPlatformReport::count(),
        ];

        return Inertia::render('admin/reports', [
            'reports' => $reports,
            'filters' => [
                'status' => $status,
            ],
            'stats' => $stats,
        ]);
    }

    /**
     * Verify an off-platform report and issue a 100% free lesson voucher to the pupil.
     */
    public function verify(Request $request, string $id)
    {
        return DB::transaction(function () use ($request, $id) {
            $report = OffPlatformReport::lockForUpdate()->findOrFail($id);

            if ($report->status === 'verified') {
                return back()->withErrors(['message' => 'This report has already been verified and rewarded.']);
            }

            // Create single-use 100% discount voucher for the reporting pupil
            $voucher = UserDiscountVoucher::create([
                'user_id' => $report->pupil_id,
                'voucher_code' => 'BOUNTY-'.strtoupper(Str::random(6)),
                'discount_percent' => 100,
                'xp_spent' => 0,
                'is_redeemed' => false,
            ]);

            $report->update([
                'status' => 'verified',
                'reviewed_by' => $request->user()->id,
                'rewarded_voucher_id' => $voucher->id,
                'admin_notes' => $request->input('admin_notes', 'Verified off-platform solicitation.'),
            ]);

            return back()->with('success', 'Report verified and a 100% free lesson voucher has been issued to the pupil.');
        });
    }

    /**
     * Reject an off-platform report.
     */
    public function reject(Request $request, string $id)
    {
        $report = OffPlatformReport::lockForUpdate()->findOrFail($id);

        if ($report->status === 'verified') {
            return back()->withErrors(['message' => 'Cannot reject a report that has already been verified and rewarded.']);
        }

        $report->update([
            'status' => 'rejected',
            'reviewed_by' => $request->user()->id,
            'admin_notes' => $request->input('admin_notes', 'Rejected by admin after review.'),
        ]);

        return back()->with('success', 'Report has been rejected.');
    }
}
