import React, { useState } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import {
    X,
    Award,
    Sparkles,
    Check,
    AlertCircle,
    Loader2,
    BookOpen,
    MessageSquare,
} from 'lucide-react';

export interface AssessmentData {
    id?: string;
    fluency_score: number;
    lexical_score: number;
    grammar_score: number;
    pronunciation_score: number;
    overall_score?: number;
    teacher_notes?: string | null;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    appointmentId: string;
    pupilName: string;
    pupilAvatar?: string | null;
    initialData?: AssessmentData | null;
    onSaved?: (assessment: AssessmentData) => void;
}

export default function TeacherAssessmentSliderModal({
    isOpen,
    onClose,
    appointmentId,
    pupilName,
    pupilAvatar,
    initialData,
    onSaved,
}: Props) {
    const { t } = useTranslation();

    const [fluency, setFluency] = useState<number>(initialData?.fluency_score ?? 6.0);
    const [lexical, setLexical] = useState<number>(initialData?.lexical_score ?? 6.0);
    const [grammar, setGrammar] = useState<number>(initialData?.grammar_score ?? 6.0);
    const [pronunciation, setPronunciation] = useState<number>(initialData?.pronunciation_score ?? 6.0);
    const [notes, setNotes] = useState<string>(initialData?.teacher_notes ?? '');

    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Sync state when initialData changes
    React.useEffect(() => {
        if (initialData) {
            setFluency(initialData.fluency_score ?? 6.0);
            setLexical(initialData.lexical_score ?? 6.0);
            setGrammar(initialData.grammar_score ?? 6.0);
            setPronunciation(initialData.pronunciation_score ?? 6.0);
            setNotes(initialData.teacher_notes ?? '');
        }
    }, [initialData]);

    if (!isOpen) return null;

    // Calculate overall band rounded to nearest 0.5
    const overallBand = Math.round(((fluency + lexical + grammar + pronunciation) / 4) * 2) / 2;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setSuccessMsg(null);
        setSubmitting(true);

        try {
            const csrfToken =
                (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

            const res = await fetch(`/teacher/appointments/${appointmentId}/assess`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    fluency_score: fluency,
                    lexical_score: lexical,
                    grammar_score: grammar,
                    pronunciation_score: pronunciation,
                    teacher_notes: notes.trim() || null,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMsg(data.message || 'Failed to submit assessment.');
                setSubmitting(false);
                return;
            }

            setSuccessMsg(t('assessment.success', 'Assessment saved successfully!'));
            if (onSaved && data.assessment) {
                onSaved(data.assessment);
            }

            setTimeout(() => {
                onClose();
            }, 1200);
        } catch {
            setErrorMsg('Network error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const criteria = [
        {
            key: 'fluency',
            label: t('assessment.fluency', 'Fluency & Coherence'),
            hint: t('assessment.fluency_hint', 'Speech flow, hesitation, and natural conversational rhythm'),
            value: fluency,
            setter: setFluency,
        },
        {
            key: 'lexical',
            label: t('assessment.lexical', 'Lexical Resource'),
            hint: t('assessment.lexical_hint', 'Range of vocabulary, idioms, and natural phrasing'),
            value: lexical,
            setter: setLexical,
        },
        {
            key: 'grammar',
            label: t('assessment.grammar', 'Grammatical Range & Accuracy'),
            hint: t('assessment.grammar_hint', 'Sentence structures, tenses, and structural variety'),
            value: grammar,
            setter: setGrammar,
        },
        {
            key: 'pronunciation',
            label: t('assessment.pronunciation', 'Pronunciation'),
            hint: t('assessment.pronunciation_hint', 'Clarity, word stress, and natural intonation'),
            value: pronunciation,
            setter: setPronunciation,
        },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Body */}
            <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-6 md:p-8 shadow-2xl ring-1 ring-slate-900/10">
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                            <Award className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                {t('assessment.title', 'Post-Lesson Fluency Assessment')}
                            </h2>
                            <p className="text-xs text-slate-500">
                                {t(
                                    'assessment.subtitle',
                                    '30-second CEFR / IELTS standard rubric rating for your student'
                                )}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Pupil Banner */}
                <div className="my-4 flex items-center justify-between rounded-2xl bg-slate-50 p-3.5 border border-slate-200/70">
                    <div className="flex items-center gap-3">
                        {pupilAvatar ? (
                            <img
                                src={pupilAvatar}
                                alt={pupilName}
                                className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-500/20"
                            />
                        ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                                {pupilName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                {t('assessment.pupil_label', 'Student')}
                            </span>
                            <div className="text-sm font-bold text-slate-900">{pupilName}</div>
                        </div>
                    </div>

                    {/* Overall Band Pill */}
                    <div className="flex flex-col items-end">
                        <span className="text-[11px] font-medium text-slate-500">
                            {t('assessment.overall_band', 'Overall Band')}
                        </span>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-600 text-white font-black text-base shadow-sm">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Band {overallBand.toFixed(1)}</span>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                {errorMsg && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}
                {successMsg && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{successMsg}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* 4 Sliders */}
                    <div className="space-y-4">
                        {criteria.map((item) => (
                            <div
                                key={item.key}
                                className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-xs"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-bold text-slate-800">
                                        {item.label}
                                    </label>
                                    <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                                        {item.value.toFixed(1)} / 9.0
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-400 mb-2">{item.hint}</p>

                                <input
                                    type="range"
                                    min="1.0"
                                    max="9.0"
                                    step="0.5"
                                    value={item.value}
                                    onChange={(e) => item.setter(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />

                                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                                    <span>1.0 Beginner</span>
                                    <span>5.0 Intermediate</span>
                                    <span>7.0 Advanced</span>
                                    <span>9.0 Expert</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Teacher Notes */}
                    <div className="pt-2">
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                            {t('assessment.notes_label', 'Teacher Feedback & Recommendations (Optional)')}
                        </label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t(
                                'assessment.notes_placeholder',
                                'Great job describing childhood memories! Practice using passive voice and third conditional next time.'
                            )}
                            className="w-full rounded-2xl border border-slate-200 p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition resize-none"
                            maxLength={1000}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition shadow-sm active:scale-95 disabled:bg-slate-300"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    <span>{t('assessment.submitting', 'Submitting...')}</span>
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4" />
                                    <span>{t('assessment.submit_btn', 'Submit Assessment')}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
