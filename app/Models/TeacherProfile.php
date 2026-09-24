<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class TeacherProfile extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'age',
        'phone_number',
        'certificates',
        'labels',
        'overall_level',
        'speaking_band',
        'experience_years',
        'workplace',
        'rating_cache',
        'headline',
        'bio',
        'intro_video_url',
        'price',
        'is_verified',
    ];

    protected $casts = [
        'certificates' => 'array', // Automatically serializes URLs array to JSON string for Postgres
        'labels' => 'array',
        'rating_cache' => 'float',
        'is_verified' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function feedbacks()
    {
        return $this->hasMany(Feedback::class, 'teacher_id', 'user_id');
    }

    /**
     * Get completed conversation count and total speaking time stats for a teacher.
     *
     * @return array{total_conversations: int, total_minutes: int, total_time_formatted: string}
     */
    public static function getConversationStats(string $teacherId): array
    {
        // 1. Completed/past appointments
        $appointments = Appointment::where('teacher_id', $teacherId)
            ->where(function ($query) {
                $query->where('status', 'completed')
                    ->orWhere(function ($q) {
                        $q->whereIn('status', ['accepted', 'confirmed'])
                            ->where('end_at', '<=', now());
                    })
                    ->orWhere('meeting_started', true);
            })
            ->get(['start_at', 'end_at', 'duration_minutes']);

        $appointmentMinutes = $appointments->sum(function ($apt) {
            if ($apt->duration_minutes && $apt->duration_minutes > 0) {
                return $apt->duration_minutes;
            }
            if ($apt->start_at && $apt->end_at) {
                return max(1, $apt->start_at->diffInMinutes($apt->end_at));
            }

            return 30;
        });

        $appointmentCount = $appointments->count();

        // 2. Standalone conversations (excluding those tied to appointments)
        $conversations = Conversation::where('teacher_id', $teacherId)
            ->whereNull('appointment_id')
            ->whereNotNull('started_at')
            ->get(['started_at', 'ended_at']);

        $conversationMinutes = $conversations->sum(function ($conv) {
            if ($conv->started_at && $conv->ended_at) {
                return max(1, $conv->started_at->diffInMinutes($conv->ended_at));
            }

            return 15;
        });

        $conversationCount = $conversations->count();

        $totalConversations = $appointmentCount + $conversationCount;
        $totalMinutes = (int) ($appointmentMinutes + $conversationMinutes);

        if ($totalMinutes < 60) {
            $formattedTime = "{$totalMinutes}m";
        } else {
            $hours = intdiv($totalMinutes, 60);
            $mins = $totalMinutes % 60;
            $formattedTime = $mins > 0 ? "{$hours}h {$mins}m" : "{$hours}h";
        }

        return [
            'total_conversations' => $totalConversations,
            'total_minutes' => $totalMinutes,
            'total_time_formatted' => $formattedTime,
        ];
    }
}
