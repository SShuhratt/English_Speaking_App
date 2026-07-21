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

        // Handle avatar upload if present
        if ($request->hasFile('avatar')) {
            $request->validate([
                'avatar' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,svg,webp', 'max:5120'], // 5MB max
            ]);
            $disk = env('FILESYSTEM_DISK', 'public');
            $path = $request->file('avatar')->store('avatars', $disk);
            $user->avatar = Storage::disk($disk)->url($path);
        }

        $user->save();

        if ($user->role === 'teacher') {
            if ($request->has('price') && $request->input('price') === '') {
                $request->merge(['price' => null]);
            }

            // Validate teacher profile details
            $profileData = $request->validate([
                'age' => ['nullable', 'integer', 'min:1', 'max:120'],
                'phone_number' => ['nullable', 'string', 'max:20'],
                'experience_years' => ['nullable', 'string', 'max:100'],
                'workplace' => ['nullable', 'string', 'max:255'],
                'overall_level' => ['nullable', 'string', 'max:255'],
                'speaking_band' => ['nullable', 'numeric', 'min:0', 'max:9'],
                'labels' => ['nullable', 'array'],
                'labels.*' => ['string', 'in:mock,freestyle,lessons,business english,practice q&a,job interview prep'],
                'headline' => ['nullable', 'string', 'max:90'],
                'bio' => ['nullable', 'string', 'max:600'],
                'price' => ['nullable', 'integer', 'min:0'],
                'intro_video_url' => ['nullable', 'string'],
            ]);

            // Handle intro video file upload
            if ($request->hasFile('intro_video')) {
                $request->validate([
                    'intro_video' => ['nullable', 'file', 'mimes:mp4,webm,quicktime', 'max:102400'], // 100MB max
                ]);
                $disk = env('FILESYSTEM_DISK', 'public');
                $path = $request->file('intro_video')->store('videos', $disk);
                $profileData['intro_video_url'] = Storage::disk($disk)->url($path);
            }

            // Validate rich certificates upload files if present
            if ($request->hasFile('ielts_certificates')) {
                $request->validate([
                    'ielts_certificates' => ['nullable', 'array'],
                    'ielts_certificates.*' => ['file', 'mimes:pdf,png,jpg,jpeg,svg,webp,gif', 'max:10240'], // 10MB max per file
                ]);
            }

            $uploadedFiles = $request->file('ielts_certificates') ?? [];
            $certsInput = $request->input('certificates', []);
            $finalCertificates = [];

            // Support both old comma-separated input format and new rich object list
            if (is_string($certsInput)) {
                $rawCerts = array_filter(array_map('trim', explode(',', $certsInput)));
                foreach ($rawCerts as $legacyCert) {
                    $finalCertificates[] = [
                        'title' => $legacyCert,
                        'file_url' => null,
                        'file_name' => '',
                        'status' => 'verified',
                    ];
                }

                // Process uploaded files if any
                foreach ($uploadedFiles as $file) {
                    $disk = env('FILESYSTEM_DISK', 'public');
                    $path = $file->store('certificates', $disk);
                    $finalCertificates[] = [
                        'title' => $file->getClientOriginalName(),
                        'file_url' => Storage::disk($disk)->url($path),
                        'file_name' => $file->getClientOriginalName(),
                        'status' => 'pending',
                    ];
                }
            } elseif (is_array($certsInput)) {
                foreach ($certsInput as $index => $certData) {
                    if (is_string($certData)) {
                        $isUrl = str_starts_with($certData, 'http') || str_starts_with($certData, '/storage');
                        $finalCertificates[] = [
                            'title' => $isUrl ? '' : $certData,
                            'file_url' => $isUrl ? $certData : null,
                            'file_name' => $isUrl ? basename(parse_url($certData, PHP_URL_PATH)) : '',
                            'status' => 'verified',
                        ];
                    } else {
                        $title = $certData['title'] ?? '';
                        $fileUrl = $certData['file_url'] ?? null;
                        $fileName = $certData['file_name'] ?? null;
                        $status = $certData['status'] ?? 'pending';

                        if (isset($uploadedFiles[$index])) {
                            $file = $uploadedFiles[$index];
                            $disk = env('FILESYSTEM_DISK', 'public');
                            $path = $file->store('certificates', $disk);
                            $fileUrl = Storage::disk($disk)->url($path);
                            $fileName = $file->getClientOriginalName();
                            $status = 'pending';
                        }

                        if ($title || $fileUrl) {
                            $finalCertificates[] = [
                                'title' => $title,
                                'file_url' => $fileUrl,
                                'file_name' => $fileName,
                                'status' => $status,
                            ];
                        }
                    }
                }
            }

            // Fallback if certificates is empty but we have file uploads (e.g. from legacy clients or registration)
            if (empty($certsInput) && ! empty($uploadedFiles)) {
                foreach ($uploadedFiles as $file) {
                    $disk = env('FILESYSTEM_DISK', 'public');
                    $path = $file->store('certificates', $disk);
                    $finalCertificates[] = [
                        'title' => $file->getClientOriginalName(),
                        'file_url' => Storage::disk($disk)->url($path),
                        'file_name' => $file->getClientOriginalName(),
                        'status' => 'pending',
                    ];
                }
            }

            $profileData['certificates'] = $finalCertificates;

            $user->teacherProfile()->updateOrCreate(
                ['user_id' => $user->id],
                $profileData
            );
        } elseif ($user->role === 'pupil') {
            $profileData = $request->validate([
                'age' => ['nullable', 'integer', 'min:1', 'max:120'],
                'phone_number' => ['nullable', 'string', 'max:20'],
                'headline' => ['nullable', 'string', 'max:90'],
                'bio' => ['nullable', 'string', 'max:600'],
                'target_overall_band' => ['nullable', 'numeric', 'min:0', 'max:9'],
                'target_speaking_band' => ['nullable', 'numeric', 'min:0', 'max:9'],
                'labels' => ['nullable', 'array'],
                'labels.*' => ['string', 'in:freestyle conversation,practice q&a,ielts speaking mock,job interview prep,vocabulary expansion,business english'],
            ]);

            // Validate and process rich certificates (PDF & Images)
            if ($request->hasFile('ielts_certificates')) {
                $request->validate([
                    'ielts_certificates' => ['nullable', 'array'],
                    'ielts_certificates.*' => ['file', 'mimes:pdf,png,jpg,jpeg,svg,webp,gif', 'max:10240'],
                ]);
            }

            $uploadedFiles = $request->file('ielts_certificates') ?? [];
            $certsInput = $request->input('certificates', []);
            $finalCertificates = [];

            if (is_string($certsInput)) {
                $rawCerts = array_filter(array_map('trim', explode(',', $certsInput)));
                foreach ($rawCerts as $legacyCert) {
                    $finalCertificates[] = [
                        'title' => $legacyCert,
                        'file_url' => null,
                        'file_name' => '',
                        'status' => 'verified',
                    ];
                }
                foreach ($uploadedFiles as $file) {
                    $disk = env('FILESYSTEM_DISK', 'public');
                    $path = $file->store('certificates', $disk);
                    $finalCertificates[] = [
                        'title' => $file->getClientOriginalName(),
                        'file_url' => Storage::disk($disk)->url($path),
                        'file_name' => $file->getClientOriginalName(),
                        'status' => 'pending',
                    ];
                }
            } elseif (is_array($certsInput)) {
                foreach ($certsInput as $index => $certData) {
                    if (is_string($certData)) {
                        $isUrl = str_starts_with($certData, 'http') || str_starts_with($certData, '/storage');
                        $finalCertificates[] = [
                            'title' => $isUrl ? '' : $certData,
                            'file_url' => $isUrl ? $certData : null,
                            'file_name' => $isUrl ? basename(parse_url($certData, PHP_URL_PATH)) : '',
                            'status' => 'verified',
                        ];
                    } else {
                        $title = $certData['title'] ?? '';
                        $fileUrl = $certData['file_url'] ?? null;
                        $fileName = $certData['file_name'] ?? null;
                        $status = $certData['status'] ?? 'pending';

                        if (isset($uploadedFiles[$index])) {
                            $file = $uploadedFiles[$index];
                            $disk = env('FILESYSTEM_DISK', 'public');
                            $path = $file->store('certificates', $disk);
                            $fileUrl = Storage::disk($disk)->url($path);
                            $fileName = $file->getClientOriginalName();
                            $status = 'pending';
                        }

                        if ($title || $fileUrl) {
                            $finalCertificates[] = [
                                'title' => $title,
                                'file_url' => $fileUrl,
                                'file_name' => $fileName,
                                'status' => $status,
                            ];
                        }
                    }
                }
            }

            if (empty($certsInput) && ! empty($uploadedFiles)) {
                foreach ($uploadedFiles as $file) {
                    $disk = env('FILESYSTEM_DISK', 'public');
                    $path = $file->store('certificates', $disk);
                    $finalCertificates[] = [
                        'title' => $file->getClientOriginalName(),
                        'file_url' => Storage::disk($disk)->url($path),
                        'file_name' => $file->getClientOriginalName(),
                        'status' => 'pending',
                    ];
                }
            }

            $profileData['certificates'] = $finalCertificates;

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
