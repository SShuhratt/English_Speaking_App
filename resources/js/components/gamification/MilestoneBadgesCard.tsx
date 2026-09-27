import React from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { Award, CheckCircle2, Lock } from 'lucide-react';

export interface MilestoneBadge {
    id: string;
    name_key: string;
    default_name: string;
    desc_key: string;
    default_desc: string;
    icon: string;
    unlocked: boolean;
    progress_percent: number;
}

interface Props {
    badges: MilestoneBadge[];
}

export default function MilestoneBadgesCard({ badges }: Props) {
    const { t } = useTranslation();

    const unlockedCount = badges.filter((b) => b.unlocked).length;

    return (
        <div className="relative overflow-hidden rounded-3xl border border-[#E6E9F2] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#12131e]">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E9F2] pb-4 dark:border-white/10">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                        <Award className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-base font-black tracking-tight text-[#1E2A5A] dark:text-white">
                            {t('gamification.badges_title') || 'Milestone Badges'}
                        </h3>
                        <p className="text-xs text-[#6B7394] dark:text-[#A0A0B0]">
                            {t('gamification.badges_subtitle') || 'Collectible badges for key conversational milestones'}
                        </p>
                    </div>
                </div>

                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-100 dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-300">
                    {unlockedCount} / {badges.length} {t('gamification.badge_unlocked') || 'Unlocked'}
                </span>
            </div>

            {/* Badges Grid */}
            <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {badges.map((badge) => {
                    const title = t(badge.name_key) || badge.default_name;
                    const desc = t(badge.desc_key) || badge.default_desc;

                    return (
                        <div
                            key={badge.id}
                            className={`group relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 ${
                                badge.unlocked
                                    ? 'border-amber-400/40 bg-gradient-to-br from-amber-500/5 via-amber-500/[0.02] to-transparent shadow-xs hover:border-amber-400/70 hover:shadow-md dark:border-amber-400/30 dark:bg-amber-400/[0.04]'
                                    : 'border-slate-200/80 bg-slate-50/50 opacity-80 hover:opacity-100 dark:border-white/5 dark:bg-white/[0.02]'
                            }`}
                        >
                            {/* Top: Icon + Status */}
                            <div className="flex items-start justify-between gap-2">
                                <div
                                    className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xl shadow-xs transition-transform group-hover:scale-105 ${
                                        badge.unlocked
                                            ? 'bg-amber-100/80 ring-2 ring-amber-300/40 dark:bg-amber-400/20 dark:ring-amber-400/30'
                                            : 'bg-slate-200/60 grayscale dark:bg-white/10'
                                    }`}
                                >
                                    <span>{badge.icon}</span>
                                </div>

                                {badge.unlocked ? (
                                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                                        <CheckCircle2 className="h-3 w-3" />
                                        <span>{t('gamification.badge_unlocked') || 'Unlocked'}</span>
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 rounded-full bg-slate-200/60 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                                        <Lock className="h-2.5 w-2.5" />
                                        <span>{badge.progress_percent}%</span>
                                    </span>
                                )}
                            </div>

                            {/* Middle: Title & Desc */}
                            <div className="mt-3">
                                <h4 className="text-xs font-black text-[#1E2A5A] dark:text-white">
                                    {title}
                                </h4>
                                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#6B7394] dark:text-[#A0A0B0]">
                                    {desc}
                                </p>
                            </div>

                            {/* Bottom: Progress Bar */}
                            <div className="mt-3 pt-2">
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                                    <div
                                        className={`h-full transition-all duration-500 ${
                                            badge.unlocked
                                                ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                                                : 'bg-indigo-500'
                                        }`}
                                        style={{ width: `${Math.max(4, badge.progress_percent)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
