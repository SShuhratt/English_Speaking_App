<?php

namespace App\Http\Controllers;

use App\Models\GroupSession;
use App\Models\GroupSessionEnrollment;
use App\Services\GroupSessionService;
use App\Services\HumoPaymentService;
use Illuminate\Http\Request;

class PupilGroupSessionController extends Controller
{
    public function index(Request $request)
    {
        $sessions = GroupSession::where('status', 'scheduled')
            ->where('start_at', '>', now())
            ->whereHas('teacher.teacherProfile', fn ($q) => $q->where('is_verified', true))
            ->with(['teacher:id,full_name,avatar', 'teacher.teacherProfile'])
            ->orderBy('start_at', 'asc')
            ->get()
            ->map(function (GroupSession $session) use ($request) {
                $session->occupied_seats = $session->occupiedSeatsCount();
                $session->available_seats = $session->availableSeatsCount();
                $session->my_enrollment = GroupSessionEnrollment::where('group_session_id', $session->id)
                    ->where('pupil_id', $request->user()->id)
                    ->where('status', '!=', 'cancelled')
                    ->first();

                return $session;
            })
            ->values();

        return response()->json($sessions);
    }

    public function enroll(Request $request, GroupSession $groupSession, GroupSessionService $service)
    {
        $enrollment = $service->enroll($request->user(), $groupSession, $request->all());

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Seat reserved. Upload your payment receipt to confirm enrollment.',
                'enrollment' => $enrollment->load('groupSession.teacher'),
            ], 201);
        }

        return back()->with('success', 'Seat reserved! Upload your receipt to confirm.');
    }

    public function uploadReceipt(
        Request $request,
        GroupSessionEnrollment $enrollment,
        HumoPaymentService $humoPaymentService
    ) {
        if ($enrollment->pupil_id !== $request->user()->id) {
            abort(403, 'Unauthorized.');
        }

        $request->validate([
            'receipt' => 'nullable|file|mimes:jpeg,jpg,png,pdf,webp|max:10240',
            'receipt_text' => 'nullable|string|max:1000',
        ]);

        $fileOrText = $request->file('receipt') ?: $request->input('receipt_text');
        if (! $fileOrText) {
            return back()->with('error', 'Iltimos, chek faylini yuklang yoki chek matnini kiriting.');
        }

        $result = $humoPaymentService->claimWithReceipt(
            pupil: $request->user(),
            receiptDataOrText: $fileOrText,
            groupSessionEnrollmentId: $enrollment->id
        );

        if ($result['status'] === 'confirmed') {
            return back()->with('success', "Guruh mashg'uloti to'lovi muvaffaqiyatli tasdiqlandi!");
        }

        if ($result['status'] === 'receipt_saved') {
            return back()->with('success', "Chek qabul qilindi. Bank tasdig'i kelishi bilan avtomatik tasdiqlanadi.");
        }

        return back()->with('error', $result['message'] ?? "Chekni tasdiqlab bo'lmadi.");
    }

    public function cancelEnrollment(Request $request, GroupSessionEnrollment $enrollment)
    {
        if ($enrollment->pupil_id !== $request->user()->id) {
            abort(403, 'Unauthorized.');
        }

        $session = $enrollment->groupSession;
        if (! $session || $session->meeting_started || $session->status !== 'scheduled') {
            return back()->with('error', 'This enrollment can no longer be cancelled.');
        }

        $enrollment->update([
            'status' => 'cancelled',
            'payment_status' => $enrollment->payment_status === 'paid' ? 'refunded' : 'rejected',
            'payment_rejection_reason' => 'Cancelled by student before session start.',
            'reserved_until' => null,
        ]);

        return back()->with('success', 'Group seat reservation cancelled.');
    }
}
