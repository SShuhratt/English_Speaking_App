<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'email',
        'password',
        'full_name',
        'role',

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
        'google_connected' => 'boolean',
        'google_scopes' => 'array',
        'google_token_expires_at' => 'datetime',
    ];

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
}