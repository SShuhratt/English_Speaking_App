<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TeacherAvailability extends Model
{
    use HasUuids, HasFactory;

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

    public function teacher()
    {
        return $this->belongsTo(
            User::class,
            'teacher_id'
        );
    }
}
