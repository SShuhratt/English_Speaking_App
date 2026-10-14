<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Services\HumoPaymentService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PupilBookingController extends Controller
{
    public function index(Request $request)
    {
        $bookings = Appointment::where('pupil_id', $request->user()->id)
            ->with(['teacher', 'cancelledBy'])
            ->orderByDesc('start_at')
            ->paginate();

        return Inertia::render('pupil/bookings/index', [
            'bookings' => $bookings,
        ]);
    }

    public function uploadReceipt(Request $request, Appointment $appointment, HumoPaymentService $humoPaymentService)
    {
        if ($appointment->pupil_id !== $request->user()->id) {
            abort(403);
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
            appointmentId: $appointment->id
        );

        if ($result['status'] === 'confirmed') {
            return back()->with('success', "To'lov muvaffaqiyatli tasdiqlandi!");
        }

        if ($result['status'] === 'receipt_saved') {
            return back()->with('success', "Chek qabul qilindi. Bank to'lovi kelishi bilan avtomatik tasdiqlanadi.");
        }

        return back()->with('error', $result['message'] ?? "Chekni tasdiqlab bo'lmadi.");
    }
}
