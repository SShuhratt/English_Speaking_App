import React from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { Sparkles, Trophy, CheckCircle, X } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    minutesSpoken?: number;
    xpEarned?: number;
}

export default function SessionCelebrationModal({
    isOpen,
    onClose,
    minutesSpoken = 30,
    xpEarned = 350,
}: Props) {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-200 bg-white p-6 md:p-8 text-center shadow-2xl">
                {/* Decorative Background Glows */}
                <div className="pointer-events-none absolute -top-12 -left-12 h-36 w-36 rounded-full bg-amber-200/40 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-yellow-200/40 blur-2xl" />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Trophy & Badge */}
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-xl shadow-amber-300/40 animate-bounce">
                    <Trophy className="h-10 w-10 text-[#061445]" />
                </div>

                {/* Title */}
                <h3 className="mt-5 text-2xl font-black tracking-tight text-[#1b1b1f]">
                    {t('gamification.celeb_title')}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                    {t('gamification.celeb_subtitle')}
                </p>

                {/* Stats Showcase */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-amber-50/80 p-4 border border-amber-100">
                        <p className="text-xs font-bold text-amber-800 uppercase">
                            Speaking Time
                        </p>
                        <p className="mt-1 text-2xl font-black text-[#061445]">
                            +{minutesSpoken}m
                        </p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50/80 p-4 border border-emerald-100">
                        <p className="text-xs font-bold text-emerald-800 uppercase">
                            XP Gained
                        </p>
                        <p className="mt-1 text-2xl font-black text-emerald-700">
                            +{xpEarned} XP
                        </p>
                    </div>
                </div>

                {/* Continue Action Button */}
                <button
                    onClick={onClose}
                    className="mt-6 w-full cursor-pointer rounded-2xl bg-[#061445] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#061445]/20 transition hover:-translate-y-0.5 hover:bg-[#061445]/90"
                >
                    {t('gamification.celeb_close')}
                </button>
            </div>
        </div>
    );
}
