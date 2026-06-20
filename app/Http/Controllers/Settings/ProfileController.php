<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

        // Handle certificates formatting (comma-separated string to array)
        if ($request->has('certificates') && is_string($request->input('certificates'))) {
            $certs = array_filter(array_map('trim', explode(',', $request->input('certificates'))));
            $request->merge(['certificates' => $certs]);
        }

        // Handle uploaded IELTS certificate file
        if ($request->hasFile('ielts_certificate')) {
            $request->validate([
                'ielts_certificate' => ['file', 'mimes:pdf,png,jpg,jpeg', 'max:10240'], // 10MB max
            ]);

            $path = $request->file('ielts_certificate')->store('certificates', 'public');
            $fileUrl = '/storage/' . $path;

            // Get existing or text-submitted certificates
            $existingCerts = $request->input('certificates');
            if (!is_array($existingCerts)) {
                $existingCerts = $user->role === 'teacher' 
                    ? ($user->teacherProfile?->certificates ?? [])
                    : ($user->pupilProfile?->certificates ?? []);
            }

            // Remove any old uploaded certificate from the list to keep it clean
            $existingCerts = array_filter($existingCerts, function ($cert) {
                return !str_starts_with($cert, '/storage/certificates/');
            });

            $existingCerts[] = $fileUrl;
            $request->merge(['certificates' => array_values($existingCerts)]);
        }

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
