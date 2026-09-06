<?php

namespace App\Models;

use App\Support\PlatformTime;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TeacherAvailability extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'teacher_id',
        'type',

        'day_of_week',
        'start_time',
        'end_time',

        'start_at',
        'end_at',

        'slot_duration',
        'timezone',

        'is_active',
        'note',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',

        'is_active' => 'boolean',
    ];

    protected function startAt(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value ? Carbon::parse($value, 'UTC') : null,
            set: fn ($value) => $value ? PlatformTime::toUtc($value) : null,
        );
    }

    protected function endAt(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value ? Carbon::parse($value, 'UTC') : null,
            set: fn ($value) => $value ? PlatformTime::toUtc($value) : null,
        );
    }

    public function teacher()
    {
        return $this->belongsTo(
            User::class,
            'teacher_id'
        );
    }
}
