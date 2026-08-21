<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Jobs\TranscodeIntroVideoJob;
use App\Services\FileStorageService;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
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

        // Check for server-level payload drop when CONTENT_LENGTH is set but inputs are empty
        if ($request->server('CONTENT_LENGTH') > 0 && empty($request->all()) && empty($request->allFiles())) {
            throw ValidationException::withMessages([
                'intro_video' => ['The uploaded payload exceeds the maximum server limit. Please upload a smaller video (under 100 MB).'],
            ]);
        }

        // Validate avatar upload health
        $this->validateUploadSuccess($request, 'avatar', 'profile photo');

        // Update user basics
        $user->fill($request->only(['name', 'email', 'gender']));

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        // Handle avatar upload if present
        if ($request->hasFile('avatar')) {
            $request->validate([
                'avatar' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,svg,webp', 'max:5120'], // 5MB max
            ]);
            if ($user->avatar) {
                FileStorageService::deleteFromUrl($user->avatar);
            }
            $disk = config('filesystems.default', env('FILESYSTEM_DISK', 'public'));
            $path = $request->file('avatar')->store('avatars', $disk);
            $user->avatar = Storage::disk($disk)->url($path);
        }

        $user->save();

        if ($user->role === 'teacher') {
            $teacherProfile = $user->teacherProfile ?? $user->teacherProfile()->first();
            $uploadedVideoPath = null;
            $uploadedVideoDisk = null;

            // Validate upload health for intro video and certificates
            $this->validateUploadSuccess($request, 'intro_video', 'intro video');
            $this->validateArrayUploadSuccess($request, 'certificate_files', 'certificate file');
            $this->validateArrayUploadSuccess($request, 'ielts_certificates', 'certificate file');

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
                'delete_intro_video' => ['nullable', 'boolean'],
            ]);

            // Handle intro video deletion
            if ($request->boolean('delete_intro_video')) {
                if ($teacherProfile?->intro_video_url) {
                    FileStorageService::deleteFromUrl($teacherProfile->intro_video_url);
                }
                $profileData['intro_video_url'] = null;
            }

            // Handle intro video file upload via instant local buffering
            $localTmpVideoPath = null;
            $targetVideoDisk = null;
            $oldVideoUrl = null;

            if ($request->hasFile('intro_video')) {
                $request->validate([
                    'intro_video' => ['nullable', 'file', 'mimes:mp4,webm,quicktime,mov', 'max:102400'], // 100MB max
                ]);
                $oldVideoUrl = $teacherProfile?->intro_video_url;
                $localTmpVideoPath = $request->file('intro_video')->store('tmp_videos', 'local');
                $targetVideoDisk = config('filesystems.default', env('FILESYSTEM_DISK', 'public'));
            }

            // Validate certificate uploads if present
            if ($request->hasFile('certificate_files') || $request->hasFile('ielts_certificates')) {
                $request->validate([
                    'certificate_files' => ['nullable', 'array'],
                    'certificate_files.*' => ['file', 'mimes:pdf,png,jpg,jpeg,svg,webp,gif', 'max:10240'],
                    'ielts_certificates' => ['nullable', 'array'],
                    'ielts_certificates.*' => ['file', 'mimes:pdf,png,jpg,jpeg,svg,webp,gif', 'max:10240'],
                ]);
            }

            $uploadedFiles = $request->file('certificate_files') ?? $request->file('ielts_certificates') ?? [];
            $certsInput = $request->input('certificates', []);
            $existingCerts = $teacherProfile->certificates ?? [];
            if (is_string($existingCerts)) {
                $existingCerts = json_decode($existingCerts, true) ?? [];
            }
            if (! is_array($existingCerts)) {
                $existingCerts = [];
            }

            $finalCertificates = [];

            if (is_string($certsInput)) {
                $certsList = array_filter(array_map('trim', explode(',', $certsInput)));
                foreach ($certsList as $cName) {
                    $isUrl = str_starts_with($cName, 'http') || str_starts_with($cName, '/storage');
                    $speakingScore = isset($profileData['speaking_band']) ? (string) $profileData['speaking_band'] : '';
                    $overallScore = isset($profileData['overall_level']) ? (string) $profileData['overall_level'] : '';
                    $finalCertificates[] = [
                        'type' => 'ielts',
                        'custom_type_name' => '',
                        'title' => $isUrl ? 'IELTS (Academic / General)' : $cName,
                        'overall' => $overallScore,
                        'listening' => '',
                        'reading' => '',
                        'writing' => '',
                        'speaking' => $speakingScore,
                        'file_url' => $isUrl ? $cName : null,
                        'file_name' => $isUrl ? basename(parse_url($cName, PHP_URL_PATH)) : '',
                        'status' => 'verified',
                    ];
                }
                if (! empty($uploadedFiles)) {
                    foreach ($uploadedFiles as $file) {
                        $disk = env('FILESYSTEM_DISK', 'public');
                        $path = $file->store('certificates', $disk);
                        $finalCertificates[] = [
                            'type' => 'ielts',
                            'custom_type_name' => '',
                            'title' => $file->getClientOriginalName(),
                            'overall' => '',
                            'listening' => '',
                            'reading' => '',
                            'writing' => '',
                            'speaking' => '',
                            'file_url' => Storage::disk($disk)->url($path),
                            'file_name' => $file->getClientOriginalName(),
                            'status' => 'pending',
                        ];
                    }
                }
            } elseif (is_array($certsInput)) {
                foreach ($certsInput as $index => $certData) {
                    if (is_string($certData)) {
                        $isUrl = str_starts_with($certData, 'http') || str_starts_with($certData, '/storage');
                        $finalCertificates[] = [
                            'type' => 'ielts',
                            'custom_type_name' => '',
                            'title' => $isUrl ? 'IELTS (Academic / General)' : $certData,
                            'overall' => '',
                            'listening' => '',
                            'reading' => '',
                            'writing' => '',
                            'speaking' => '',
                            'file_url' => $isUrl ? $certData : null,
                            'file_name' => $isUrl ? basename(parse_url($certData, PHP_URL_PATH)) : '',
                            'status' => 'verified',
                        ];
                    } else {
                        // Find matching existing cert in DB by file_url or title/type if present
                        $matchedExisting = null;
                        foreach ($existingCerts as $ex) {
                            if (is_array($ex)) {
                                $urlMatch = ! empty($certData['file_url']) && ! empty($ex['file_url']) && $certData['file_url'] === $ex['file_url'];
                                $titleMatch = ! empty($certData['title']) && ! empty($ex['title']) && $certData['title'] === $ex['title'];
                                $typeMatch = ! empty($certData['type']) && ! empty($ex['type']) && $certData['type'] === $ex['type'];
                                if ($urlMatch || ($titleMatch && $typeMatch)) {
                                    $matchedExisting = $ex;
                                    break;
                                }
                            }
                        }

                        if ($matchedExisting) {
                            // Locked existing cert: preserve DB type, title, scores, and status
                            $type = $matchedExisting['type'] ?? 'ielts';
                            $customName = $matchedExisting['custom_type_name'] ?? '';
                            $title = $matchedExisting['title'] ?? ($type === 'other' && ! empty($customName) ? $customName : strtoupper($type));
                            $fileUrl = $matchedExisting['file_url'] ?? null;
                            $fileName = $matchedExisting['file_name'] ?? null;
                            $status = $matchedExisting['status'] ?? 'pending';

                            if (isset($uploadedFiles[$index])) {
                                $file = $uploadedFiles[$index];
                                $disk = env('FILESYSTEM_DISK', 'public');
                                $path = $file->store('certificates', $disk);
                                $fileUrl = Storage::disk($disk)->url($path);
                                $fileName = $file->getClientOriginalName();
                            }

                            $finalCertificates[] = [
                                'type' => $type,
                                'custom_type_name' => $customName,
                                'title' => $title,
                                'overall' => (string) ($matchedExisting['overall'] ?? ''),
                                'listening' => (string) ($matchedExisting['listening'] ?? ''),
                                'reading' => (string) ($matchedExisting['reading'] ?? ''),
                                'writing' => (string) ($matchedExisting['writing'] ?? ''),
                                'speaking' => (string) ($matchedExisting['speaking'] ?? ''),
                                'file_url' => $fileUrl,
                                'file_name' => $fileName,
                                'status' => $status,
                            ];
                        } else {
                            // New certificate entry
                            $type = $certData['type'] ?? 'ielts';
                            $customName = $certData['custom_type_name'] ?? '';
                            $title = $certData['title'] ?? ($type === 'other' && ! empty($customName) ? $customName : strtoupper($type));
                            $fileUrl = $certData['file_url'] ?? null;
                            $fileName = $certData['file_name'] ?? null;
                            $status = 'pending';

                            if (isset($uploadedFiles[$index])) {
                                $file = $uploadedFiles[$index];
                                $disk = env('FILESYSTEM_DISK', 'public');
                                $path = $file->store('certificates', $disk);
                                $fileUrl = Storage::disk($disk)->url($path);
                                $fileName = $file->getClientOriginalName();
                            }

                            $finalCertificates[] = [
                                'type' => $type,
                                'custom_type_name' => $customName,
                                'title' => $title,
                                'overall' => (string) ($certData['overall'] ?? ''),
                                'listening' => (string) ($certData['listening'] ?? ''),
                                'reading' => (string) ($certData['reading'] ?? ''),
                                'writing' => (string) ($certData['writing'] ?? ''),
                                'speaking' => (string) ($certData['speaking'] ?? ''),
                                'file_url' => $fileUrl,
                                'file_name' => $fileName,
                                'status' => $status,
                            ];
                        }
                    }
                }
            }

            // Fallback if certificates input was empty but files uploaded
            if (empty($certsInput) && ! empty($uploadedFiles)) {
                foreach ($uploadedFiles as $file) {
                    $disk = env('FILESYSTEM_DISK', 'public');
                    $path = $file->store('certificates', $disk);
                    $finalCertificates[] = [
                        'type' => 'ielts',
                        'custom_type_name' => '',
                        'title' => $file->getClientOriginalName(),
                        'overall' => '',
                        'listening' => '',
                        'reading' => '',
                        'writing' => '',
                        'speaking' => '',
                        'file_url' => Storage::disk($disk)->url($path),
                        'file_name' => $file->getClientOriginalName(),
                        'status' => 'pending',
                    ];
                }
            }

            $profileData['certificates'] = $finalCertificates;

            // Clean up removed certificates from storage
            $newFileUrls = array_filter(array_column($finalCertificates, 'file_url'));
            foreach ($existingCerts as $oldCert) {
                if (is_array($oldCert) && ! empty($oldCert['file_url']) && ! in_array($oldCert['file_url'], $newFileUrls, true)) {
                    FileStorageService::deleteFromUrl($oldCert['file_url']);
                }
            }

            if (! empty($finalCertificates)) {
                $primaryCert = $finalCertificates[0];
                $primarySpeaking = ! empty($primaryCert['speaking']) ? (float) $primaryCert['speaking'] : (! empty($primaryCert['overall']) ? (float) $primaryCert['overall'] : null);
                $certTitle = ! empty($primaryCert['title']) ? $primaryCert['title'] : (! empty($primaryCert['custom_type_name']) ? $primaryCert['custom_type_name'] : strtoupper($primaryCert['type'] ?? 'IELTS'));
                $primaryOverall = ! empty($primaryCert['overall'])
                    ? (str_starts_with($primaryCert['overall'], $certTitle) || str_starts_with($primaryCert['overall'], 'IELTS') ? $primaryCert['overall'] : $certTitle.' '.$primaryCert['overall'])
                    : ($primarySpeaking ? $certTitle.' '.$primarySpeaking : null);

                $profileData['speaking_band'] = $primarySpeaking ?? ($profileData['speaking_band'] ?? null);
                $profileData['overall_level'] = $primaryOverall ?? ($profileData['overall_level'] ?? null);
            } elseif (! isset($certsInput)) {
                // Preserve speaking_band and overall_level if certificates field was omitted
            } else {
                $profileData['speaking_band'] = null;
                $profileData['overall_level'] = null;
            }

            $savedTeacherProfile = $user->teacherProfile()->updateOrCreate(
                ['user_id' => $user->id],
                $profileData
            );

            if ($localTmpVideoPath) {
                TranscodeIntroVideoJob::dispatch(
                    $savedTeacherProfile->id,
                    $localTmpVideoPath,
                    $targetVideoDisk,
                    $oldVideoUrl
                );
            }
        } elseif ($user->role === 'pupil') {
            $pupilProfile = $user->pupilProfile ?? $user->pupilProfile()->first();
            $existingCerts = $pupilProfile->certificates ?? [];
            if (is_string($existingCerts)) {
                $existingCerts = json_decode($existingCerts, true) ?? [];
            }
            if (! is_array($existingCerts)) {
                $existingCerts = [];
            }

            // Validate upload health for pupil certificates
            $this->validateArrayUploadSuccess($request, 'ielts_certificates', 'certificate file');

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
                    $disk = config('filesystems.default', env('FILESYSTEM_DISK', 'public'));
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
                            $disk = config('filesystems.default', env('FILESYSTEM_DISK', 'public'));
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
                    $disk = config('filesystems.default', env('FILESYSTEM_DISK', 'public'));
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

            // Clean up removed pupil certificates from storage
            $newFileUrls = array_filter(array_column($finalCertificates, 'file_url'));
            foreach ($existingCerts as $oldCert) {
                if (is_array($oldCert) && ! empty($oldCert['file_url']) && ! in_array($oldCert['file_url'], $newFileUrls, true)) {
                    FileStorageService::deleteFromUrl($oldCert['file_url']);
                }
            }

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

    /**
     * Validate that an uploaded file has no PHP/server upload errors before processing.
     *
     * @throws ValidationException
     */
    protected function validateUploadSuccess(Request $request, string $field, string $friendlyName = 'file'): void
    {
        $file = $request->file($field);
        if ($file instanceof UploadedFile && ! $file->isValid()) {
            $errorMessage = match ($file->getError()) {
                UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => "The {$friendlyName} exceeds the maximum allowed file size. Please choose a file under 100 MB.",
                UPLOAD_ERR_PARTIAL => "The {$friendlyName} upload was interrupted or timed out. Please check your connection and try again.",
                default => "The {$friendlyName} failed to upload. Please try again.",
            };

            throw ValidationException::withMessages([
                $field => [$errorMessage],
            ]);
        }
    }

    /**
     * Validate that uploaded files in an array have no upload errors.
     *
     * @throws ValidationException
     */
    protected function validateArrayUploadSuccess(Request $request, string $field, string $friendlyName = 'certificate'): void
    {
        $files = $request->file($field);
        if (is_array($files)) {
            foreach ($files as $file) {
                if ($file instanceof UploadedFile && ! $file->isValid()) {
                    $errorMessage = match ($file->getError()) {
                        UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => "One or more {$friendlyName}s exceed the maximum allowed file size (10 MB).",
                        UPLOAD_ERR_PARTIAL => "A {$friendlyName} upload was interrupted or timed out. Please check your connection and try again.",
                        default => "A {$friendlyName} failed to upload. Please try again.",
                    };

                    throw ValidationException::withMessages([
                        $field => [$errorMessage],
                    ]);
                }
            }
        }
    }
}
