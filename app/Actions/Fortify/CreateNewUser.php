<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
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
            $randomPassword = \Illuminate\Support\Str::random(32);
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
            $rules['overall_level'] = ['required', 'string', 'max:255'];
            $rules['speaking_band'] = ['required', 'numeric', 'min:0', 'max:9'];
            $rules['labels'] = ['nullable', 'array'];
            $rules['labels.*'] = ['string', 'in:mock,freestyle,lessons,business english,practice q&a'];
            $rules['ielts_certificates'] = ['nullable', 'array'];
            $rules['ielts_certificates.*'] = ['file', 'mimes:pdf,png,jpg,jpeg', 'max:10240'];
        } elseif ($role === 'pupil') {
            $rules['age'] = ['required', 'integer', 'min:1', 'max:120'];
            $rules['phone_number'] = ['required', 'string', 'max:20'];
            $rules['level'] = ['required', 'string', 'in:beginner,pre-intermediate,upper-intermediate,advanced,ielts_band,cefr_band'];
            $rules['ielts_certificates'] = ['nullable', 'array'];
            $rules['ielts_certificates.*'] = ['file', 'mimes:pdf,png,jpg,jpeg', 'max:10240'];
        }

        Validator::make($input, $rules)->validate();

        return DB::transaction(function () use ($input, $role) {
            $user = User::create([
                'full_name' => $input['name'],
                'email' => $input['email'],
                'password' => Hash::make($input['password']),
                'role' => $role,
            ]);

            if (session()->has('google_register')) {
                $user->email_verified_at = now();
                $user->google_connected = true;
                $user->google_access_token = session('google_register.google_token');
                $user->google_refresh_token = session('google_register.google_refresh_token');
                $user->google_token_expires_at = now()->addSeconds(session('google_register.google_expires_in', 3600));
                $user->google_scopes = ['https://www.googleapis.com/auth/calendar.events'];
                $user->save();

                session()->forget('google_register');
            }

            $certificates = null;
            if (request()->hasFile('ielts_certificates')) {
                $disk = env('FILESYSTEM_DISK', 'public');
                $certsArray = [];
                foreach (request()->file('ielts_certificates') as $file) {
                    $path = $file->store('certificates', $disk);
                    $certsArray[] = Storage::disk($disk)->url($path);
                }
                $certificates = array_values(array_filter($certsArray, function ($cert) {
                    $cert = trim($cert);
                    if (empty($cert)) {
                        return false;
                    }
                    if (str_starts_with($cert, 'http') || str_starts_with($cert, '/storage')) {
                        $path = parse_url($cert, PHP_URL_PATH);
                        if (empty($path) || $path === '/' || str_ends_with($path, '/')) {
                            return false;
                        }
                        $segments = explode('/', trim($path, '/'));
                        if (count($segments) <= 1 && (empty($segments[0]) || $segments[0] === 'edtech-media-storage-dev')) {
                            return false;
                        }
                    }
                    return true;
                }));
            }

            if ($role === 'teacher') {
                $user->teacherProfile()->create([
                    'age' => $input['age'],
                    'phone_number' => $input['phone_number'],
                    'overall_level' => $input['overall_level'],
                    'speaking_band' => $input['speaking_band'],
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
