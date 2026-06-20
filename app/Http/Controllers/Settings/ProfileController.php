<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        if ($user->role === 'teacher') {
            $user->load('teacherProfile');
        } elseif ($user->role === 'pupil') {
            $user->load('pupilProfile');
        }

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();

        // Update user basics
        $user->fill($request->only(['name', 'email']));

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        // Extract text certificates (from the comma-separated input)
        $textCerts = [];
        if ($request->has('certificates')) {
            if (is_string($request->input('certificates'))) {
                $textCerts = array_filter(array_map('trim', explode(',', $request->input('certificates'))));
            } elseif (is_array($request->input('certificates'))) {
                $textCerts = $request->input('certificates');
            }
        }

        // Extract remaining/existing uploaded certificates (sent as hidden inputs)
        $existingUploadedCerts = [];
        if ($request->has('existing_certificates')) {
            $existingUploadedCerts = $request->input('existing_certificates') ?? [];
        } else {
            // Fallback to currently stored certificate URLs if 'existing_certificates' is not sent
            $currentCerts = $user->role === 'teacher' 
                ? ($user->teacherProfile?->certificates ?? [])
                : ($user->pupilProfile?->certificates ?? []);
            
            $existingUploadedCerts = array_filter($currentCerts, function ($cert) {
                return str_starts_with($cert, 'http') || str_starts_with($cert, '/storage');
            });
        }

        // Handle newly uploaded files
        $newUploadedUrls = [];
        if ($request->hasFile('ielts_certificates')) {
            $request->validate([
                'ielts_certificates' => ['nullable', 'array'],
                'ielts_certificates.*' => ['file', 'mimes:pdf,png,jpg,jpeg', 'max:10240'], // 10MB max per file
            ]);

            $disk = env('FILESYSTEM_DISK', 'public');
            foreach ($request->file('ielts_certificates') as $file) {
                $path = $file->store('certificates', $disk);
                $newUploadedUrls[] = Storage::disk($disk)->url($path);
            }
        }

        // Merge all into one array
        $finalCertificates = array_values(array_unique(array_merge($textCerts, $existingUploadedCerts, $newUploadedUrls)));

        // Merge back into the request data
        $request->merge(['certificates' => $finalCertificates]);

        // Update role-specific profile details
        if ($user->role === 'teacher') {
            $profileData = $request->validate([
                'age' => ['nullable', 'integer', 'min:1', 'max:120'],
                'phone_number' => ['nullable', 'string', 'max:20'],
                'experience_years' => ['nullable', 'numeric', 'min:0', 'max:80'],
                'workplace' => ['nullable', 'string', 'max:255'],
                'overall_level' => ['nullable', 'string', 'max:255'],
                'speaking_band' => ['nullable', 'numeric', 'min:0', 'max:9'],
                'certificates' => ['nullable', 'array'],
                'certificates.*' => ['string'],
                'labels' => ['nullable', 'array'],
                'labels.*' => ['string', 'in:mock,freestyle,lessons,business english,practice q&a'],
            ]);

            $user->teacherProfile()->updateOrCreate(
                ['user_id' => $user->id],
                $profileData
            );
        } elseif ($user->role === 'pupil') {
            $profileData = $request->validate([
                'age' => ['nullable', 'integer', 'min:1', 'max:120'],
                'phone_number' => ['nullable', 'string', 'max:20'],
                'level' => ['nullable', 'string', 'max:255'],
                'certificates' => ['nullable', 'array'],
                'certificates.*' => ['string'],
            ]);

            $user->pupilProfile()->updateOrCreate(
                ['user_id' => $user->id],
                $profileData
            );
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('profile.edit');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
