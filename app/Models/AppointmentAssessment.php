<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppointmentAssessment extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'appointment_id',
        'teacher_id',
        'pupil_id',
        'fluency_score',
        'lexical_score',
        'grammar_score',
        'pronunciation_score',
        'overall_score',
        'teacher_notes',
    ];

    protected $casts = [
        'fluency_score' => 'float',
        'lexical_score' => 'float',
        'grammar_score' => 'float',
        'pronunciation_score' => 'float',
        'overall_score' => 'float',
    ];

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function pupil(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pupil_id');
    }
}
