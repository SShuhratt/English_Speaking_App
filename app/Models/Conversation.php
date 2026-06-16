<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'pupil_id',
        'teacher_id',
        'recording_url',
        'started_at',
        'ended_at',
        'appointment_id',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    public function pupil()
    {
        return $this->belongsTo(User::class, 'pupil_id');
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function feedbacks()
    {
        return $this->hasMany(Feedback::class);
    }
}
