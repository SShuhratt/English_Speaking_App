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

        $query = Appointment::with([
            'teacher.teacherProfile',
            'pupil.pupilProfile',
            'cancelledBy:id,full_name,email,role',
        ]);

        if ($statusFilter === 'accepted') {
            $query->where('status', 'accepted');
        } elseif ($statusFilter === 'confirmed') {
            $query->where('status', 'confirmed');
        } elseif ($statusFilter === 'rejected') {
            $query->where('status', 'rejected');
        } elseif ($statusFilter === 'cancelled') {
            $query->where('status', 'cancelled');
        } else {
            $query->whereIn('status', ['accepted', 'confirmed', 'rejected', 'cancelled']);
        }

        $appointments = $query->latest()->paginate(15)->withQueryString();

        $stats = [
            'pending_verifications' => Appointment::where('status', 'accepted')->count(),
            'total_confirmed' => Appointment::where('status', 'confirmed')->count(),
            'total_rejected' => Appointment::where('status', 'rejected')->count(),
            'total_cancelled' => Appointment::where('status', 'cancelled')->count(),
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
        try {
            $appointment = $this->bookingService->adminConfirmPayment($id);

            return back()->with('success', 'Payment confirmed successfully. Session is now confirmed.');
        } catch (\Throwable $e) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => $e->getMessage(),
            ]);

            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Reject payment for appointment with reason
     */
    public function rejectPayment(Request $request, string $id)
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:3', 'max:1000'],
        ]);

        try {
            $appointment = $this->bookingService->adminRejectPayment($id, $validated['reason']);

            return back()->with('success', 'Payment rejected with reason provided.');
        } catch (\Throwable $e) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => $e->getMessage(),
            ]);

            return back()->with('error', $e->getMessage());
        }
    }
}
