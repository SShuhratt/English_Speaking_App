import React from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { Sparkles, Award } from 'lucide-react';

interface FluencyData {
    level: number;
    title_key: string;
    default_title: string;
    badge: string;
    total_xp: number;
    current_level_xp: number;
    next_level_target_xp: number;
    progress_percent: number;
    xp_to_next_level: number;
    is_max_level: boolean;
    total_minutes: number;
    total_sessions: number;
}

export default function FluencyLevelBadge({ fluency }: { fluency: FluencyData }) {
    const { t } = useTranslation();

    const title = t(fluency.title_key) || fluency.default_title;

    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-3.5 backdrop-blur-md transition-all hover:bg-white/15">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-xl shadow-md shadow-amber-500/20">
                        <span>{fluency.badge}</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                                {t('gamification.fluency_level', { level: fluency.level })}
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="text-xs font-bold text-white">
                                {title}
                            </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-200">
                            {t('gamification.total_xp', { count: fluency.total_xp.toLocaleString() })}
                        </p>
                    </div>
                </div>

                {!fluency.is_max_level ? (
                    <div className="hidden sm:block text-right">
                        <span className="text-[11px] font-medium text-amber-200/90">
                            {t('gamification.xp_to_next', {
                                xp: fluency.xp_to_next_level,
                                title: `Level ${fluency.level + 1}`,
                            })}
                        </span>
                    </div>
                ) : (
                    <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-amber-300">
                        <Award className="h-3.5 w-3.5" />
                        <span>{t('gamification.max_level_achieved')}</span>
                    </div>
                )}
            </div>

            {/* XP Progress Bar */}
            <div className="mt-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-black/25">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 transition-all duration-700 ease-out"
                        style={{ width: `${Math.max(6, fluency.progress_percent)}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
