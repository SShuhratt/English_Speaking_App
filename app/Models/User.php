<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Passkeys\Contracts\PasskeyUser;
use Laravel\Passkeys\PasskeyAuthenticatable;

class User extends Authenticatable implements PasskeyUser
{
    use HasFactory, HasUuids, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    protected $appends = [
        'name',
        'short_id',
    ];

    protected function shortId(): Attribute
    {
        return Attribute::make(
            get: fn () => 'PUPIL-'.strtoupper(substr($this->id, 0, 8)),
        );
    }

    protected $fillable = [
        'name',
        'email',
        'password',
        'full_name',
        'role',
        'avatar',
        'gender',
        'has_password',

        // Google OAuth
        'google_connected',
        'google_access_token',
        'google_refresh_token',
        'google_token_expires_at',
        'google_scopes',
    ];

    protected $hidden = [
        'password',
        'google_access_token',
        'google_refresh_token',
    ];

    protected $casts = [
        'has_password' => 'boolean',
        'google_connected' => 'boolean',
        'google_scopes' => 'array',
        'google_token_expires_at' => 'datetime',
    ];

    /**
     * Get the display name for the passkey.
     */
    public function getPasskeyDisplayName(): string
    {
        return $this->full_name;
    }

    /**
     * Get or set the user's name.
     */
    protected function name(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->full_name,
            set: fn ($value) => [
                'full_name' => $value,
            ],
        );
    }

    /*
    |--------------------------------------------------------------------------
    | RELATIONS
    |--------------------------------------------------------------------------
    */

    public function teacherProfile()
    {
        return $this->hasOne(TeacherProfile::class);
    }

    public function pupilProfile()
    {
        return $this->hasOne(PupilProfile::class);
    }

    public function availabilities()
    {
        return $this->hasMany(TeacherAvailability::class, 'teacher_id');
    }

    public function teacherAppointments()
    {
        return $this->hasMany(Appointment::class, 'teacher_id');
    }

    public function pupilAppointments()
    {
        return $this->hasMany(Appointment::class, 'pupil_id');
    }

    public function meetings()
    {
        return $this->hasMany(Meeting::class, 'teacher_id');
    }

    public function feedbacks()
    {
        return $this->hasMany(Feedback::class, 'teacher_id');
    }

    public function hasBookedWithTeacher(string $teacherId): bool
    {
        return Appointment::where('pupil_id', $this->id)
            ->where('teacher_id', $teacherId)
            ->whereIn('status', ['pending_teacher_approval', 'awaiting_payment', 'payment_submitted', 'confirmed'])
            ->exists();
    }
}
