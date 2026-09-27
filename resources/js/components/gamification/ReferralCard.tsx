import React, { useState } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import {
    Gift,
    Users,
    Shield,
    Zap,
    Copy,
    Check,
    Send,
    MessageCircle,
    Sparkles,
} from 'lucide-react';

interface ReferralStats {
    referral_code: string;
    share_url: string;
    friends_invited: number;
    friends_completed: number;
    streak_shields_earned: number;
    xp_earned: number;
}

interface Props {
    referral?: ReferralStats;
}

export default function ReferralCard({ referral }: Props) {
    const { t } = useTranslation();
    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    if (!referral || !referral.referral_code) {
        return null;
    }

    const code = referral.referral_code;
    const shareUrl = referral.share_url;

    const handleCopyCode = () => {
        navigator.clipboard.writeText(code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    const shareMessage = t('gamification.referral_share_message', {
        code,
    });

    const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareMessage)}`;
    const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage + ' ' + shareUrl)}`;

    return (
        <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/40 p-6 md:p-8 shadow-sm">
            {/* Background Glow */}
            <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-indigo-200/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-purple-200/30 blur-3xl" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20">
                        <Gift className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-900">
                                {t('gamification.referral_title')}
                            </h3>
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                                <Sparkles className="h-3 w-3" />
                                +100 XP & +1 🛡️
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600 max-w-xl">
                            {t('gamification.referral_subtitle')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Referral Code & Quick Copy Bar */}
            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-2xl border border-indigo-200/70 bg-white/80 p-3 shadow-xs backdrop-blur-xs">
                <div className="flex items-center justify-between sm:justify-start gap-3 px-3 py-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {t('gamification.referral_code_label')}:
                    </span>
                    <span className="font-mono text-lg font-black tracking-widest text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-100">
                        {code}
                    </span>
                    <button
                        onClick={handleCopyCode}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition p-1.5 rounded-lg hover:bg-slate-100"
                        title={t('gamification.referral_copy_code')}
                    >
                        {copiedCode ? (
                            <>
                                <Check className="h-4 w-4 text-emerald-600" />
                                <span className="text-emerald-700">
                                    {t('gamification.referral_copied')}
                                </span>
                            </>
                        ) : (
                            <>
                                <Copy className="h-4 w-4" />
                                <span>{t('gamification.referral_copy_code')}</span>
                            </>
                        )}
                    </button>
                </div>

                <div className="h-px sm:h-6 sm:w-px bg-slate-200 sm:mx-1" />

                <div className="flex flex-1 items-center gap-2">
                    <button
                        onClick={handleCopyLink}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-[0.99] transition cursor-pointer"
                    >
                        {copiedLink ? (
                            <>
                                <Check className="h-4 w-4 text-white" />
                                <span>{t('gamification.referral_copied')}</span>
                            </>
                        ) : (
                            <>
                                <Copy className="h-4 w-4" />
                                <span>{t('gamification.referral_copy_link')}</span>
                            </>
                        )}
                    </button>

                    {/* Telegram Share */}
                    <a
                        href={telegramShareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#229ED9] px-3.5 py-2.5 text-xs font-bold text-white hover:bg-[#1E8CC0] shadow-xs active:scale-[0.99] transition"
                        title={t('gamification.referral_share_tg')}
                    >
                        <Send className="h-4 w-4" />
                        <span className="hidden sm:inline">Telegram</span>
                    </a>

                    {/* WhatsApp Share */}
                    <a
                        href={whatsappShareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3.5 py-2.5 text-xs font-bold text-white hover:bg-[#20BA5A] shadow-xs active:scale-[0.99] transition"
                        title={t('gamification.referral_share_wa')}
                    >
                        <MessageCircle className="h-4 w-4" />
                        <span className="hidden sm:inline">WhatsApp</span>
                    </a>
                </div>
            </div>

            {/* Referral Stats Strip */}
            <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-slate-100 bg-white/70 p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">
                            {t('gamification.referral_invited')}
                        </span>
                        <Users className="h-4 w-4 text-indigo-500" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-slate-900">
                        {referral.friends_invited}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white/70 p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">
                            {t('gamification.referral_completed')}
                        </span>
                        <Zap className="h-4 w-4 text-amber-500" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-slate-900">
                        {referral.friends_completed}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white/70 p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">
                            {t('gamification.referral_shields_earned')}
                        </span>
                        <Shield className="h-4 w-4 text-emerald-500" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-emerald-700">
                        +{referral.streak_shields_earned} 🛡️
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white/70 p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">
                            {t('gamification.referral_xp_earned')}
                        </span>
                        <Sparkles className="h-4 w-4 text-purple-500" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-purple-700">
                        +{referral.xp_earned} XP
                    </p>
                </div>
            </div>

            {/* 3-Step Flow Footer */}
            <div className="mt-6 border-t border-indigo-100/60 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {t('gamification.referral_how_it_works')}
                </p>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
                    <div className="flex items-start gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
                            1
                        </span>
                        <span>{t('gamification.referral_step1')}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
                            2
                        </span>
                        <span>{t('gamification.referral_step2')}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
                            3
                        </span>
                        <span>{t('gamification.referral_step3')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
