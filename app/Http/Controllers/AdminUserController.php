<?php

namespace App\Http\Controllers;

use App\Models\SupportMessage;
use App\Models\User;
use App\Services\CertificateValidationService;
use App\Services\FileStorageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AdminUserController extends Controller
{
    /**
     * List all teachers for Admin with filtering & unread message count
     */
    public function teachers(Request $request)
    {
        $statusFilter = $request->query('status', 'all');

        $baseQuery = User::where(function ($q) {
            $q->where('role', 'teacher')
                ->orWhereHas('teacherProfile');
        });

        // Compute filter counts before applying the active status filter
        $filterCounts = [
            'all' => (clone $baseQuery)->count(),
            'verified' => (clone $baseQuery)->whereHas('teacherProfile', fn ($q) => $q->where('is_verified', true))->count(),
            'unverified' => (clone $baseQuery)->where(function ($q) {
                $q->whereDoesntHave('teacherProfile')
                    ->orWhereHas('teacherProfile', fn ($q2) => $q2->where('is_verified', false));
            })->count(),
            'new' => (clone $baseQuery)->where('users.created_at', '>=', now()->subDays(7))->count(),
        ];

        $query = (clone $baseQuery)->with([
            'teacherProfile:id,user_id,phone_number,overall_level,speaking_band,price,is_verified,certificates,intro_video_url,labels,headline,bio,experience_years,workplace,age,country_code,city',
        ]);

        if ($statusFilter === 'verified') {
            $query->whereHas('teacherProfile', fn ($q) => $q->where('is_verified', true));
        } elseif ($statusFilter === 'unverified') {
            $query->where(function ($q) {
                $q->whereDoesntHave('teacherProfile')
                    ->orWhereHas('teacherProfile', fn ($q2) => $q2->where('is_verified', false));
            });
        } elseif ($statusFilter === 'new') {
            $query->where('users.created_at', '>=', now()->subDays(7));
        }

        $perPageParam = $request->query('per_page', '15');
        if ($perPageParam === 'all') {
            $perPage = max((clone $query)->count(), 1);
        } elseif (is_numeric($perPageParam) && (int) $perPageParam > 0) {
            $perPage = min(max((int) $perPageParam, 5), 100);
        } else {
            $perPageParam = '15';
            $perPage = 15;
        }

        $teachers = $query->latest('users.created_at')->paginate($perPage)->withQueryString();

        $teachers->getCollection()->transform(function ($teacher) {
            $teacher->unread_messages_count = SupportMessage::where('user_id', $teacher->id)
                ->where('is_read_by_admin', false)
                ->count();
            $teacher->is_new = $teacher->created_at >= now()->subDays(7);
            $teacher->phone_number = $teacher->phone_number ?: $teacher->teacherProfile?->phone_number;

            return $teacher;
        });

        return Inertia::render('admin/teachers', [
            'teachers' => $teachers,
            'currentFilter' => $statusFilter,
            'filterCounts' => $filterCounts,
            'perPage' => $perPageParam,
        ]);
    }

    /**
     * List all pupils for Admin with unread message count
     */
    public function pupils(Request $request)
    {
        $perPageParam = $request->query('per_page', '15');
        $query = User::where('role', 'pupil')
            ->with(['pupilProfile'])
            ->latest();

        if ($perPageParam === 'all') {
            $perPage = max((clone $query)->count(), 1);
        } elseif (is_numeric($perPageParam) && (int) $perPageParam > 0) {
            $perPage = min(max((int) $perPageParam, 5), 100);
        } else {
            $perPageParam = '15';
            $perPage = 15;
        }

        $pupils = $query->paginate($perPage)->withQueryString();

        $pupils->getCollection()->transform(function ($pupil) {
            $pupil->unread_messages_count = SupportMessage::where('user_id', $pupil->id)
                ->where('is_read_by_admin', false)
                ->count();
            $pupil->phone_number = $pupil->phone_number ?: $pupil->pupilProfile?->phone_number;

            return $pupil;
        });

        return Inertia::render('admin/pupils', [
            'pupils' => $pupils,
            'perPage' => $perPageParam,
        ]);
    }

    /**
     * Toggle or set teacher verification status
     */
    public function verifyTeacher(Request $request, string $id)
    {
        $user = User::where('id', $id)
            ->where(function ($q) {
                $q->where('role', 'teacher')->orWhereHas('teacherProfile');
            })
            ->firstOrFail();

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

        $certs = $profile->certificates ?? [];
        if (is_string($certs)) {
            $certs = json_decode($certs, true) ?? [];
        }

        $targetStatus = $isVerified ? 'verified' : 'under_review';

        if (is_array($certs)) {
            $certs = array_map(function ($cert) use ($targetStatus) {
                if (is_array($cert)) {
                    $cert['status'] = $targetStatus;
                }

                return $cert;
            }, $certs);
        }

        $profile->update([
            'is_verified' => $isVerified,
            'certificates' => $certs,
        ]);

        return back()->with('success', 'Teacher verification status updated.');
    }

    /**
     * Update teacher certificates, score fields, and caches (overall_level & speaking_band) for Admin
     */
    public function updateCertificates(Request $request, string $id)
    {
        $user = User::where('id', $id)
            ->where(function ($q) {
                $q->where('role', 'teacher')->orWhereHas('teacherProfile');
            })
            ->firstOrFail();

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

        CertificateValidationService::assertValidCertificates($validated['certificates']);

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

    /**
     * Verify or unverify an individual certificate at a specific index
     */
    public function verifySingleCertificate(Request $request, string $id, int $index)
    {
        $user = User::where('id', $id)
            ->where(function ($q) {
                $q->where('role', 'teacher')->orWhereHas('teacherProfile');
            })
            ->firstOrFail();
        $profile = $user->teacherProfile;

        if (! $profile) {
            return back()->with('error', 'Teacher profile not found.');
        }

        $certs = $profile->certificates ?? [];
        if (is_string($certs)) {
            $certs = json_decode($certs, true) ?? [];
        }

        if (! isset($certs[$index]) || ! is_array($certs[$index])) {
            return back()->with('error', 'Certificate not found.');
        }

        $status = $request->input('status');
        if (! in_array($status, ['verified', 'under_review'])) {
            $status = ($certs[$index]['status'] ?? 'under_review') === 'verified' ? 'under_review' : 'verified';
        }

        $certs[$index]['status'] = $status;

        $profile->update([
            'certificates' => $certs,
        ]);

        return back()->with('success', 'Certificate status updated successfully.');
    }

    /**
     * Download a teacher's intro video for the admin.
     *
     * For local/public disk videos the file is streamed with a
     * Content-Disposition: attachment header so the browser saves it.
     * For GCS (or any remote URL that is already publicly accessible)
     * we redirect directly to the URL — the browser will download it.
     */
    public function downloadIntroVideo(string $id)
    {
        $user = User::where('id', $id)
            ->where(function ($q) {
                $q->where('role', 'teacher')->orWhereHas('teacherProfile');
            })
            ->firstOrFail();
        $profile = $user->teacherProfile;

        if (! $profile || ! $profile->intro_video_url) {
            abort(404, 'This teacher has no intro video uploaded.');
        }

        $videoUrl = $profile->intro_video_url;
        $relativePath = FileStorageService::extractStoragePath($videoUrl);
        $filename = 'intro-video-'.$user->id.'.'.pathinfo($videoUrl, PATHINFO_EXTENSION ?: 'mp4');

        // Try to serve from the configured default disk first
        $defaultDisk = config('filesystems.default', 'public');
        if ($relativePath && Storage::disk($defaultDisk)->exists($relativePath)) {
            return Storage::disk($defaultDisk)->download($relativePath, $filename);
        }

        // Fallback: try the public disk (local)
        if ($relativePath && Storage::disk('public')->exists($relativePath)) {
            return Storage::disk('public')->download($relativePath, $filename);
        }

        // For remote cloud URLs (GCS, S3, etc.) redirect so the browser downloads directly
        return redirect()->away($videoUrl);
    }

    /**
     * Delete a teacher or pupil account cleanly
     */
    public function destroy(string $id)
    {
        $user = User::findOrFail($id);

        if ($user->role === 'admin') {
            abort(403, 'Admin users cannot be deleted.');
        }

        $user->delete();

        return back()->with('success', 'User deleted successfully.');
    }
}
