<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class TeacherProfile extends Model
{
    use HasUuids;

    protected $fillable = ['user_id', 'age', 'phone_number', 'certificates', 'overall_level', 'speaking_band', 'experience_years', 'workplace', 'rating_cache'];
    
    protected $casts = [
        'certificates' => 'array', // Automatically serializes URLs array to JSON string for Postgres
        'experience_years' => 'float',
        'rating_cache' => 'float'
    ];

    public function user() { return $this->belongsTo(User::class); }
    
    public function feedbacks() { return $this->hasMany(Feedback::class, 'teacher_id', 'user_id'); }
}