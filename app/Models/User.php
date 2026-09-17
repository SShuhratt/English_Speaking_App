<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Cache;
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
        'phone_number',
        'password',
        'full_name',
        'role',
        'avatar',
        'gender',
        'has_password',
        'telegram_chat_id',
        'telegram_username',

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
     * Route notification for Telegram channel.
     */
    public function routeNotificationForTelegram($notification = null): ?string
    {
        return $this->telegram_chat_id;
    }

    /**
     * Route notification for SMS channel.
     */
    public function routeNotificationForSms($notification = null): ?string
    {
        return $this->phone_number
            ?: $this->teacherProfile?->phone_number
            ?: $this->pupilProfile?->phone_number;
    }

    /**
     * Generate a 6-digit pairing code for Telegram linking (valid for 15 minutes).
     */
    public function generateTelegramPairingCode(): string
    {
        // Check if user already has an active pairing code
        $existingCode = Cache::get("user_telegram_code:{$this->id}");
        if ($existingCode) {
            return (string) $existingCode;
        }

        $code = (string) random_int(100000, 999999);
        Cache::put("telegram_pairing:{$code}", $this->id, now()->addMinutes(15));
        Cache::put("user_telegram_code:{$this->id}", $code, now()->addMinutes(15));

        return $code;
    }

    /**
     * Unlink Telegram from this account.
     */
    public function unlinkTelegram(): void
    {
        $this->update([
            'telegram_chat_id' => null,
            'telegram_username' => null,
        ]);
    }

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

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
}
