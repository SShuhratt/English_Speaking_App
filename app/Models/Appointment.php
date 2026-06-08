<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    use HasUuids;

    protected $fillable = [
        'teacher_id',
        'pupil_id',
        'start_at',
        'end_at',
        'status',
        'notes',
        'google_event_id',
        'google_meet_link',
        'provider',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
    ];

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function pupil()
    {
        return $this->belongsTo(User::class, 'pupil_id');
    }
}
