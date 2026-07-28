<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Services\BookingService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function __construct(
        protected BookingService $bookingService
    ) {}

    /**
     * Admin Dashboard & Payment Verification Queue
     */
    public function index(Request $request)
    {
        $statusFilter = $request->query('status', 'accepted'); // default to pending verification ('accepted')

        $query = Appointment::with(['teacher.teacherProfile', 'pupil.pupilProfile']);

        if ($statusFilter === 'accepted') {
            $query->where('status', 'accepted');
        } elseif ($statusFilter === 'confirmed') {
            $query->where('status', 'confirmed');
        } elseif ($statusFilter === 'rejected') {
            $query->where('status', 'rejected');
        } else {
            $query->whereIn('status', ['accepted', 'confirmed', 'rejected']);
        }

        $appointments = $query->latest()->paginate(15)->withQueryString();

        $stats = [
            'pending_verifications' => Appointment::where('status', 'accepted')->count(),
            'total_confirmed' => Appointment::where('status', 'confirmed')->count(),
            'total_rejected' => Appointment::where('status', 'rejected')->count(),
        ];

        return Inertia::render('admin/dashboard', [
            'appointments' => $appointments,
            'stats' => $stats,
            'currentFilter' => $statusFilter,
        ]);
    }

    /**
     * Confirm payment for appointment
     */
    public function confirmPayment(string $id)
    {
        $appointment = $this->bookingService->adminConfirmPayment($id);

        return back()->with('success', 'Payment confirmed successfully. Session is now confirmed.');
    }

    /**
     * Reject payment for appointment with reason
     */
    public function rejectPayment(Request $request, string $id)
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:3', 'max:1000'],
        ]);

        $appointment = $this->bookingService->adminRejectPayment($id, $validated['reason']);

        return back()->with('success', 'Payment rejected with reason provided.');
    }
}
