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

        // Update role-specific profile details
        if ($user->role === 'teacher') {
            // Handle certificates formatting (comma-separated string to array)
            if ($request->has('certificates') && is_string($request->input('certificates'))) {
                $certs = array_filter(array_map('trim', explode(',', $request->input('certificates'))));
                $request->merge(['certificates' => $certs]);
            }

            $profileData = $request->validate([
                'age' => ['nullable', 'integer', 'min:18', 'max:100'],
                'phone_number' => ['nullable', 'string', 'max:20'],
                'experience_years' => ['nullable', 'numeric', 'min:0', 'max:80'],
                'workplace' => ['nullable', 'string', 'max:255'],
                'overall_level' => ['nullable', 'string', 'max:255'],
                'speaking_band' => ['nullable', 'numeric', 'min:0', 'max:9'],
                'certificates' => ['nullable', 'array'],
                'certificates.*' => ['string'],
                'labels' => ['nullable', 'array'],
                'labels.*' => ['string', 'in:mock,freestyle,lessons,business english'],
            ]);

            $user->teacherProfile()->updateOrCreate(
                ['user_id' => $user->id],
                $profileData
            );
        } elseif ($user->role === 'pupil') {
            $profileData = $request->validate([
                'age' => ['nullable', 'integer', 'min:1', 'max:100'],
                'phone_number' => ['nullable', 'string', 'max:20'],
                'level' => ['nullable', 'string', 'max:255'],
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
