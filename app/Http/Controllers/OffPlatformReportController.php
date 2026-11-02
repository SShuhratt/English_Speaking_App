<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\OffPlatformReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class OffPlatformReportController extends Controller
{
    /**
     * Submit an off-platform solicitation report for an appointment.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'appointment_id' => ['required', 'uuid', 'exists:appointments,id'],
            'reported_contact' => ['required', 'string', 'min:3', 'max:150'],
            'description' => ['required', 'string', 'min:10', 'max:1000'],
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $appointment = Appointment::findOrFail($request->appointment_id);

        // Verify the pupil was the client of this appointment
        if ($appointment->pupil_id !== $user->id) {
            abort(403, 'Unauthorized action.');
        }

        // Only allow reporting for finished/past appointments
        if ($appointment->status !== 'completed' && (! $appointment->end_at || ! $appointment->end_at->isPast())) {
            return back()->withErrors([
                'appointment_id' => 'You can only report past or completed sessions.',
            ]);
        }

        // Prevent duplicate report for the same appointment
        if (OffPlatformReport::where('appointment_id', $appointment->id)->exists()) {
            return back()->withErrors([
                'appointment_id' => 'A report has already been submitted for this session.',
            ]);
        }

        // Prevent duplicate bounty reports by the same pupil against the same teacher
        $alreadyReportedTeacher = OffPlatformReport::where('pupil_id', $user->id)
            ->where('teacher_id', $appointment->teacher_id)
            ->exists();

        if ($alreadyReportedTeacher) {
            return back()->withErrors([
                'reported_contact' => 'You have already submitted a report for this teacher.',
            ]);
        }

        OffPlatformReport::create([
            'appointment_id' => $appointment->id,
            'pupil_id' => $user->id,
            'teacher_id' => $appointment->teacher_id,
            'reported_contact' => trim($request->reported_contact),
            'description' => trim($request->description),
            'status' => 'pending',
        ]);

        return back()->with('success', 'Your report has been submitted for review. If verified, a 100% free lesson voucher will be credited to your account.');
    }
}
