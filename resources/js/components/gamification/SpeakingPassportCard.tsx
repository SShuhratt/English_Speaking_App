import React from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { Globe, Compass, Users, MapPin, Award } from 'lucide-react';

export interface SpeakingPassportData {
    unique_partners_count: number;
    countries_count: number;
    passport_rank_key: string;
    passport_rank_default: string;
    stamps: Array<{
        country_code: string;
        name_key: string;
        default_name: string;
        flag: string;
        partner_count: number;
    }>;
}

interface Props {
    passport: SpeakingPassportData;
    compact?: boolean;
}

export default function SpeakingPassportCard({ passport, compact = false }: Props) {
    const { t } = useTranslation();

    const rankTitle = t(passport.passport_rank_key) || passport.passport_rank_default;
    const stamps = passport.stamps || [];

    return (
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-[#0c162d] via-[#102042] to-[#162a56] p-6 text-white shadow-xl shadow-slate-900/10 dark:border-white/10 dark:from-[#090f20] dark:via-[#0c152c] dark:to-[#121c38]">
            {/* Subtle passport watermark */}
            <div className="pointer-events-none absolute -right-8 -top-8 text-amber-400/5 select-none">
                <Compass className="h-48 w-48" />
            </div>

            {/* Header: Passport Emblem & Rank */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-300/30 text-amber-300 shadow-inner border border-amber-400/30">
                        <Globe className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                                {t('gamification.passport_title') || 'Speaking Passport'}
                            </span>
                            <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-400/30">
                                Official
                            </span>
                        </div>
                        <h3 className="text-lg font-black tracking-tight text-white">
                            {rankTitle}
                        </h3>
                    </div>
                </div>

                {/* Quick stats pills */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 border border-white/10">
                        <Users className="h-3.5 w-3.5 text-amber-400" />
                        <span>{passport.unique_partners_count}</span>
                        <span className="text-[10px] text-slate-400">
                            {t('gamification.passport_partners') || 'Partners'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 border border-white/10">
                        <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{passport.countries_count}</span>
                        <span className="text-[10px] text-slate-400">
                            {t('gamification.passport_countries') || 'Countries'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stamps Booklet Section */}
            <div className="relative z-10 pt-5">
                <div className="mb-3 flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="uppercase tracking-wider text-[11px] text-amber-300/80">
                        {t('gamification.passport_stamps') || 'Passport Stamps'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                        {stamps.length} {t('gamification.passport_countries') || 'collected'}
                    </span>
                </div>

                {stamps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-amber-300/60">
                            <Compass className="h-5 w-5" />
                        </div>
                        <p className="max-w-xs text-xs font-medium text-slate-300">
                            {t('gamification.passport_empty') || 'Connect with speaking partners to collect your first country stamp!'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {stamps.map((stamp) => {
                            const countryName = t(stamp.name_key) || stamp.default_name;
                            return (
                                <div
                                    key={stamp.country_code}
                                    className="group relative flex flex-col items-center justify-center rounded-2xl border border-amber-400/25 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-3 text-center backdrop-blur-xs transition-all duration-300 hover:border-amber-400/50 hover:bg-white/[0.1] hover:scale-[1.02]"
                                >
                                    {/* Flag & Stamp Badge */}
                                    <span className="text-2xl drop-shadow-md transition-transform group-hover:scale-110">
                                        {stamp.flag}
                                    </span>
                                    <span className="mt-1.5 truncate text-xs font-bold text-white max-w-full">
                                        {countryName}
                                    </span>
                                    <span className="mt-0.5 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-400/20">
                                        {stamp.partner_count} {stamp.partner_count === 1 ? 'connection' : 'connections'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
