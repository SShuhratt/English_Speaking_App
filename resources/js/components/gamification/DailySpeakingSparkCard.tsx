import React from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { Sparkles, MessageCircle, Users, Lightbulb, ArrowRight } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface DailySparkData {
    question_key: string;
    default_question: string;
    category_key: string;
    default_category: string;
    tip_key: string;
    default_tip: string;
}

export default function DailySpeakingSparkCard({ spark }: { spark: DailySparkData }) {
    const { t } = useTranslation();

    const question = t(spark.question_key) || spark.default_question;
    const category = t(spark.category_key) || spark.default_category;
    const tip = t(spark.tip_key) || spark.default_tip;

    return (
        <div className="shadow-ambient relative overflow-hidden rounded-3xl border border-[#c6c5d0]/30 bg-gradient-to-br from-[#061445]/5 via-white to-amber-50/30 p-6 md:p-8 transition-all hover:border-[#061445]/20">
            {/* Top Row: Badge & Category */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-400/20 text-amber-600">
                        <Sparkles className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-bold text-[#061445] uppercase tracking-wider">
                        {t('gamification.daily_spark_badge')}
                    </span>
                </div>

                <span className="rounded-full bg-[#061445]/10 px-3 py-1 text-xs font-semibold text-[#061445]">
                    {category}
                </span>
            </div>

            {/* Prompt Text */}
            <div className="mt-4">
                <h3 className="text-lg md:text-xl font-bold leading-snug text-[#1b1b1f]">
                    "{question}"
                </h3>
            </div>

            {/* Speaking Pro Tip */}
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-amber-100/60 p-3.5 text-xs text-amber-900">
                <Lightbulb className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                    <span className="font-bold">{t('gamification.pro_speaking_tip')}: </span>
                    <span>{tip}</span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                    href="/pupil/teachers"
                    className="flex items-center gap-1.5 rounded-full bg-[#061445] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#061445]/10 transition hover:-translate-y-0.5 hover:bg-[#061445]/90"
                >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>{t('gamification.spark_practice_btn')}</span>
                </Link>

                <Link
                    href="/speaking"
                    className="flex items-center gap-1.5 rounded-full border border-[#061445]/20 bg-white px-4 py-2.5 text-xs font-bold text-[#061445] shadow-xs transition hover:bg-slate-50"
                >
                    <Users className="h-3.5 w-3.5 text-amber-500" />
                    <span>{t('gamification.spark_peer_btn')}</span>
                </Link>
            </div>
        </div>
    );
}
