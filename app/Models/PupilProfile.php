<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PupilProfile extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'age',
        'phone_number',
        'level',
        'certificates',
        'headline',
        'bio',
        'target_overall_band',
        'target_speaking_band',
        'labels',
        'weekly_goal',
        'weekly_goals',
        'karma_score',
        'streak_shields',
        'last_acknowledged_level',
        'country_code',
        'city',
    ];

    protected $casts = [
        'certificates' => 'array',
        'labels' => 'array',
        'weekly_goals' => 'array',
        'weekly_goal' => 'integer',
        'karma_score' => 'integer',
        'streak_shields' => 'integer',
        'last_acknowledged_level' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
