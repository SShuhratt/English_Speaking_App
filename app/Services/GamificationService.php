<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\AppointmentAssessment;
use App\Models\Conversation;
use App\Models\ConversationEndorsement;
use App\Models\PupilProfile;
use App\Models\ReferralRecord;
use App\Models\User;
use App\Models\UserDiscountVoucher;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GamificationService
{
    /**
     * Country catalog with flags for the Speaking Passport.
     */
    public const COUNTRIES = [
        'UZ' => ['name_key' => 'countries.uz', 'default_name' => 'Uzbekistan', 'flag' => '🇺🇿'],
        'KZ' => ['name_key' => 'countries.kz', 'default_name' => 'Kazakhstan', 'flag' => '🇰🇿'],
        'KG' => ['name_key' => 'countries.kg', 'default_name' => 'Kyrgyzstan', 'flag' => '🇰🇬'],
        'TJ' => ['name_key' => 'countries.tj', 'default_name' => 'Tajikistan', 'flag' => '🇹🇯'],
        'TM' => ['name_key' => 'countries.tm', 'default_name' => 'Turkmenistan', 'flag' => '🇹🇲'],
        'TR' => ['name_key' => 'countries.tr', 'default_name' => 'Turkey', 'flag' => '🇹🇷'],
        'GB' => ['name_key' => 'countries.gb', 'default_name' => 'United Kingdom', 'flag' => '🇬🇧'],
        'US' => ['name_key' => 'countries.us', 'default_name' => 'United States', 'flag' => '🇺🇸'],
        'CA' => ['name_key' => 'countries.ca', 'default_name' => 'Canada', 'flag' => '🇨🇦'],
        'AU' => ['name_key' => 'countries.au', 'default_name' => 'Australia', 'flag' => '🇦🇺'],
        'DE' => ['name_key' => 'countries.de', 'default_name' => 'Germany', 'flag' => '🇩🇪'],
        'FR' => ['name_key' => 'countries.fr', 'default_name' => 'France', 'flag' => '🇫🇷'],
        'KR' => ['name_key' => 'countries.kr', 'default_name' => 'South Korea', 'flag' => '🇰🇷'],
        'JP' => ['name_key' => 'countries.jp', 'default_name' => 'Japan', 'flag' => '🇯🇵'],
        'CN' => ['name_key' => 'countries.cn', 'default_name' => 'China', 'flag' => '🇨🇳'],
        'IN' => ['name_key' => 'countries.in', 'default_name' => 'India', 'flag' => '🇮🇳'],
        'AE' => ['name_key' => 'countries.ae', 'default_name' => 'United Arab Emirates', 'flag' => '🇦🇪'],
        'SA' => ['name_key' => 'countries.sa', 'default_name' => 'Saudi Arabia', 'flag' => '🇸🇦'],
        'RU' => ['name_key' => 'countries.ru', 'default_name' => 'Russian Federation', 'flag' => '🇷🇺'],
        'GL' => ['name_key' => 'countries.gl', 'default_name' => 'Global Citizen', 'flag' => '🌐'],
    ];

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

        // Balanced talk bonus count (+20 XP each)
        $balancedBonusCount = ConversationEndorsement::where(function ($q) use ($userId) {
            $q->where('giver_id', $userId)->orWhere('receiver_id', $userId);
        })->where('balanced_bonus_awarded', true)->count();

        // Challenge session bonus count (+25 XP each)
        $challengeBonusCount = ConversationEndorsement::where(function ($q) use ($userId) {
            $q->where('giver_id', $userId)->orWhere('receiver_id', $userId);
        })->where('challenge_bonus_awarded', true)->count();

        // Referral reward bonus count (+100 XP each)
        $referralBonusCount = ReferralRecord::where(function ($q) use ($userId) {
            $q->where('referrer_id', $userId)->orWhere('referred_user_id', $userId);
        })->where('reward_granted', true)->count();

        // XP formula: 10 XP per minute + 50 XP per completed session + 20 XP per balanced dialogue bonus + 25 XP per challenge + 100 XP per referral
        $totalXp = ($totalMinutes * 10)
            + ($totalSessions * 50)
            + ($balancedBonusCount * 20)
            + ($challengeBonusCount * 25)
            + ($referralBonusCount * 100);

        $spentXp = (int) (PupilProfile::where('user_id', $userId)->value('spent_xp') ?? ($user->pupilProfile?->spent_xp ?? 0));

        return self::resolveLevelFromXp($totalXp, $totalMinutes, $totalSessions, $spentXp);
    }

    /**
     * Resolve Level, Progress, and Next Goal from Total XP.
     *
     * @return array<string, mixed>
     */
    public static function resolveLevelFromXp(int $totalXp, int $totalMinutes = 0, int $totalSessions = 0, int $spentXp = 0): array
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
        $availableXp = max(0, $totalXp - $spentXp);

        return [
            'level' => $level,
            'title_key' => $currentLevelData['title_key'],
            'default_title' => $currentLevelData['default_title'],
            'badge' => $currentLevelData['badge'],
            'total_xp' => $totalXp,
            'spent_xp' => $spentXp,
            'available_xp' => $availableXp,
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
     * Calculate Weekly Speaking Momentum (sessions vs. weekly goal, streak shields, and karma).
     *
     * @return array<string, mixed>
     */
    public static function getWeeklyMomentum(?User $user): array
    {
        if (! $user) {
            return [
                'weekly_target' => 3,
                'sessions_this_week' => 0,
                'progress_percent' => 0,
                'target_met' => false,
                'streak_shields' => 1,
                'karma_score' => 100,
                'karma_tier' => 'trusted',
                'momentum_weeks' => 0,
            ];
        }

        $userId = $user->id;
        $startOfWeek = Carbon::now()->startOfWeek();
        $endOfWeek = Carbon::now()->endOfWeek();

        // 1. Appointments completed this week
        $appointmentSessions = Appointment::where('pupil_id', $userId)
            ->whereBetween('start_at', [$startOfWeek, $endOfWeek])
            ->where(function ($q) {
                $q->whereIn('status', ['confirmed', 'completed'])
                    ->orWhere('meeting_started', true);
            })
            ->count();

        // 2. Peer conversations this week
        $conversationSessions = Conversation::where(function ($q) use ($userId) {
            $q->where('pupil_id', $userId)->orWhere('teacher_id', $userId);
        })
            ->whereBetween('started_at', [$startOfWeek, $endOfWeek])
            ->count();

        $sessionsThisWeek = $appointmentSessions + $conversationSessions;
        $profile = $user->pupilProfile;
        $weeklyTarget = (int) ($profile?->weekly_goal ?? 3);
        if ($weeklyTarget <= 0) {
            $weeklyTarget = 3;
        }

        $targetMet = $sessionsThisWeek >= $weeklyTarget;
        $progressPercent = min(100, (int) round(($sessionsThisWeek / $weeklyTarget) * 100));

        $karmaScore = (int) ($profile?->karma_score ?? 100);
        $streakShields = (int) ($profile?->streak_shields ?? 1);

        if ($karmaScore >= 90) {
            $karmaTier = 'trusted';
        } elseif ($karmaScore >= 70) {
            $karmaTier = 'active';
        } else {
            $karmaTier = 'developing';
        }

        // Calculate consecutive active momentum weeks
        $momentumWeeks = 0;
        $checkDate = Carbon::now()->startOfWeek()->subWeek();
        for ($i = 0; $i < 12; $i++) {
            $wStart = $checkDate->copy()->startOfWeek();
            $wEnd = $checkDate->copy()->endOfWeek();

            $wApts = Appointment::where('pupil_id', $userId)
                ->whereBetween('start_at', [$wStart, $wEnd])
                ->where(function ($q) {
                    $q->whereIn('status', ['confirmed', 'completed'])
                        ->orWhere('meeting_started', true);
                })
                ->count();

            $wConvs = Conversation::where(function ($q) use ($userId) {
                $q->where('pupil_id', $userId)->orWhere('teacher_id', $userId);
            })
                ->whereBetween('started_at', [$wStart, $wEnd])
                ->count();

            if (($wApts + $wConvs) >= $weeklyTarget) {
                $momentumWeeks++;
                $checkDate->subWeek();
            } else {
                break;
            }
        }

        if ($targetMet) {
            $momentumWeeks++;
        }

        return [
            'weekly_target' => $weeklyTarget,
            'sessions_this_week' => $sessionsThisWeek,
            'progress_percent' => $progressPercent,
            'target_met' => $targetMet,
            'streak_shields' => $streakShields,
            'karma_score' => $karmaScore,
            'karma_tier' => $karmaTier,
            'momentum_weeks' => $momentumWeeks,
        ];
    }

    /**
     * Get Speaking Passport stamps and global connector progress for a user.
     *
     * @return array<string, mixed>
     */
    public static function getSpeakingPassport(?User $user): array
    {
        if (! $user) {
            return [
                'unique_partners_count' => 0,
                'countries_count' => 0,
                'passport_rank_key' => 'gamification.passport_rank_1',
                'passport_rank_default' => 'Novice Voyager 🧭',
                'stamps' => [],
            ];
        }

        $userId = $user->id;

        // 1. Gather partner IDs from peer conversations
        $peerPartnerIds = Conversation::where('pupil_id', $userId)
            ->whereNotNull('teacher_id')
            ->pluck('teacher_id')
            ->concat(
                Conversation::where('teacher_id', $userId)
                    ->whereNotNull('pupil_id')
                    ->pluck('pupil_id')
            );

        // 2. Gather partner IDs from teacher appointments
        $teacherPartnerIds = Appointment::where('pupil_id', $userId)
            ->whereIn('status', ['confirmed', 'completed'])
            ->whereNotNull('teacher_id')
            ->pluck('teacher_id');

        $uniquePartnerIds = $peerPartnerIds->concat($teacherPartnerIds)->filter()->unique()->values();

        // 3. Look up partner profiles to aggregate countries
        $partners = User::with(['pupilProfile', 'teacherProfile'])->whereIn('id', $uniquePartnerIds)->get();

        $countryCounts = [];
        foreach ($partners as $partner) {
            $code = $partner->pupilProfile?->country_code
                ?? $partner->teacherProfile?->country_code
                ?? 'UZ';
            $code = strtoupper(trim($code));
            if (! isset(self::COUNTRIES[$code])) {
                $code = 'GL';
            }
            $countryCounts[$code] = ($countryCounts[$code] ?? 0) + 1;
        }

        $stamps = [];
        foreach ($countryCounts as $code => $count) {
            $info = self::COUNTRIES[$code];
            $stamps[] = [
                'country_code' => $code,
                'name_key' => $info['name_key'],
                'default_name' => $info['default_name'],
                'flag' => $info['flag'],
                'partner_count' => $count,
            ];
        }

        // Sort stamps descending by partner count
        usort($stamps, fn ($a, $b) => $b['partner_count'] <=> $a['partner_count']);

        $uniquePartnersCount = $uniquePartnerIds->count();
        $countriesCount = count($stamps);

        // Calculate Passport Rank
        if ($uniquePartnersCount >= 10 || $countriesCount >= 5) {
            $rankKey = 'gamification.passport_rank_4';
            $rankDefault = 'Citizen of the World 🌍';
        } elseif ($uniquePartnersCount >= 5 || $countriesCount >= 3) {
            $rankKey = 'gamification.passport_rank_3';
            $rankDefault = 'Continental Connector ✈️';
        } elseif ($uniquePartnersCount >= 2 || $countriesCount >= 2) {
            $rankKey = 'gamification.passport_rank_2';
            $rankDefault = 'Regional Explorer 🗺️';
        } else {
            $rankKey = 'gamification.passport_rank_1';
            $rankDefault = 'Novice Voyager 🧭';
        }

        return [
            'unique_partners_count' => $uniquePartnersCount,
            'countries_count' => $countriesCount,
            'passport_rank_key' => $rankKey,
            'passport_rank_default' => $rankDefault,
            'stamps' => $stamps,
        ];
    }

    /**
     * Get Milestone Badges with unlocked status and criteria progress.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function getMilestoneBadges(?User $user): array
    {
        if (! $user) {
            return [];
        }

        $fluency = self::calculateFluency($user);
        $momentum = self::getWeeklyMomentum($user);
        $passport = self::getSpeakingPassport($user);

        $balancedCount = ConversationEndorsement::where(function ($q) use ($user) {
            $q->where('giver_id', $user->id)->orWhere('receiver_id', $user->id);
        })->where('balanced_bonus_awarded', true)->count();

        $totalSessions = (int) ($fluency['total_sessions'] ?? 0);
        $totalMinutes = (int) ($fluency['total_minutes'] ?? 0);
        $karmaScore = (int) ($user->pupilProfile?->karma_score ?? 100);
        $uniquePartners = (int) ($passport['unique_partners_count'] ?? 0);

        return [
            [
                'id' => 'first_spark',
                'name_key' => 'gamification.badge_first_spark',
                'default_name' => 'First Spark',
                'desc_key' => 'gamification.badge_first_spark_desc',
                'default_desc' => 'Completed your first live English speaking session.',
                'icon' => '🚀',
                'unlocked' => $totalSessions >= 1,
                'progress_percent' => min(100, $totalSessions >= 1 ? 100 : 0),
            ],
            [
                'id' => 'habit_builder',
                'name_key' => 'gamification.badge_habit_builder',
                'default_name' => 'Habit Builder',
                'desc_key' => 'gamification.badge_habit_builder_desc',
                'default_desc' => 'Achieved your weekly speaking goal (3+ sessions).',
                'icon' => '🎯',
                'unlocked' => $momentum['target_met'] || $momentum['momentum_weeks'] >= 1,
                'progress_percent' => (int) ($momentum['progress_percent'] ?? 0),
            ],
            [
                'id' => 'balanced_voice',
                'name_key' => 'gamification.badge_balanced_voice',
                'default_name' => 'Balanced Voice',
                'desc_key' => 'gamification.badge_balanced_voice_desc',
                'default_desc' => 'Maintained a healthy 40-60% talk-time balance in a live dialogue.',
                'icon' => '⚖️',
                'unlocked' => $balancedCount >= 1,
                'progress_percent' => min(100, $balancedCount >= 1 ? 100 : 0),
            ],
            [
                'id' => 'reliable_anchor',
                'name_key' => 'gamification.badge_reliable_anchor',
                'default_name' => 'Reliable Anchor',
                'desc_key' => 'gamification.badge_reliable_anchor_desc',
                'default_desc' => 'Maintained an exemplary 95+ Karma reliability rating.',
                'icon' => '🛡️',
                'unlocked' => $karmaScore >= 95 && $totalSessions >= 3,
                'progress_percent' => min(100, (int) round(($karmaScore / 95) * 100)),
            ],
            [
                'id' => 'global_explorer',
                'name_key' => 'gamification.badge_global_explorer',
                'default_name' => 'World Explorer',
                'desc_key' => 'gamification.badge_global_explorer_desc',
                'default_desc' => 'Connected and conversed with 3 or more unique speaking partners.',
                'icon' => '🌍',
                'unlocked' => $uniquePartners >= 3,
                'progress_percent' => min(100, (int) round(($uniquePartners / 3) * 100)),
            ],
            [
                'id' => 'century_club',
                'name_key' => 'gamification.badge_century_club',
                'default_name' => 'Century Club',
                'desc_key' => 'gamification.badge_century_club_desc',
                'default_desc' => 'Spoken for 100+ total minutes in live conversation.',
                'icon' => '💯',
                'unlocked' => $totalMinutes >= 100,
                'progress_percent' => min(100, (int) round(($totalMinutes / 100) * 100)),
            ],
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
     * Check if user reached a new fluency level that hasn't been acknowledged yet.
     *
     * @return array<string, mixed>|null
     */
    public static function getNewLevelUp(?User $user): ?array
    {
        if (! $user || ! $user->pupilProfile) {
            return null;
        }

        $fluency = self::calculateFluency($user);
        $currentLevel = (int) ($fluency['level'] ?? 1);
        $lastAckLevel = (int) ($user->pupilProfile->last_acknowledged_level ?? 1);

        if ($currentLevel > $lastAckLevel) {
            return [
                'previous_level' => $lastAckLevel,
                'new_level' => $currentLevel,
                'title_key' => $fluency['title_key'],
                'default_title' => $fluency['default_title'],
                'badge' => $fluency['badge'],
                'total_xp' => $fluency['total_xp'],
                'celebration_active' => true,
            ];
        }

        return null;
    }

    /**
     * Acknowledge level-up ceremony to avoid repeated popups.
     */
    public static function acknowledgeLevelUp(User $user, int $level): bool
    {
        if (! $user->pupilProfile) {
            return false;
        }

        $currentAcknowledged = (int) ($user->pupilProfile->last_acknowledged_level ?? 1);
        if ($level > $currentAcknowledged) {
            $user->pupilProfile->update(['last_acknowledged_level' => $level]);

            return true;
        }

        return false;
    }

    /**
     * Generate a unique alphanumeric referral code for a user (e.g. AZIZ78 or CONVO1234).
     */
    public static function generateReferralCode(User $user): string
    {
        $cleanName = strtoupper(preg_replace('/[^A-Za-z]/', '', $user->name ?: 'CONVO'));
        if (strlen($cleanName) < 3) {
            $cleanName = 'CONVO';
        }
        $prefix = substr($cleanName, 0, 4);

        do {
            $suffix = (string) rand(1000, 9999);
            $candidate = $prefix.$suffix;
        } while (User::where('referral_code', $candidate)->exists());

        return $candidate;
    }

    /**
     * Ensure a user has an alphanumeric referral code.
     */
    public static function ensureReferralCode(User $user): string
    {
        if (! empty($user->referral_code)) {
            return $user->referral_code;
        }

        $code = self::generateReferralCode($user);
        $user->update(['referral_code' => $code]);

        return $code;
    }

    /**
     * Get Referral stats for a user (code, share link, invited count, completed count, rewards).
     *
     * @return array<string, mixed>
     */
    public static function getReferralStats(?User $user): array
    {
        if (! $user) {
            return [
                'referral_code' => '',
                'share_url' => '',
                'friends_invited' => 0,
                'friends_completed' => 0,
                'streak_shields_earned' => 0,
                'xp_earned' => 0,
            ];
        }

        $code = self::ensureReferralCode($user);
        $invitedCount = ReferralRecord::where('referrer_id', $user->id)->count();
        $completedCount = ReferralRecord::where('referrer_id', $user->id)
            ->where('reward_granted', true)
            ->count();

        return [
            'referral_code' => $code,
            'share_url' => url('/register?ref='.$code),
            'friends_invited' => $invitedCount,
            'friends_completed' => $completedCount,
            'streak_shields_earned' => $completedCount,
            'xp_earned' => $completedCount * 100,
        ];
    }

    /**
     * Check if user was referred and award +100 XP & +1 Streak Shield to both referrer & referred user.
     * Guaranteed atomic via DB transaction & lock.
     */
    public static function checkAndAwardReferralReward(string $userId, ?string $conversationId = null): bool
    {
        return DB::transaction(function () use ($userId, $conversationId) {
            $record = ReferralRecord::where('referred_user_id', $userId)
                ->where('reward_granted', false)
                ->lockForUpdate()
                ->first();

            if (! $record) {
                return false;
            }

            $record->update([
                'reward_granted' => true,
                'reward_granted_at' => now(),
                'first_conversation_id' => $conversationId,
            ]);

            // Award +1 Streak Shield to Referrer Pupil Profile (if exists)
            $referrerProfile = PupilProfile::where('user_id', $record->referrer_id)->lockForUpdate()->first();
            if ($referrerProfile) {
                $referrerProfile->increment('streak_shields');
            }

            // Award +1 Streak Shield to Referred User Pupil Profile (if exists)
            $referredProfile = PupilProfile::where('user_id', $record->referred_user_id)->lockForUpdate()->first();
            if ($referredProfile) {
                $referredProfile->increment('streak_shields');
            }

            return true;
        });
    }

    /**
     * Get XP Store catalog with items, costs, user's available XP, and active vouchers.
     *
     * @return array<string, mixed>
     */
    public static function getXpStoreCatalog(?User $user): array
    {
        $fluency = self::calculateFluency($user);
        $availableXp = (int) ($fluency['available_xp'] ?? 0);

        $items = [
            [
                'key' => 'streak_shield',
                'title_key' => 'gamification.store_shield_title',
                'default_title' => 'Streak Shield (+1 🛡️)',
                'desc_key' => 'gamification.store_shield_desc',
                'default_desc' => 'Protects your speaking streak if you miss a scheduled day.',
                'cost_xp' => 500,
                'icon' => '🛡️',
                'can_afford' => $availableXp >= 500,
            ],
            [
                'key' => 'voucher_10',
                'title_key' => 'gamification.store_voucher_10_title',
                'default_title' => '10% Lesson Discount Voucher',
                'desc_key' => 'gamification.store_voucher_10_desc',
                'default_desc' => 'Redeem 10% off any upcoming live 1-on-1 teacher lesson.',
                'cost_xp' => 1000,
                'discount_percent' => 10,
                'icon' => '🎟️',
                'can_afford' => $availableXp >= 1000,
            ],
            [
                'key' => 'voucher_25',
                'title_key' => 'gamification.store_voucher_25_title',
                'default_title' => '25% Lesson Discount Voucher',
                'desc_key' => 'gamification.store_voucher_25_desc',
                'default_desc' => 'Redeem 25% off any upcoming live 1-on-1 teacher lesson.',
                'cost_xp' => 2500,
                'discount_percent' => 25,
                'icon' => '🌟',
                'can_afford' => $availableXp >= 2500,
            ],
        ];

        $activeVouchers = [];
        if ($user) {
            $activeVouchers = UserDiscountVoucher::where('user_id', $user->id)
                ->where('is_redeemed', false)
                ->latest()
                ->get()
                ->toArray();
        }

        return [
            'available_xp' => $availableXp,
            'total_xp' => (int) ($fluency['total_xp'] ?? 0),
            'spent_xp' => (int) ($fluency['spent_xp'] ?? 0),
            'items' => $items,
            'active_vouchers' => $activeVouchers,
        ];
    }

    /**
     * Redeem an item from the XP store atomically.
     *
     * @return array<string, mixed>
     */
    public static function redeemStoreItem(User $user, string $itemKey): array
    {
        $costs = [
            'streak_shield' => 500,
            'voucher_10' => 1000,
            'voucher_25' => 2500,
        ];

        if (! isset($costs[$itemKey])) {
            return [
                'success' => false,
                'message' => 'Invalid store item selected.',
            ];
        }

        $cost = $costs[$itemKey];

        return DB::transaction(function () use ($user, $itemKey, $cost) {
            $profile = PupilProfile::where('user_id', $user->id)->lockForUpdate()->first();
            if (! $profile) {
                return [
                    'success' => false,
                    'message' => 'Pupil profile not found.',
                ];
            }

            $fluency = self::calculateFluency($user);
            $availableXp = (int) ($fluency['available_xp'] ?? 0);

            if ($availableXp < $cost) {
                return [
                    'success' => false,
                    'message' => 'Insufficient XP balance.',
                ];
            }

            $profile->increment('spent_xp', $cost);

            if ($itemKey === 'streak_shield') {
                $profile->increment('streak_shields');

                return [
                    'success' => true,
                    'type' => 'shield',
                    'message' => 'Streak Shield acquired successfully!',
                    'new_available_xp' => max(0, $availableXp - $cost),
                    'streak_shields' => $profile->fresh()->streak_shields,
                ];
            }

            $discountPercent = $itemKey === 'voucher_25' ? 25 : 10;
            $code = 'CONVO-'.$discountPercent.'-'.strtoupper(Str::random(4));

            $voucher = UserDiscountVoucher::create([
                'user_id' => $user->id,
                'voucher_code' => $code,
                'discount_percent' => $discountPercent,
                'xp_spent' => $cost,
                'is_redeemed' => false,
            ]);

            return [
                'success' => true,
                'type' => 'voucher',
                'message' => "{$discountPercent}% Discount Voucher unlocked!",
                'voucher' => $voucher,
                'new_available_xp' => max(0, $availableXp - $cost),
            ];
        });
    }

    /**
     * Submit a 30-second post-lesson rubric assessment by a teacher.
     */
    public static function submitAppointmentAssessment(User $teacher, string $appointmentId, array $data): AppointmentAssessment
    {
        $appointment = Appointment::where('id', $appointmentId)
            ->where('teacher_id', $teacher->id)
            ->firstOrFail();

        $fluency = min(9.0, max(1.0, (float) ($data['fluency_score'] ?? 5.0)));
        $lexical = min(9.0, max(1.0, (float) ($data['lexical_score'] ?? 5.0)));
        $grammar = min(9.0, max(1.0, (float) ($data['grammar_score'] ?? 5.0)));
        $pronunciation = min(9.0, max(1.0, (float) ($data['pronunciation_score'] ?? 5.0)));

        $overall = round((($fluency + $lexical + $grammar + $pronunciation) / 4) * 2) / 2;

        return AppointmentAssessment::updateOrCreate(
            ['appointment_id' => $appointment->id],
            [
                'teacher_id' => $teacher->id,
                'pupil_id' => $appointment->pupil_id,
                'fluency_score' => $fluency,
                'lexical_score' => $lexical,
                'grammar_score' => $grammar,
                'pronunciation_score' => $pronunciation,
                'overall_score' => $overall,
                'teacher_notes' => ! empty($data['teacher_notes']) ? trim($data['teacher_notes']) : null,
            ]
        );
    }

    /**
     * Get verified shareable fluency credential for a user.
     *
     * @return array<string, mixed>|null
     */
    public static function getVerifiedFluencyCredential(User|string $userOrId): ?array
    {
        $user = $userOrId instanceof User ? $userOrId : User::with('pupilProfile')->find($userOrId);
        if (! $user) {
            return null;
        }

        $fluency = self::calculateFluency($user);
        $passport = self::getSpeakingPassport($user);
        $latestAssessment = AppointmentAssessment::with('teacher')
            ->where('pupil_id', $user->id)
            ->latest()
            ->first();

        return [
            'user' => [
                'id' => $user->id,
                'short_id' => $user->short_id,
                'name' => $user->name,
                'avatar' => $user->avatar,
                'country_code' => $user->pupilProfile?->country_code ?? 'UZ',
                'city' => $user->pupilProfile?->city,
            ],
            'fluency' => $fluency,
            'passport' => [
                'countries_count' => $passport['countries_count'],
                'unique_partners_count' => $passport['unique_partners_count'],
                'rank_default' => $passport['passport_rank_default'],
                'rank_key' => $passport['passport_rank_key'],
                'stamps' => array_slice($passport['stamps'], 0, 8),
            ],
            'latest_assessment' => $latestAssessment ? [
                'overall_score' => $latestAssessment->overall_score,
                'fluency_score' => $latestAssessment->fluency_score,
                'lexical_score' => $latestAssessment->lexical_score,
                'grammar_score' => $latestAssessment->grammar_score,
                'pronunciation_score' => $latestAssessment->pronunciation_score,
                'teacher_name' => $latestAssessment->teacher?->name ?: 'Verified Instructor',
                'teacher_notes' => $latestAssessment->teacher_notes,
                'assessed_at' => $latestAssessment->created_at->format('M d, Y'),
            ] : null,
            'verification_url' => url('/credential/'.$user->id),
            'verified_at' => now()->format('M d, Y'),
        ];
    }

    /**
     * Apply an unredeemed discount voucher to an appointment.
     *
     * @return array<string, mixed>
     */
    public static function applyVoucherToAppointment(User $pupil, string $voucherId, string $appointmentId): array
    {
        return DB::transaction(function () use ($pupil, $voucherId, $appointmentId) {
            $voucher = UserDiscountVoucher::where('id', $voucherId)
                ->where('user_id', $pupil->id)
                ->where('is_redeemed', false)
                ->lockForUpdate()
                ->first();

            if (! $voucher) {
                return [
                    'success' => false,
                    'message' => 'Discount voucher is invalid or has already been redeemed.',
                ];
            }

            $appointment = Appointment::where('id', $appointmentId)
                ->where('pupil_id', $pupil->id)
                ->lockForUpdate()
                ->first();

            if (! $appointment) {
                return [
                    'success' => false,
                    'message' => 'Appointment not found.',
                ];
            }

            $price = $appointment->price ?? 0;
            $discountAmount = (int) round(($price * $voucher->discount_percent) / 100);

            $voucher->update([
                'is_redeemed' => true,
                'redeemed_at' => now(),
                'appointment_id' => $appointment->id,
            ]);

            $appointment->update([
                'discount_voucher_id' => $voucher->id,
                'discount_amount' => $discountAmount,
            ]);

            return [
                'success' => true,
                'discount_amount' => $discountAmount,
                'new_price' => max(0, $price - $discountAmount),
                'voucher' => $voucher,
            ];
        });
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
            'spent_xp' => 0,
            'available_xp' => 0,
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
