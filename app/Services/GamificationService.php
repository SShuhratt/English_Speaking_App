<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Conversation;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class GamificationService
{
    /**
     * Fluency Level Thresholds.
     */
    public const LEVELS = [
        1 => [
            'level' => 1,
            'title_key' => 'gamification.level_1_title',
            'default_title' => 'Hesitant Explorer',
            'badge' => '🐣',
            'min_xp' => 0,
            'max_xp' => 300,
        ],
        2 => [
            'level' => 2,
            'title_key' => 'gamification.level_2_title',
            'default_title' => 'Active Conversationalist',
            'badge' => '💬',
            'min_xp' => 300,
            'max_xp' => 900,
        ],
        3 => [
            'level' => 3,
            'title_key' => 'gamification.level_3_title',
            'default_title' => 'Fearless Speaker',
            'badge' => '🦁',
            'min_xp' => 900,
            'max_xp' => 2100,
        ],
        4 => [
            'level' => 4,
            'title_key' => 'gamification.level_4_title',
            'default_title' => 'Fluent Storyteller',
            'badge' => '🌟',
            'min_xp' => 2100,
            'max_xp' => 4500,
        ],
        5 => [
            'level' => 5,
            'title_key' => 'gamification.level_5_title',
            'default_title' => 'Master Orator',
            'badge' => '👑',
            'min_xp' => 4500,
            'max_xp' => 10000,
        ],
    ];

    /**
     * Calculate Fluency XP, Level, and rank progress for a user.
     *
     * @return array<string, mixed>
     */
    public static function calculateFluency(?User $user): array
    {
        if (! $user) {
            return self::emptyFluencyState();
        }

        $userId = $user->id;

        // 1. Calculate appointment minutes & count
        $appointments = Appointment::where('pupil_id', $userId)
            ->where(function ($q) {
                $q->whereIn('status', ['confirmed', 'completed'])
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

            return 30; // default session duration fallback
        });
        $completedAppointmentsCount = $appointments->count();

        // 2. Calculate peer conversations minutes & count
        $conversations = Conversation::where(function ($q) use ($userId) {
            $q->where('pupil_id', $userId)->orWhere('teacher_id', $userId);
        })
            ->whereNotNull('started_at')
            ->get(['started_at', 'ended_at']);

        $conversationMinutes = $conversations->sum(function ($conv) {
            if ($conv->started_at && $conv->ended_at) {
                return max(1, $conv->started_at->diffInMinutes($conv->ended_at));
            }

            return 5; // default quick peer chat fallback
        });
        $completedConversationsCount = $conversations->count();

        $totalMinutes = (int) ($appointmentMinutes + $conversationMinutes);
        $totalSessions = (int) ($completedAppointmentsCount + $completedConversationsCount);

        // XP formula: 10 XP per minute + 50 XP per completed session
        $totalXp = ($totalMinutes * 10) + ($totalSessions * 50);

        return self::resolveLevelFromXp($totalXp, $totalMinutes, $totalSessions);
    }

    /**
     * Resolve Level, Progress, and Next Goal from Total XP.
     *
     * @return array<string, mixed>
     */
    public static function resolveLevelFromXp(int $totalXp, int $totalMinutes = 0, int $totalSessions = 0): array
    {
        $currentLevelData = self::LEVELS[1];

        foreach (self::LEVELS as $levelNumber => $data) {
            if ($totalXp >= $data['min_xp']) {
                $currentLevelData = $data;
            }
        }

        $level = $currentLevelData['level'];
        $minXp = $currentLevelData['min_xp'];
        $maxXp = $currentLevelData['max_xp'];

        $isMaxLevel = $level >= 5;
        $range = $maxXp - $minXp;
        $xpInCurrentLevel = max(0, $totalXp - $minXp);
        $progressPercent = $isMaxLevel ? 100 : min(100, (int) round(($xpInCurrentLevel / max(1, $range)) * 100));
        $xpToNextLevel = $isMaxLevel ? 0 : max(0, $maxXp - $totalXp);

        return [
            'level' => $level,
            'title_key' => $currentLevelData['title_key'],
            'default_title' => $currentLevelData['default_title'],
            'badge' => $currentLevelData['badge'],
            'total_xp' => $totalXp,
            'current_level_xp' => $xpInCurrentLevel,
            'next_level_target_xp' => $range,
            'progress_percent' => $progressPercent,
            'xp_to_next_level' => $xpToNextLevel,
            'is_max_level' => $isMaxLevel,
            'total_minutes' => $totalMinutes,
            'total_sessions' => $totalSessions,
        ];
    }

    /**
     * Calculate Streak Info with Dynamic Flame Tiers & Shield.
     *
     * @return array<string, mixed>
     */
    public static function getStreakInfo(?User $user): array
    {
        $streak = StreakService::calculateForUser($user);

        if ($streak <= 0) {
            $tier = 'dormant';
            $tierTitleKey = 'gamification.streak_dormant';
            $defaultTitle = 'Resting Spark';
            $flameColor = '#94A3B8'; // slate
            $milestoneTarget = 3;
            $daysToMilestone = 3;
        } elseif ($streak < 7) {
            $tier = 'spark';
            $tierTitleKey = 'gamification.streak_spark';
            $defaultTitle = 'Ember Spark';
            $flameColor = '#F59E0B'; // amber/orange
            $milestoneTarget = 7;
            $daysToMilestone = 7 - $streak;
        } elseif ($streak < 14) {
            $tier = 'blaze';
            $tierTitleKey = 'gamification.streak_blaze';
            $defaultTitle = 'Rising Blaze';
            $flameColor = '#EA580C'; // vibrant orange
            $milestoneTarget = 14;
            $daysToMilestone = 14 - $streak;
        } elseif ($streak < 30) {
            $tier = 'thunder';
            $tierTitleKey = 'gamification.streak_thunder';
            $defaultTitle = 'Thunder Flame';
            $flameColor = '#8B5CF6'; // electric purple
            $milestoneTarget = 30;
            $daysToMilestone = 30 - $streak;
        } else {
            $tier = 'diamond';
            $tierTitleKey = 'gamification.streak_diamond';
            $defaultTitle = 'Diamond Flame';
            $flameColor = '#06B6D4'; // cyan diamond
            $milestoneTarget = $streak + 10;
            $daysToMilestone = 10;
        }

        return [
            'streak_count' => $streak,
            'tier' => $tier,
            'tier_title_key' => $tierTitleKey,
            'default_title' => $defaultTitle,
            'flame_color' => $flameColor,
            'milestone_target' => $milestoneTarget,
            'days_to_milestone' => $daysToMilestone,
            'shield_active' => true,
            'shield_message_key' => 'gamification.streak_shield_active',
            'default_shield_message' => 'Streak Shield Active — 1 missed day protected',
        ];
    }

    /**
     * Get Weekly Top Speakers Leaderboard.
     *
     * @return array<string, mixed>
     */
    public static function getWeeklyLeaderboard(?User $currentUser): array
    {
        $startOfWeek = Carbon::now()->startOfWeek();
        $endOfWeek = Carbon::now()->endOfWeek();
        $cacheKey = 'weekly_top_speakers_v1_'.$startOfWeek->toDateString();

        $leaderboardData = Cache::remember($cacheKey, 300, function () use ($startOfWeek, $endOfWeek) {
            // Aggregate minutes per student in appointments this week
            $weeklyAppointments = Appointment::whereBetween('start_at', [$startOfWeek, $endOfWeek])
                ->where(function ($q) {
                    $q->whereIn('status', ['confirmed', 'completed'])
                        ->orWhere('meeting_started', true);
                })
                ->get(['pupil_id', 'start_at', 'end_at', 'duration_minutes']);

            $userMinutesMap = [];

            foreach ($weeklyAppointments as $apt) {
                if (! $apt->pupil_id) {
                    continue;
                }
                $minutes = 30;
                if ($apt->duration_minutes && $apt->duration_minutes > 0) {
                    $minutes = $apt->duration_minutes;
                } elseif ($apt->start_at && $apt->end_at) {
                    $minutes = max(1, $apt->start_at->diffInMinutes($apt->end_at));
                }
                $userMinutesMap[$apt->pupil_id] = ($userMinutesMap[$apt->pupil_id] ?? 0) + $minutes;
            }

            // Aggregate peer conversations this week
            $weeklyConversations = Conversation::whereBetween('started_at', [$startOfWeek, $endOfWeek])
                ->whereNotNull('started_at')
                ->get(['pupil_id', 'started_at', 'ended_at']);

            foreach ($weeklyConversations as $conv) {
                if (! $conv->pupil_id) {
                    continue;
                }
                $minutes = 5;
                if ($conv->started_at && $conv->ended_at) {
                    $minutes = max(1, $conv->started_at->diffInMinutes($conv->ended_at));
                }
                $userMinutesMap[$conv->pupil_id] = ($userMinutesMap[$conv->pupil_id] ?? 0) + $minutes;
            }

            if (empty($userMinutesMap)) {
                return [];
            }

            arsort($userMinutesMap);

            $userIds = array_keys($userMinutesMap);
            $users = User::whereIn('id', $userIds)->get()->keyBy('id');

            $rankedList = [];
            $rank = 1;

            foreach ($userMinutesMap as $uid => $minutes) {
                $u = $users->get($uid);
                if (! $u) {
                    continue;
                }

                $fluency = self::calculateFluency($u);

                $rankedList[] = [
                    'rank' => $rank++,
                    'user_id' => $u->id,
                    'full_name' => $u->full_name ?: $u->name,
                    'avatar' => $u->avatar,
                    'minutes_spoken' => (int) $minutes,
                    'level' => $fluency['level'],
                    'badge' => $fluency['badge'],
                    'level_title_key' => $fluency['title_key'],
                ];
            }

            return $rankedList;
        });

        // Split into Top 5 and current user's standing
        $topFive = array_slice($leaderboardData, 0, 5);

        $userStanding = null;
        if ($currentUser) {
            $foundIndex = null;
            foreach ($leaderboardData as $idx => $entry) {
                if ($entry['user_id'] === $currentUser->id) {
                    $foundIndex = $idx;
                    break;
                }
            }

            if ($foundIndex !== null) {
                $userStanding = $leaderboardData[$foundIndex];
                $userStanding['is_in_top_five'] = $foundIndex < 5;
            } else {
                $userStanding = [
                    'rank' => count($leaderboardData) + 1,
                    'user_id' => $currentUser->id,
                    'full_name' => $currentUser->full_name ?: $currentUser->name,
                    'avatar' => $currentUser->avatar,
                    'minutes_spoken' => 0,
                    'level' => 1,
                    'badge' => '🐣',
                    'level_title_key' => 'gamification.level_1_title',
                    'is_in_top_five' => false,
                ];
            }
        }

        return [
            'top_speakers' => $topFive,
            'user_standing' => $userStanding,
            'week_label' => Carbon::now()->startOfWeek()->format('M d').' – '.Carbon::now()->endOfWeek()->format('M d'),
            'total_active_speakers' => count($leaderboardData),
        ];
    }

    /**
     * Get Daily Speaking Spark question / prompt.
     *
     * @return array<string, mixed>
     */
    public static function getDailySpark(): array
    {
        $prompts = [
            [
                'question_key' => 'gamification.spark_q1',
                'default_question' => 'If you could travel anywhere in the world tomorrow with all expenses paid, where would you go and why?',
                'category_key' => 'gamification.spark_cat_travel',
                'default_category' => 'Travel & Adventure',
                'tip_key' => 'gamification.spark_tip1',
                'default_tip' => 'Try describing the sights, smells, and 3 activities you would do there.',
            ],
            [
                'question_key' => 'gamification.spark_q2',
                'default_question' => 'What is one personal goal that you are excited to achieve before the end of this year?',
                'category_key' => 'gamification.spark_cat_ambition',
                'default_category' => 'Ambition & Dreams',
                'tip_key' => 'gamification.spark_tip2',
                'default_tip' => 'Use future continuous or perfect tense: "By December, I will have..."',
            ],
            [
                'question_key' => 'gamification.spark_q3',
                'default_question' => 'Would you rather live without smartphones for a month, or without the internet entirely for two weeks?',
                'category_key' => 'gamification.spark_cat_debate',
                'default_category' => 'Debate & Perspectives',
                'tip_key' => 'gamification.spark_tip3',
                'default_tip' => 'Defend your choice with 2 pros and 1 trade-off you are willing to accept.',
            ],
            [
                'question_key' => 'gamification.spark_q4',
                'default_question' => 'What is the most memorable advice anyone has ever given you, and did it change how you make decisions?',
                'category_key' => 'gamification.spark_cat_life',
                'default_category' => 'Life & Wisdom',
                'tip_key' => 'gamification.spark_tip4',
                'default_tip' => 'Structure your answer: The context, the exact words, and the lasting impact.',
            ],
            [
                'question_key' => 'gamification.spark_q5',
                'default_question' => 'How do you think artificial intelligence will change education and learning languages over the next decade?',
                'category_key' => 'gamification.spark_cat_tech',
                'default_category' => 'Tech & Future',
                'tip_key' => 'gamification.spark_tip5',
                'default_tip' => 'Contrast the benefits for learners with the irreplaceable role of human teachers.',
            ],
            [
                'question_key' => 'gamification.spark_q6',
                'default_question' => 'What is a traditional dish or custom from your hometown that every visitor must experience?',
                'category_key' => 'gamification.spark_cat_culture',
                'default_category' => 'Culture & Heritage',
                'tip_key' => 'gamification.spark_tip6',
                'default_tip' => 'Use sensory adjectives (crispy, aromatic, heartwarming, mouth-watering).',
            ],
            [
                'question_key' => 'gamification.spark_q7',
                'default_question' => 'If you could have a 30-minute English conversation with any historical figure, who would you choose and what would you ask?',
                'category_key' => 'gamification.spark_cat_curiosity',
                'default_category' => 'Curiosity & History',
                'tip_key' => 'gamification.spark_tip7',
                'default_tip' => 'Prepare 2 thought-provoking questions you would bring to the table.',
            ],
        ];

        $dayOfYear = Carbon::now()->dayOfYear;
        $selectedPrompt = $prompts[$dayOfYear % count($prompts)];

        return $selectedPrompt;
    }

    /**
     * Fallback for empty/guest fluency state.
     *
     * @return array<string, mixed>
     */
    private static function emptyFluencyState(): array
    {
        return [
            'level' => 1,
            'title_key' => 'gamification.level_1_title',
            'default_title' => 'Hesitant Explorer',
            'badge' => '🐣',
            'total_xp' => 0,
            'current_level_xp' => 0,
            'next_level_target_xp' => 300,
            'progress_percent' => 0,
            'xp_to_next_level' => 300,
            'is_max_level' => false,
            'total_minutes' => 0,
            'total_sessions' => 0,
        ];
    }
}
