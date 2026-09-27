import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';
import {
    Award,
    ShieldCheck,
    Clock,
    Sparkles,
    Globe,
    Check,
    Copy,
    Share2,
    Send,
    ArrowLeft,
    CheckCircle2,
} from 'lucide-react';
import { VerifiedCredentialData } from '@/components/gamification/VerifiedFluencyCardModal';

interface Props {
    credential: VerifiedCredentialData;
}

export default function CredentialPage({ credential }: Props) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);

    const { user, fluency, passport, latest_assessment, verification_url, verified_at } = credential;

    const handleCopy = () => {
        navigator.clipboard.writeText(verification_url || window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const shareText = `Verified English Fluency Credential for ${user.name} on ConvoMate! 🌟 Level ${fluency.level} (${fluency.default_title}) with ${fluency.total_minutes} spoken minutes.`;
    const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(verification_url || '')}&text=${encodeURIComponent(shareText)}`;
    const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verification_url || '')}`;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
            <Head>
                <title>{`${user.name} — Verified Fluency Credential | ConvoMate`}</title>
                <meta
                    name="description"
                    content={`Verified English fluency credential for ${user.name}. Level ${fluency.level} (${fluency.default_title}), ${fluency.total_minutes} speaking minutes completed.`}
                />
            </Head>

            {/* Top Navigation */}
            <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20 group-hover:scale-105 transition">
                            C
                        </div>
                        <span className="font-extrabold text-lg tracking-tight text-white">
                            Convo<span className="text-indigo-400">Mate</span>
                        </span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            <span>Dashboard</span>
                        </Link>

                        <Link
                            href="/register"
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition shadow-sm active:scale-95"
                        >
                            Start Speaking
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 md:py-14 flex-1">
                {/* Header Tag */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
                        <ShieldCheck className="h-4 w-4" />
                        <span>Officially Verified Public Credential</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                        Language Proficiency Credential
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-lg mx-auto">
                        This digital record certifies active spoken English practice hours, international partner diversity, and rubric assessments.
                    </p>
                </div>

                {/* Credential Certificate Card */}
                <div className="relative rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-10 border border-indigo-500/30 shadow-2xl overflow-hidden ring-1 ring-white/10">
                    {/* Glowing corner gradients */}
                    <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

                    {/* Top Row: User Identity */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 pb-6 border-b border-white/10 relative z-10 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="h-16 w-16 rounded-full object-cover ring-4 ring-indigo-500/40 shadow-lg"
                                />
                            ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-xl font-bold text-white ring-4 ring-indigo-500/40 shadow-lg">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            )}

                            <div>
                                <div className="flex items-center justify-center sm:justify-start gap-2">
                                    <h2 className="text-xl sm:text-2xl font-black text-white">{user.name}</h2>
                                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                                </div>
                                <p className="text-xs sm:text-sm text-indigo-300 font-medium mt-0.5">
                                    {t(fluency.title_key, fluency.default_title)} · Level {fluency.level}
                                </p>
                                {user.city && (
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        📍 {user.city}, {user.country_code}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Level Emblem */}
                        <div className="flex flex-col items-center">
                            <span className="text-4xl filter drop-shadow-md">{fluency.badge}</span>
                            <span className="text-[11px] font-bold text-amber-300 mt-1 uppercase tracking-wider">
                                Level {fluency.level}
                            </span>
                        </div>
                    </div>

                    {/* Metric Cards Grid */}
                    <div className="grid grid-cols-3 gap-3 my-6 relative z-10">
                        <div className="rounded-2xl bg-white/5 p-4 border border-white/5 text-center">
                            <Clock className="h-5 w-5 mx-auto mb-1 text-indigo-300" />
                            <div className="text-lg sm:text-xl font-black text-white">{fluency.total_minutes}m</div>
                            <div className="text-[11px] text-slate-400">Total Speaking</div>
                        </div>

                        <div className="rounded-2xl bg-white/5 p-4 border border-white/5 text-center">
                            <Sparkles className="h-5 w-5 mx-auto mb-1 text-amber-300" />
                            <div className="text-lg sm:text-xl font-black text-white">{fluency.total_sessions}</div>
                            <div className="text-[11px] text-slate-400">Sessions Finished</div>
                        </div>

                        <div className="rounded-2xl bg-white/5 p-4 border border-white/5 text-center">
                            <Globe className="h-5 w-5 mx-auto mb-1 text-emerald-300" />
                            <div className="text-lg sm:text-xl font-black text-white">{passport.countries_count}</div>
                            <div className="text-[11px] text-slate-400">Countries Met</div>
                        </div>
                    </div>

                    {/* Teacher Assessment Rubric */}
                    {latest_assessment ? (
                        <div className="rounded-2xl bg-slate-900/90 p-5 border border-indigo-500/20 relative z-10 my-6 shadow-inner">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                                        Certified Teacher Rubric (CEFR / IELTS Scale)
                                    </span>
                                    <div className="text-xs text-slate-300">
                                        Assessed by <span className="font-semibold text-white">{latest_assessment.teacher_name}</span> on {latest_assessment.assessed_at}
                                    </div>
                                </div>
                                <div className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-sm shadow-md">
                                    Overall Band {latest_assessment.overall_score.toFixed(1)}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                                <div className="bg-white/5 p-3 rounded-xl text-center border border-white/5">
                                    <div className="text-[10px] text-slate-400 mb-0.5">Fluency</div>
                                    <div className="text-base font-black text-amber-300">
                                        {latest_assessment.fluency_score.toFixed(1)}
                                    </div>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl text-center border border-white/5">
                                    <div className="text-[10px] text-slate-400 mb-0.5">Lexical</div>
                                    <div className="text-base font-black text-amber-300">
                                        {latest_assessment.lexical_score.toFixed(1)}
                                    </div>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl text-center border border-white/5">
                                    <div className="text-[10px] text-slate-400 mb-0.5">Grammar</div>
                                    <div className="text-base font-black text-amber-300">
                                        {latest_assessment.grammar_score.toFixed(1)}
                                    </div>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl text-center border border-white/5">
                                    <div className="text-[10px] text-slate-400 mb-0.5">Pronunciation</div>
                                    <div className="text-base font-black text-amber-300">
                                        {latest_assessment.pronunciation_score.toFixed(1)}
                                    </div>
                                </div>
                            </div>

                            {latest_assessment.teacher_notes && (
                                <div className="mt-3.5 pt-3 border-t border-white/5 text-xs text-slate-300 italic">
                                    "{latest_assessment.teacher_notes}"
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-2xl bg-white/5 p-5 border border-white/5 text-center text-xs text-slate-400 my-6">
                            Practice ongoing — certified rubric evaluation updates after completed live sessions.
                        </div>
                    )}

                    {/* Passport Stamps Display */}
                    {passport.stamps && passport.stamps.length > 0 && (
                        <div className="my-4 pt-3 border-t border-white/10 relative z-10">
                            <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                                Speaking Passport Nations Explored:
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {passport.stamps.map((stamp, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs"
                                    >
                                        <span className="text-sm">{stamp.flag}</span>
                                        <span className="text-slate-200 font-medium">{stamp.country_name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Certificate Footer */}
                    <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 relative z-10">
                        <div>
                            <span>Issued: {verified_at}</span>
                            <span className="mx-2">·</span>
                            <span>ID: {user.short_id || user.id.slice(0, 8)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                            <Check className="h-4 w-4" />
                            <span>Digital Signature Valid</span>
                        </div>
                    </div>
                </div>

                {/* Share Controls */}
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                        onClick={handleCopy}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white transition active:scale-95 shadow-lg shadow-indigo-600/30"
                    >
                        {copied ? (
                            <>
                                <Check className="h-4 w-4 text-emerald-300" />
                                <span>Verification Link Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="h-4 w-4" />
                                <span>Copy Verification Link</span>
                            </>
                        )}
                    </button>

                    <a
                        href={telegramShareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-semibold transition"
                    >
                        <Send className="h-4 w-4" />
                        <span>Share on Telegram</span>
                    </a>

                    <a
                        href={linkedinShareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold transition"
                    >
                        <Share2 className="h-4 w-4" />
                        <span>Share on LinkedIn</span>
                    </a>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
                <div className="max-w-5xl mx-auto px-4">
                    © {new Date().getFullYear()} ConvoMate. All rights reserved. Verified Spoken Fluency Credentials.
                </div>
            </footer>
        </div>
    );
}
