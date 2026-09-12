import React from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { Flame, ShieldCheck, Zap } from 'lucide-react';

interface StreakData {
    streak_count: number;
    tier: 'dormant' | 'spark' | 'blaze' | 'thunder' | 'diamond';
    tier_title_key: string;
    default_title: string;
    flame_color: string;
    milestone_target: number;
    days_to_milestone: number;
    shield_active: boolean;
    shield_message_key: string;
    default_shield_message: string;
}

export default function StreakFlameBadge({ streak }: { streak: StreakData }) {
    const { t } = useTranslation();

    const tierTitle = t(streak.tier_title_key) || streak.default_title;
    const isBurning = streak.streak_count > 0;

    const tierStyles = {
        dormant: {
            bg: 'bg-slate-500/20 border-slate-400/30 text-slate-200',
            glow: '',
            iconColor: 'text-slate-300',
        },
        spark: {
            bg: 'bg-amber-500/20 border-amber-400/40 text-amber-200',
            glow: 'shadow-amber-500/20',
            iconColor: 'text-amber-400',
        },
        blaze: {
            bg: 'bg-orange-500/25 border-orange-400/50 text-orange-200',
            glow: 'shadow-orange-500/30 shadow-md',
            iconColor: 'text-orange-400 animate-pulse',
        },
        thunder: {
            bg: 'bg-purple-500/25 border-purple-400/50 text-purple-200',
            glow: 'shadow-purple-500/30 shadow-md',
            iconColor: 'text-purple-300 animate-pulse',
        },
        diamond: {
            bg: 'bg-cyan-500/25 border-cyan-400/50 text-cyan-200',
            glow: 'shadow-cyan-500/40 shadow-lg',
            iconColor: 'text-cyan-300 animate-bounce',
        },
    }[streak.tier] || {
        bg: 'bg-amber-500/20 border-amber-400/30 text-amber-200',
        glow: '',
        iconColor: 'text-amber-400',
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Main Streak Flame Pill */}
            <div
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition-transform hover:scale-105 ${tierStyles.bg} ${tierStyles.glow}`}
                title={t('gamification.next_streak_milestone', {
                    days: streak.days_to_milestone,
                    target: streak.milestone_target,
                })}
            >
                <Flame className={`h-4 w-4 ${tierStyles.iconColor}`} />
                <span>
                    {streak.streak_count} {streak.streak_count === 1 ? 'Day Streak' : 'Days Streak'}
                </span>
                <span className="opacity-60">·</span>
                <span className="font-semibold text-white/90">{tierTitle}</span>
            </div>

            {/* Streak Shield Protection Pill */}
            {streak.shield_active && (
                <div
                    className="flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 shadow-sm"
                    title={t(streak.shield_message_key) || streak.default_shield_message}
                >
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                    <span className="hidden sm:inline">Shield Active</span>
                </div>
            )}
        </div>
    );
}
