<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        if (session()->has('google_register')) {
            // Generate a secure random password that satisfies all strict validation rules:
            // min length of 12, mixed case, letters, numbers, and symbols.
            $randomPassword = Str::random(24).'aA1!@#$';
            $input['password'] = $input['password'] ?? $randomPassword;
            $input['password_confirmation'] = $input['password_confirmation'] ?? $randomPassword;
            $input['name'] = $input['name'] ?? session('google_register.name');
            $input['email'] = $input['email'] ?? session('google_register.email');
        }

        $rules = array_merge(
            $this->profileRules(),
            [
                'password' => $this->passwordRules(),
            ]
        );

        // Add role-specific validation rules
        $role = $input['role'] ?? null;
        if ($role === 'teacher') {
            $rules['age'] = ['required', 'integer', 'min:1', 'max:120'];
            $rules['phone_number'] = ['required', 'string', 'max:20'];
            $rules['overall_level'] = ['nullable', 'string', 'max:255'];
            $rules['speaking_band'] = ['nullable', 'numeric', 'min:0', 'max:9'];
            $rules['price'] = ['nullable', 'integer', 'min:0'];
            $rules['labels'] = ['nullable', 'array'];
            $rules['labels.*'] = ['string', 'in:mock,freestyle,lessons,business english,practice q&a,job interview prep'];
            $rules['certificate_files'] = ['nullable', 'array'];
            $rules['certificate_files.*'] = ['file', 'mimes:pdf,png,jpg,jpeg,svg,webp,gif', 'max:10240'];
            $rules['ielts_certificates'] = ['nullable', 'array'];
            $rules['ielts_certificates.*'] = ['file', 'mimes:pdf,png,jpg,jpeg,svg,webp,gif', 'max:10240'];
        } elseif ($role === 'pupil') {
            $rules['age'] = ['required', 'integer', 'min:1', 'max:120'];
            $rules['phone_number'] = ['required', 'string', 'max:20'];
            $rules['level'] = ['required', 'string', 'in:beginner,pre-intermediate,upper-intermediate,advanced,ielts_band,cefr_band'];
            $rules['ielts_certificates'] = ['nullable', 'array'];
            $rules['ielts_certificates.*'] = ['file', 'mimes:pdf,png,jpg,jpeg,svg,webp,gif', 'max:10240'];
        }

        Validator::make($input, $rules)->validate();

        return DB::transaction(function () use ($input, $role) {
            $user = User::create([
                'name' => $input['name'],
                'full_name' => $input['name'],
                'email' => $input['email'],
                'password' => Hash::make($input['password']),
                'role' => $role,
                'gender' => $input['gender'] ?? 'prefer_not_to_say',
            ]);

            if (session()->has('google_register')) {
                $googleData = session()->get('google_register');
                $user->google_connected = true;
                $user->google_access_token = $googleData['access_token'] ?? null;
                $user->google_refresh_token = $googleData['refresh_token'] ?? null;
                $user->google_token_expires_at = isset($googleData['expires_in']) ? now()->addSeconds($googleData['expires_in']) : null;
                $user->google_scopes = $googleData['scopes'] ?? null;
                $user->email_verified_at = now();
                $user->save();

                session()->forget('google_register');
            }

            $certificates = null;
            $disk = env('FILESYSTEM_DISK', 'public');

            if ($role === 'teacher') {
                $certsInput = request()->input('certificates');
                if (is_string($certsInput)) {
                    $certsInput = json_decode($certsInput, true) ?? [];
                }
                $uploadedFiles = request()->file('certificate_files') ?? request()->file('ielts_certificates') ?? [];

                $finalCertificates = [];
                if (is_array($certsInput) && !empty($certsInput)) {
                    foreach ($certsInput as $index => $certItem) {
                        $fileUrl = null;
                        $fileName = '';
                        if (isset($uploadedFiles[$index])) {
                            $file = $uploadedFiles[$index];
                            $path = $file->store('certificates', $disk);
                            $fileUrl = Storage::disk($disk)->url($path);
                            $fileName = $file->getClientOriginalName();
                        }

                        $certType = $certItem['type'] ?? 'ielts';
                        $customName = $certItem['custom_type_name'] ?? '';
                        $title = $certType === 'other' && !empty($customName) ? $customName : strtoupper($certType);

                        $finalCertificates[] = [
                            'type' => $certType,
                            'custom_type_name' => $customName,
                            'title' => $title,
                            'overall' => (string) ($certItem['overall'] ?? ''),
                            'listening' => (string) ($certItem['listening'] ?? ''),
                            'reading' => (string) ($certItem['reading'] ?? ''),
                            'writing' => (string) ($certItem['writing'] ?? ''),
                            'speaking' => (string) ($certItem['speaking'] ?? ''),
                            'file_url' => $fileUrl,
                            'file_name' => $fileName,
                            'status' => 'pending',
                        ];
                    }
                } elseif (!empty($uploadedFiles)) {
                    foreach ($uploadedFiles as $file) {
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
                $certificates = $finalCertificates;
            } elseif ($role === 'pupil') {
                if (request()->hasFile('ielts_certificates')) {
                    $certsArray = [];
                    foreach (request()->file('ielts_certificates') as $file) {
                        $path = $file->store('certificates', $disk);
                        $certsArray[] = Storage::disk($disk)->url($path);
                    }
                    $certificates = $certsArray;
                }
            }

            if ($role === 'teacher') {
                $overallLevel = $input['overall_level'] ?? null;
                $speakingBand = $input['speaking_band'] ?? null;

                if (!empty($certificates) && is_array($certificates)) {
                    $firstCert = $certificates[0];
                    if (empty($overallLevel) && !empty($firstCert['overall'])) {
                        $overallLevel = $firstCert['overall'];
                    }
                    if (empty($speakingBand) && !empty($firstCert['speaking'])) {
                        $speakingBand = $firstCert['speaking'];
                    }
                }

                $user->teacherProfile()->create([
                    'age' => $input['age'],
                    'phone_number' => $input['phone_number'],
                    'overall_level' => $overallLevel ?? 'CEFR C1',
                    'speaking_band' => $speakingBand ?? 7.5,
                    'price' => isset($input['price']) && $input['price'] !== '' ? (int) $input['price'] : 0,
                    'labels' => $input['labels'] ?? null,
                    'certificates' => $certificates,
                    'experience_years' => 0.0,
                    'rating_cache' => 0.0,
                ]);
            } elseif ($role === 'pupil') {
                $user->pupilProfile()->create([
                    'age' => $input['age'],
                    'phone_number' => $input['phone_number'],
                    'level' => $input['level'],
                    'certificates' => $certificates,
                ]);
            }

            return $user;
        });
    }
}
