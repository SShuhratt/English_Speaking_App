<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PupilBookingController extends Controller
{
    public function index(Request $request)
    {
        $bookings = Appointment::where('pupil_id', $request->user()->id)
            ->with('teacher')
            ->orderBy('start_at')
            ->paginate();

        return Inertia::render('pupil/bookings/index', [
            'bookings' => $bookings,
        ]);
    }
}
