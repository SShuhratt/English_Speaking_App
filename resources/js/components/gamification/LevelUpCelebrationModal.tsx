import React, { useState } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import {
    Sparkles,
    Trophy,
    Check,
    Share2,
    ArrowRight,
    Shield,
    Flame,
    Users,
} from 'lucide-react';

interface LevelUpData {
    previous_level: number;
    new_level: number;
    title_key: string;
    default_title: string;
    badge: string;
    total_xp: number;
    celebration_active: boolean;
}

interface Props {
    levelUp: LevelUpData | null;
    onAcknowledge: (level: number) => void;
}

export default function LevelUpCelebrationModal({
    levelUp,
    onAcknowledge,
}: Props) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    if (!levelUp || !levelUp.celebration_active) {
        return null;
    }

    const title = t(levelUp.title_key, levelUp.default_title);

    const handleShare = () => {
        const shareText = t('gamification.level_up_share_text', {
            level: levelUp.new_level.toString(),
            title: title,
        });
        const currentUrl = window.location.origin;
        const fullMessage = `${shareText} ${currentUrl}`;

        if (navigator.share) {
            navigator
                .share({
                    title: t('gamification.level_up_title'),
                    text: fullMessage,
                    url: currentUrl,
                })
                .catch(() => {
                    // Fallback to clipboard
                    navigator.clipboard.writeText(fullMessage);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                });
        } else {
            navigator.clipboard.writeText(fullMessage);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleConfirm = async () => {
        setSubmitting(true);
        try {
            await onAcknowledge(levelUp.new_level);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-amber-300/60 bg-gradient-to-b from-amber-50/90 via-white to-white p-6 sm:p-8 text-center shadow-2xl shadow-amber-500/20">
                {/* Festive Background Particles / Glows */}
                <div className="pointer-events-none absolute -top-24 -left-24 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl animate-pulse" />
                <div className="pointer-events-none absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-yellow-300/30 blur-3xl" />
                <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-indigo-200/20 blur-3xl" />

                {/* Animated Floating Confetti Badges */}
                <div className="pointer-events-none absolute top-6 left-6 text-xl animate-bounce">
                    ✨
                </div>
                <div className="pointer-events-none absolute top-8 right-8 text-xl animate-bounce delay-150">
                    🎉
                </div>
                <div className="pointer-events-none absolute bottom-12 left-8 text-xl animate-bounce delay-300">
                    🔥
                </div>
                <div className="pointer-events-none absolute bottom-10 right-6 text-xl animate-bounce delay-500">
                    🌟
                </div>

                {/* Main Level Badge Centerpiece */}
                <div className="relative mx-auto mt-2 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-200 shadow-xl shadow-amber-400/40 ring-4 ring-amber-200/60 animate-bounce">
                    <span className="text-5xl drop-shadow-sm select-none">
                        {levelUp.badge}
                    </span>
                    <div className="absolute -bottom-2.5 -right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white shadow-md">
                        L{levelUp.new_level}
                    </div>
                </div>

                {/* Header Title */}
                <div className="mt-5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-black tracking-wider uppercase text-amber-800 border border-amber-200/80">
                        <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                        {t('gamification.level_up_title')}
                    </span>
                    <h2 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                        {title}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 max-w-sm mx-auto">
                        {t('gamification.level_up_subtitle')}
                    </p>
                </div>

                {/* XP Pill */}
                <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-1.5 border border-amber-200/70 text-xs font-bold text-amber-900">
                    <Trophy className="h-4 w-4 text-amber-600" />
                    <span>
                        {levelUp.total_xp} Total XP Accumulated
                    </span>
                </div>

                {/* Unlocked Perks List */}
                <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-left">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                        {t('gamification.level_up_unlocked_perks')}
                    </p>
                    <div className="mt-3 space-y-2.5">
                        <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                                <Users className="h-3.5 w-3.5" />
                            </div>
                            <span>{t('gamification.level_up_perk1')}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                                <Sparkles className="h-3.5 w-3.5" />
                            </div>
                            <span>{t('gamification.level_up_perk2')}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                                <Shield className="h-3.5 w-3.5" />
                            </div>
                            <span>{t('gamification.level_up_perk3')}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                    <button
                        onClick={handleConfirm}
                        disabled={submitting}
                        className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-yellow-600 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
                    >
                        <span>{t('gamification.level_up_continue')}</span>
                        <ArrowRight className="h-4 w-4" />
                    </button>

                    <button
                        onClick={handleShare}
                        type="button"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition cursor-pointer"
                        title={t('gamification.level_up_share')}
                    >
                        {copied ? (
                            <>
                                <Check className="h-4 w-4 text-emerald-600" />
                                <span className="text-emerald-700 text-xs">
                                    {t('gamification.level_up_share_copied')}
                                </span>
                            </>
                        ) : (
                            <>
                                <Share2 className="h-4 w-4 text-slate-600" />
                                <span className="hidden sm:inline">
                                    {t('gamification.level_up_share')}
                                </span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
