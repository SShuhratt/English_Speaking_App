import React from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { Trophy, Medal, Clock, Crown, Sparkles, ArrowUpRight } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface SpeakerEntry {
    rank: number;
    user_id: string;
    full_name: string;
    avatar?: string | null;
    minutes_spoken: number;
    level: number;
    badge: string;
    level_title_key?: string;
}

interface LeaderboardData {
    top_speakers: SpeakerEntry[];
    user_standing?: (SpeakerEntry & { is_in_top_five?: boolean }) | null;
    week_label: string;
    total_active_speakers: number;
}

export default function WeeklyLeaderboardCard({
    leaderboard,
}: {
    leaderboard: LeaderboardData;
}) {
    const { t } = useTranslation();

    const topSpeakers = leaderboard?.top_speakers || [];
    const userStanding = leaderboard?.user_standing;

    const rankMedals: Record<number, { bg: string; text: string; icon: string }> = {
        1: { bg: 'bg-amber-100 border-amber-300 text-amber-800', text: '1st', icon: '🥇' },
        2: { bg: 'bg-slate-100 border-slate-300 text-slate-700', text: '2nd', icon: '🥈' },
        3: { bg: 'bg-amber-50 border-amber-200 text-amber-900', text: '3rd', icon: '🥉' },
    };

    return (
        <div className="shadow-ambient relative overflow-hidden rounded-3xl border border-[#c6c5d0]/30 bg-white p-6 md:p-8 transition-all hover:border-[#061445]/20">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c6c5d0]/30 pb-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-brand-navy shadow-md shadow-amber-300/30">
                        <Trophy className="h-6 w-6 text-[#061445]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-[#1b1b1f]">
                            {t('gamification.leaderboard_title')}
                        </h2>
                        <p className="text-xs text-[#45464f]">
                            {leaderboard?.week_label} · {t('gamification.leaderboard_subtitle')}
                        </p>
                    </div>
                </div>

                <Link
                    href="/pupil/teachers"
                    className="inline-flex items-center gap-1 rounded-full border border-[#061445]/15 bg-[#061445]/5 px-3 py-1.5 text-xs font-bold text-[#061445] transition hover:bg-[#061445] hover:text-white"
                >
                    <span>Practice Now</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
            </div>

            {/* Content List */}
            {topSpeakers.length > 0 ? (
                <div className="mt-5 space-y-3">
                    {topSpeakers.map((speaker) => {
                        const isTopThree = speaker.rank <= 3;
                        const medal = rankMedals[speaker.rank];

                        return (
                            <div
                                key={speaker.user_id}
                                className={`flex items-center justify-between gap-3 rounded-2xl p-3.5 transition-colors ${
                                    speaker.rank === 1
                                        ? 'border border-amber-200/80 bg-gradient-to-r from-amber-50/70 to-yellow-50/40'
                                        : 'bg-slate-50/60 hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    {/* Rank Badge */}
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                                        {isTopThree ? (
                                            <span className="text-xl" title={medal?.text}>
                                                {medal?.icon}
                                            </span>
                                        ) : (
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200/70 text-xs font-bold text-slate-600">
                                                #{speaker.rank}
                                            </span>
                                        )}
                                    </div>

                                    {/* Avatar */}
                                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                                        {speaker.avatar ? (
                                            <img
                                                src={speaker.avatar}
                                                alt={speaker.full_name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center font-bold text-[#061445]">
                                                {speaker.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                        )}
                                        {speaker.rank === 1 && (
                                            <Crown className="absolute -top-1 -right-1 h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                                        )}
                                    </div>

                                    {/* User Details */}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="truncate text-sm font-bold text-[#1b1b1f]">
                                                {speaker.full_name}
                                            </p>
                                            <span
                                                className="inline-flex items-center rounded-full bg-amber-100/70 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800"
                                                title={`Level ${speaker.level}`}
                                            >
                                                {speaker.badge} L{speaker.level}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Minutes Spoken Pill */}
                                <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#061445] shadow-xs border border-slate-100">
                                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                                    <span>
                                        {t('gamification.minutes_spoken', { count: speaker.minutes_spoken })}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Empty state when early in week */
                <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                    <Sparkles className="mx-auto h-8 w-8 text-amber-400" />
                    <p className="mt-2 text-sm font-bold text-[#1b1b1f]">
                        {t('gamification.empty_leaderboard')}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        Complete a lesson or start a peer conversation to lead the community!
                    </p>
                    <Link
                        href="/pupil/teachers"
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#061445] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#061445]/90"
                    >
                        Book a Speaking Session
                    </Link>
                </div>
            )}

            {/* User Standing Footer Card */}
            {userStanding && (
                <div className="mt-5 rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50/90 to-yellow-50/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-sm font-black text-[#061445] shadow-xs">
                                #{userStanding.rank}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-amber-900">
                                    {t('gamification.your_standing')}
                                </p>
                                <p className="text-xs font-medium text-amber-800/80">
                                    {userStanding.minutes_spoken > 0
                                        ? `${userStanding.minutes_spoken} minutes spoken this week`
                                        : 'No sessions yet this week'}
                                </p>
                            </div>
                        </div>

                        {userStanding.is_in_top_five ? (
                            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-800">
                                Top 5 Speaker 🌟
                            </span>
                        ) : (
                            <span className="text-xs font-bold text-amber-900">
                                Keep speaking to climb the ranks! 🚀
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
