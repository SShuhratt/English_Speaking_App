<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PupilSessionController extends Controller
{
    public function index(Request $request)
    {
        $sessions = Appointment::where('pupil_id', $request->user()->id)
            ->with('teacher')
            ->latest()
            ->paginate();

        return Inertia::render('pupil/sessions', [
            'sessions' => $sessions,
        ]);
    }
}
