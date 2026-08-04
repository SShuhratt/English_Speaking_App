<?php

namespace App\Http\Controllers;

use App\Models\SupportMessage;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminUserController extends Controller
{
    /**
     * List all teachers for Admin with filtering & unread message count
     */
    public function teachers(Request $request)
    {
        $statusFilter = $request->query('status', 'all');

        $query = User::where('role', 'teacher')->with(['teacherProfile']);

        if ($statusFilter === 'verified') {
            $query->whereHas('teacherProfile', fn ($q) => $q->where('is_verified', true));
        } elseif ($statusFilter === 'unverified') {
            $query->where(function ($q) {
                $q->whereDoesntHave('teacherProfile')
                    ->orWhereHas('teacherProfile', fn ($q2) => $q2->where('is_verified', false));
            });
        } elseif ($statusFilter === 'new') {
            $query->where('created_at', '>=', now()->subDays(7));
        }

        $teachers = $query->latest()->paginate(15)->withQueryString();

        $teachers->getCollection()->transform(function ($teacher) {
            $teacher->unread_messages_count = SupportMessage::where('user_id', $teacher->id)
                ->where('is_read_by_admin', false)
                ->count();
            $teacher->is_new = $teacher->created_at >= now()->subDays(7);

            return $teacher;
        });

        return Inertia::render('admin/teachers', [
            'teachers' => $teachers,
            'currentFilter' => $statusFilter,
        ]);
    }

    /**
     * List all pupils for Admin with unread message count
     */
    public function pupils(Request $request)
    {
        $pupils = User::where('role', 'pupil')
            ->with(['pupilProfile'])
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $pupils->getCollection()->transform(function ($pupil) {
            $pupil->unread_messages_count = SupportMessage::where('user_id', $pupil->id)
                ->where('is_read_by_admin', false)
                ->count();

            return $pupil;
        });

        return Inertia::render('admin/pupils', [
            'pupils' => $pupils,
        ]);
    }

    /**
     * Toggle or set teacher verification status
     */
    public function verifyTeacher(Request $request, string $id)
    {
        $user = User::where('id', $id)->where('role', 'teacher')->firstOrFail();

        $profile = $user->teacherProfile;
        if (! $profile) {
            $profile = $user->teacherProfile()->create([
                'age' => 25,
                'phone_number' => '',
                'overall_level' => 'CEFR C1',
                'speaking_band' => '8.0',
            ]);
        }

        $isVerified = $request->has('verified') ? (bool) $request->input('verified') : ! $profile->is_verified;

        $profile->update([
            'is_verified' => $isVerified,
        ]);

        return back()->with('success', 'Teacher verification status updated.');
    }

    /**
     * Update teacher certificates, score fields, and caches (overall_level & speaking_band) for Admin
     */
    public function updateCertificates(Request $request, string $id)
    {
        $user = User::where('id', $id)->where('role', 'teacher')->firstOrFail();

        $profile = $user->teacherProfile;
        if (! $profile) {
            $profile = $user->teacherProfile()->create([
                'age' => 25,
                'phone_number' => '',
                'overall_level' => 'CEFR C1',
                'speaking_band' => '8.0',
            ]);
        }

        $validated = $request->validate([
            'certificates' => ['required', 'array'],
            'overall_level' => ['nullable', 'string', 'max:255'],
            'speaking_band' => ['nullable', 'numeric', 'min:0', 'max:9'],
        ]);

        $updateData = [
            'certificates' => $validated['certificates'],
        ];

        if (isset($validated['overall_level'])) {
            $updateData['overall_level'] = $validated['overall_level'];
        }
        if (isset($validated['speaking_band'])) {
            $updateData['speaking_band'] = $validated['speaking_band'];
        }

        $profile->update($updateData);

        return back()->with('success', 'Teacher certificate scores and caches updated successfully.');
    }
}
