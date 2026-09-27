import React, { useState } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import {
    X,
    Award,
    Sparkles,
    Check,
    Copy,
    Share2,
    ShieldCheck,
    Clock,
    Globe,
    ExternalLink,
    Send,
} from 'lucide-react';

export interface VerifiedCredentialData {
    user: {
        id: string;
        short_id?: string;
        name: string;
        avatar?: string | null;
        country_code?: string;
        city?: string | null;
    };
    fluency: {
        level: number;
        title_key: string;
        default_title: string;
        badge: string;
        total_xp: number;
        total_minutes: number;
        total_sessions: number;
    };
    passport: {
        countries_count: number;
        unique_partners_count: number;
        rank_default: string;
        rank_key: string;
        stamps: Array<{
            country_code: string;
            country_name: string;
            flag: string;
            sessions_count: number;
        }>;
    };
    latest_assessment?: {
        overall_score: number;
        fluency_score: number;
        lexical_score: number;
        grammar_score: number;
        pronunciation_score: number;
        teacher_name: string;
        teacher_notes?: string | null;
        assessed_at: string;
    } | null;
    verification_url: string;
    verified_at: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    credential?: VerifiedCredentialData | null;
}

export default function VerifiedFluencyCardModal({ isOpen, onClose, credential }: Props) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);

    if (!isOpen || !credential) return null;

    const { user, fluency, passport, latest_assessment, verification_url, verified_at } = credential;

    const handleCopy = () => {
        navigator.clipboard.writeText(verification_url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const shareText = `Check out my verified English fluency credentials on ConvoMate! 🌟 Level ${fluency.level} ${fluency.default_title} with ${fluency.total_minutes} spoken minutes.`;
    const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(verification_url)}&text=${encodeURIComponent(shareText)}`;
    const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verification_url)}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Modal Body */}
            <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 p-6 md:p-8 shadow-2xl text-white ring-1 ring-white/10">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white">
                                {t('credential.title', 'Verified Fluency Credential')}
                            </h2>
                            <p className="text-xs text-slate-400">
                                {t('credential.official_stamp', 'Official Speaking Record')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* The Credential Certificate Card */}
                <div className="my-5 rounded-2xl bg-gradient-to-br from-slate-800 via-indigo-950/70 to-slate-900 p-6 border border-indigo-500/30 relative overflow-hidden shadow-xl">
                    {/* Background Seal Watermark */}
                    <div className="absolute -right-8 -bottom-8 pointer-events-none opacity-5">
                        <Award className="h-64 w-64 text-indigo-200" />
                    </div>

                    {/* Top Row: User + Level Badge */}
                    <div className="flex items-start justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="h-12 w-12 rounded-full object-cover ring-2 ring-indigo-400"
                                />
                            ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 font-bold text-lg text-white ring-2 ring-indigo-400">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-extrabold text-base text-white">{user.name}</h3>
                                    <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        <Check className="h-3 w-3" />
                                        {t('credential.verified_badge', 'Verified')}
                                    </span>
                                </div>
                                <p className="text-xs text-indigo-200 mt-0.5">
                                    {t(fluency.title_key, fluency.default_title)} · Level {fluency.level}
                                </p>
                            </div>
                        </div>

                        <div className="text-3xl" title={`Level ${fluency.level}`}>
                            {fluency.badge}
                        </div>
                    </div>

                    {/* Stats Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2.5 my-5 relative z-10">
                        <div className="rounded-xl bg-white/5 p-3 border border-white/5 text-center">
                            <Clock className="h-4 w-4 mx-auto mb-1 text-indigo-300" />
                            <div className="text-base font-black text-white">{fluency.total_minutes}m</div>
                            <div className="text-[10px] text-slate-400">Spoken Time</div>
                        </div>
                        <div className="rounded-xl bg-white/5 p-3 border border-white/5 text-center">
                            <Sparkles className="h-4 w-4 mx-auto mb-1 text-amber-300" />
                            <div className="text-base font-black text-white">{fluency.total_sessions}</div>
                            <div className="text-[10px] text-slate-400">Sessions Done</div>
                        </div>
                        <div className="rounded-xl bg-white/5 p-3 border border-white/5 text-center">
                            <Globe className="h-4 w-4 mx-auto mb-1 text-emerald-300" />
                            <div className="text-base font-black text-white">{passport.countries_count}</div>
                            <div className="text-[10px] text-slate-400">Countries</div>
                        </div>
                    </div>

                    {/* Teacher Assessment Rubric Section */}
                    {latest_assessment ? (
                        <div className="rounded-xl bg-black/30 p-4 border border-white/10 relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                                        {t('credential.latest_assessment', 'Latest Teacher Assessment')}
                                    </span>
                                    <div className="text-xs text-slate-300">
                                        {t('credential.evaluated_by', { teacher: latest_assessment.teacher_name })}
                                    </div>
                                </div>
                                <div className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-xs shadow-xs">
                                    Band {latest_assessment.overall_score.toFixed(1)}
                                </div>
                            </div>

                            {/* 4 Criterion Bars */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex justify-between bg-white/5 px-2.5 py-1.5 rounded-lg">
                                    <span className="text-slate-300">Fluency</span>
                                    <span className="font-bold text-amber-300">
                                        {latest_assessment.fluency_score.toFixed(1)}
                                    </span>
                                </div>
                                <div className="flex justify-between bg-white/5 px-2.5 py-1.5 rounded-lg">
                                    <span className="text-slate-300">Lexical</span>
                                    <span className="font-bold text-amber-300">
                                        {latest_assessment.lexical_score.toFixed(1)}
                                    </span>
                                </div>
                                <div className="flex justify-between bg-white/5 px-2.5 py-1.5 rounded-lg">
                                    <span className="text-slate-300">Grammar</span>
                                    <span className="font-bold text-amber-300">
                                        {latest_assessment.grammar_score.toFixed(1)}
                                    </span>
                                </div>
                                <div className="flex justify-between bg-white/5 px-2.5 py-1.5 rounded-lg">
                                    <span className="text-slate-300">Pronunciation</span>
                                    <span className="font-bold text-amber-300">
                                        {latest_assessment.pronunciation_score.toFixed(1)}
                                    </span>
                                </div>
                            </div>

                            {latest_assessment.teacher_notes && (
                                <p className="mt-2.5 text-[11px] text-slate-300 italic border-l-2 border-indigo-400 pl-2">
                                    "{latest_assessment.teacher_notes}"
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-xl bg-white/5 p-3.5 border border-white/5 text-center text-xs text-slate-400 relative z-10">
                            {t(
                                'credential.no_assessment_yet',
                                'Complete your first live lesson to receive a certified rubric evaluation from an expert teacher.'
                            )}
                        </div>
                    )}

                    {/* Passport Stamps Preview */}
                    {passport.stamps && passport.stamps.length > 0 && (
                        <div className="mt-3.5 flex items-center gap-1.5 overflow-x-auto py-1 relative z-10">
                            <span className="text-[10px] text-slate-400 shrink-0 mr-1">Passport:</span>
                            {passport.stamps.map((stamp, idx) => (
                                <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-md bg-white/10 text-xs shrink-0 flex items-center gap-1"
                                    title={`${stamp.country_name} (${stamp.sessions_count} sessions)`}
                                >
                                    <span>{stamp.flag}</span>
                                    <span className="text-[10px] font-mono">{stamp.country_code}</span>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Footer Watermark */}
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 relative z-10">
                        <span>Issued: {verified_at}</span>
                        <span className="font-mono text-indigo-300">CONVOMATE-VERIFIED</span>
                    </div>
                </div>

                {/* Share Actions */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopy}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white transition active:scale-95 shadow-sm"
                        >
                            {copied ? (
                                <>
                                    <Check className="h-4 w-4 text-emerald-300" />
                                    <span>{t('credential.link_copied', 'Credential link copied!')}</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="h-4 w-4" />
                                    <span>{t('credential.copy_link', 'Copy Public Link')}</span>
                                </>
                            )}
                        </button>

                        <a
                            href={verification_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 transition"
                            title="Open Public Link"
                        >
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </div>

                    <div className="flex items-center justify-center gap-3 pt-1">
                        <a
                            href={telegramShareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-semibold transition"
                        >
                            <Send className="h-3.5 w-3.5" />
                            <span>Telegram</span>
                        </a>

                        <a
                            href={linkedinShareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold transition"
                        >
                            <Share2 className="h-3.5 w-3.5" />
                            <span>LinkedIn</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
