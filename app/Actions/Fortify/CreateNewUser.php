<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
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
        $rules = array_merge(
            $this->profileRules(),
            [
                'password' => $this->passwordRules(),
            ]
        );

        // Add role-specific validation rules
        $role = $input['role'] ?? null;
        if ($role === 'teacher') {
            $rules['age'] = ['required', 'integer', 'min:18', 'max:100'];
            $rules['phone_number'] = ['required', 'string', 'max:20'];
            $rules['overall_level'] = ['required', 'string', 'max:255'];
            $rules['speaking_band'] = ['required', 'numeric', 'min:0', 'max:9'];
        } elseif ($role === 'pupil') {
            $rules['age'] = ['required', 'integer', 'min:1', 'max:100'];
            $rules['phone_number'] = ['required', 'string', 'max:20'];
            $rules['level'] = ['required', 'string', 'in:beginner,pre-intermediate,upper-intermediate,advanced,ielts_band,cefr_band'];
        }

        Validator::make($input, $rules)->validate();

        return DB::transaction(function () use ($input, $role) {
            $user = User::create([
                'full_name' => $input['name'],
                'email' => $input['email'],
                'password' => Hash::make($input['password']),
                'role' => $role,
            ]);

            if ($role === 'teacher') {
                $user->teacherProfile()->create([
                    'age' => $input['age'],
                    'phone_number' => $input['phone_number'],
                    'overall_level' => $input['overall_level'],
                    'speaking_band' => $input['speaking_band'],
                    'experience_years' => 0.0,
                    'rating_cache' => 0.0,
                ]);
            } elseif ($role === 'pupil') {
                $user->pupilProfile()->create([
                    'age' => $input['age'],
                    'phone_number' => $input['phone_number'],
                    'level' => $input['level'],
                ]);
            }

            return $user;
        });
    }
}
