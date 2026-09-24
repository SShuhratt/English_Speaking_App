<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\PupilPackage;
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
        $tab = $request->query('tab', 'appointments'); // 'appointments' or 'packages'

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

        $packageQuery = PupilPackage::with([
            'teacher.teacherProfile',
            'pupil.pupilProfile',
        ]);

        if ($statusFilter === 'accepted') {
            $packageQuery->where('payment_status', 'verifying');
        } elseif ($statusFilter === 'confirmed') {
            $packageQuery->where('payment_status', 'paid');
        } elseif ($statusFilter === 'rejected') {
            $packageQuery->where('payment_status', 'rejected');
        }

        $packages = $packageQuery->latest()->paginate(15, ['*'], 'packages_page')->withQueryString();

        $stats = [
            'pending_verifications' => Appointment::where('status', 'accepted')->count(),
            'total_confirmed' => Appointment::where('status', 'confirmed')->count(),
            'total_rejected' => Appointment::where('status', 'rejected')->count(),
            'total_cancelled' => Appointment::where('status', 'cancelled')->count(),
            'pending_package_verifications' => PupilPackage::where('payment_status', 'verifying')->count(),
            'total_package_confirmed' => PupilPackage::where('payment_status', 'paid')->count(),
            'total_package_rejected' => PupilPackage::where('payment_status', 'rejected')->count(),
        ];

        return Inertia::render('admin/dashboard', [
            'appointments' => $appointments,
            'packages' => $packages,
            'stats' => $stats,
            'currentFilter' => $statusFilter,
            'currentTab' => $tab,
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

    /**
     * Confirm payment for conversation package
     */
    public function confirmPackagePayment(string $id)
    {
        try {
            $package = PupilPackage::findOrFail($id);

            if ($package->payment_status === 'paid') {
                throw new \Exception('Package payment is already confirmed.');
            }

            $package->update([
                'payment_status' => 'paid',
                'status' => 'active',
            ]);

            return back()->with('success', 'Package payment confirmed successfully. Minutes are now active for the student.');
        } catch (\Throwable $e) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => $e->getMessage(),
            ]);

            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Reject payment for conversation package with reason
     */
    public function rejectPackagePayment(Request $request, string $id)
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:3', 'max:1000'],
        ]);

        try {
            $package = PupilPackage::findOrFail($id);

            if ($package->payment_status === 'paid') {
                throw new \Exception('Cannot reject a package that has already been confirmed as paid.');
            }

            $package->update([
                'payment_status' => 'rejected',
                'payment_rejection_reason' => $validated['reason'],
                'status' => 'cancelled',
            ]);

            return back()->with('success', 'Package payment rejected with reason provided.');
        } catch (\Throwable $e) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => $e->getMessage(),
            ]);

            return back()->with('error', $e->getMessage());
        }
    }
}
