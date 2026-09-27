import React from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { Shield, Sparkles, CheckCircle2, ArrowRight, Zap, Target } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface WeeklyMomentumData {
    weekly_target: number;
    sessions_this_week: number;
    progress_percent: number;
    target_met: boolean;
    streak_shields: number;
    karma_score: number;
    karma_tier: 'trusted' | 'active' | 'developing';
    momentum_weeks: number;
}

export default function WeeklyMomentumRingCard({ momentum }: { momentum: WeeklyMomentumData }) {
    const { t } = useTranslation();

    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (momentum.progress_percent / 100) * circumference;

    const karmaColor =
        momentum.karma_score >= 90
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
            : momentum.karma_score >= 70
              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';

    const karmaTierText =
        momentum.karma_tier === 'trusted'
            ? t('gamification.karma_trusted') || 'Trusted Partner'
            : momentum.karma_tier === 'active'
              ? t('gamification.karma_active') || 'Active Partner'
              : t('gamification.karma_developing') || 'Building Trust';

    return (
        <div className="shadow-ambient relative overflow-hidden rounded-3xl border border-[#d0e4ff]/30 bg-gradient-to-br from-white via-[#f8faff] to-[#eef4fb] p-6 md:p-7 dark:border-white/5 dark:bg-gradient-to-br dark:from-[#0c0c16] dark:via-[#111222] dark:to-[#17182e]">
            {/* Header: Title & Badges */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1E2A5A]/10 text-[#1E2A5A] dark:bg-[#F7DE8B]/10 dark:text-[#F7DE8B]">
                        <Target className="h-4 w-4" />
                    </span>
                    <div>
                        <h3 className="text-sm font-black tracking-wide text-[#1E2A5A] uppercase dark:text-white">
                            {t('gamification.weekly_momentum_title') || 'Weekly Momentum'}
                        </h3>
                        <p className="text-[11px] font-medium text-[#6B7394] dark:text-[#A0A0B0]">
                            {momentum.target_met
                                ? t('gamification.weekly_goal_completed') || 'Target achieved this week!'
                                : t('gamification.weekly_goal_remaining', {
                                      count: Math.max(0, momentum.weekly_target - momentum.sessions_this_week),
                                  }) || `${Math.max(0, momentum.weekly_target - momentum.sessions_this_week)} more to reach weekly goal`}
                        </p>
                    </div>
                </div>

                {/* Karma & Shield Pills */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${karmaColor}`}>
                        <Sparkles className="h-3 w-3" />
                        <span>{momentum.karma_score}% {karmaTierText}</span>
                    </div>

                    {momentum.streak_shields > 0 && (
                        <div className="flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300">
                            <Shield className="h-3 w-3" />
                            <span>{momentum.streak_shields} {t('gamification.shield_ready') || 'Shield Active'}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Progress Section */}
            <div className="mt-5 flex flex-col items-center justify-between gap-6 sm:flex-row">
                {/* SVG Progress Ring */}
                <div className="relative flex items-center justify-center">
                    <svg className="h-28 w-28 -rotate-90 transform" viewBox="0 0 100 100">
                        {/* Background track */}
                        <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            className="stroke-slate-100 dark:stroke-white/10"
                            strokeWidth="9"
                            fill="transparent"
                        />
                        {/* Animated progress circle */}
                        <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            className="stroke-[#1E2A5A] transition-all duration-1000 ease-out dark:stroke-[#F7DE8B]"
                            strokeWidth="9"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            fill="transparent"
                        />
                    </svg>

                    {/* Centered Ring Text */}
                    <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className="text-xl font-extrabold text-[#1E2A5A] dark:text-white">
                            {momentum.sessions_this_week}/{momentum.weekly_target}
                        </span>
                        <span className="text-[10px] font-bold text-[#6B7394] uppercase dark:text-[#A0A0B0]">
                            {t('gamification.sessions_label') || 'Sessions'}
                        </span>
                    </div>
                </div>

                {/* Right Details Column */}
                <div className="flex-1 space-y-3 text-center sm:text-left">
                    <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1.5 sm:justify-start">
                            <span className="text-base font-extrabold text-[#1E2A5A] dark:text-white">
                                {momentum.progress_percent}% {t('gamification.progress_completed') || 'Completed'}
                            </span>
                            {momentum.target_met && (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            )}
                        </div>
                        <p className="text-xs text-[#45464f] dark:text-[#A0A0B0]">
                            {t('gamification.momentum_subtext') ||
                                'Consistent practice builds natural speaking reflexes. Complete 3 sessions each week to maintain momentum.'}
                        </p>
                    </div>

                    {/* Momentum Weeks Pill & Action */}
                    <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                        {momentum.momentum_weeks > 0 && (
                            <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                                <Zap className="h-3.5 w-3.5 fill-amber-500" />
                                <span>{momentum.momentum_weeks} {t('gamification.momentum_streak_weeks') || 'Weeks Consistent'}</span>
                            </div>
                        )}

                        <Link
                            href="/speaking"
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#1E2A5A] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#1E2A5A]/90 dark:bg-[#F7DE8B] dark:text-[#1E2A5A] dark:hover:bg-[#F7DE8B]/90"
                        >
                            <span>{t('gamification.start_speaking_btn') || 'Start Speaking'}</span>
                            <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
