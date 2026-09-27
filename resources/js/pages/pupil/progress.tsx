import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router, Link } from '@inertiajs/react';
import {
    Pencil,
    Check,
    Flag,
    X,
    Sparkles,
    Award,
    Shield,
    Calendar,
    ArrowRight,
    BookOpen,
    Clock,
    Globe,
    Star,
    ChevronDown,
    ChevronUp,
    MessageSquare,
    User,
    CheckCircle2,
} from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { toast } from 'sonner';

import FluencyLevelBadge from '@/components/gamification/FluencyLevelBadge';
import StreakFlameBadge from '@/components/gamification/StreakFlameBadge';
import SpeakingPassportCard from '@/components/gamification/SpeakingPassportCard';
import MilestoneBadgesCard from '@/components/gamification/MilestoneBadgesCard';
import XpStoreModal from '@/components/gamification/XpStoreModal';
import VerifiedFluencyCardModal from '@/components/gamification/VerifiedFluencyCardModal';

export interface AssessmentRecord {
    id: string;
    overall_score: number;
    fluency_score: number;
    lexical_score: number;
    grammar_score: number;
    pronunciation_score: number;
    teacher_notes?: string | null;
    assessed_at: string;
    teacher: {
        id?: string;
        name: string;
        avatar?: string | null;
    };
}

interface Props {
    progress: {
        completed_sessions: number;
        minutes_spoken: number;
        teachers_tried: number;
        weekly_goal: number;
        weekly_goals?: number[];
    };
    gamification?: {
        fluency: any;
        streak: any;
        momentum: any;
        passport: any;
        badges: any;
        xp_store: any;
        credential: any;
    };
    assessments?: AssessmentRecord[];
}

export default function Progress({ progress, gamification, assessments = [] }: Props) {
    const { t } = useTranslation();

    // Default 4-week goals from props or fallback
    const initialWeeklyGoals =
        progress.weekly_goals && progress.weekly_goals.length === 4
            ? progress.weekly_goals
            : [
                  progress.weekly_goal || 2,
                  progress.weekly_goal || 2,
                  progress.weekly_goal || 2,
                  progress.weekly_goal || 2,
              ];

    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [week1Input, setWeek1Input] = useState(initialWeeklyGoals[0].toString());
    const [week2Input, setWeek2Input] = useState(initialWeeklyGoals[1].toString());
    const [week3Input, setWeek3Input] = useState(initialWeeklyGoals[2].toString());
    const [week4Input, setWeek4Input] = useState(initialWeeklyGoals[3].toString());
    const [submitting, setSubmitting] = useState(false);

    // Stage 4 Gamification Modals
    const [isXpStoreOpen, setIsXpStoreOpen] = useState(false);
    const [isCredentialOpen, setIsCredentialOpen] = useState(false);
    const [isAssessmentHistoryOpen, setIsAssessmentHistoryOpen] = useState(false);

    const handleSaveGoals = (e: React.FormEvent) => {
        e.preventDefault();
        const w1 = parseInt(week1Input.trim(), 10);
        const w2 = parseInt(week2Input.trim(), 10);
        const w3 = parseInt(week3Input.trim(), 10);
        const w4 = parseInt(week4Input.trim(), 10);

        const goals = [w1, w2, w3, w4];

        for (let i = 0; i < goals.length; i++) {
            if (isNaN(goals[i]) || goals[i] <= 0) {
                toast.error(
                    t('progress.positive_goal_error') ||
                        `Please enter a positive integer for Week ${i + 1} goal.`
                );
                return;
            }
            if (goals[i] > 350) {
                toast.error(
                    t('progress.unrealistic_goal') ||
                        'Respect to huge goals! But be a realist like the developer!'
                );
                return;
            }
        }

        setSubmitting(true);
        router.post(
            '/pupil/progress/goal',
            {
                weekly_goal: goals[0],
                weekly_goals: goals,
            },
            {
                onSuccess: () => {
                    toast.success(
                        t('progress.goal_updated_success') ||
                            'Weekly goals updated successfully!'
                    );
                    setIsGoalModalOpen(false);
                },
                onError: (errors) => {
                    toast.error(
                        errors.weekly_goals ||
                            errors.weekly_goal ||
                            'Failed to update goal'
                    );
                },
                onFinish: () => setSubmitting(false),
            }
        );
    };

    const completedSessions = progress.completed_sessions || 0;
    const weeklyGoals = initialWeeklyGoals;

    // Build SVG Node Points dynamically for 4 weeks
    interface CurveNode {
        id: string;
        weekIndex: number;
        sessionIndexInWeek: number;
        globalSessionIndex: number;
        isMilestone: boolean;
        x: number;
        y: number;
    }

    const curveNodes: CurveNode[] = [];
    let globalSessionCounter = 0;
    const stepX = 75;
    let currentX = 40;

    for (let w = 0; w < 4; w++) {
        const weekGoal = Math.max(1, weeklyGoals[w]);
        for (let s = 1; s <= weekGoal; s++) {
            globalSessionCounter++;
            const nodeIndex = curveNodes.length;
            const angle = nodeIndex * 0.75;
            const y = 120 + Math.sin(angle) * 45;

            curveNodes.push({
                id: `node-w${w + 1}-s${s}`,
                weekIndex: w,
                sessionIndexInWeek: s,
                globalSessionIndex: globalSessionCounter,
                isMilestone: s === weekGoal,
                x: currentX,
                y: y,
            });

            currentX += stepX;
        }
        currentX += 20;
    }

    const svgWidth = Math.max(720, currentX + 40);
    const svgHeight = 220;

    let pathD = '';
    if (curveNodes.length > 0) {
        pathD = `M ${curveNodes[0].x} ${curveNodes[0].y}`;
        for (let i = 0; i < curveNodes.length - 1; i++) {
            const p0 = curveNodes[i];
            const p1 = curveNodes[i + 1];
            const controlX = (p0.x + p1.x) / 2;
            pathD += ` C ${controlX} ${p0.y}, ${controlX} ${p1.y}, ${p1.x} ${p1.y}`;
        }
    }

    // Sessions left in current week calculation
    let currentWeekIndex = 0;
    let accumulated = 0;
    for (let w = 0; w < 4; w++) {
        if (completedSessions < accumulated + weeklyGoals[w]) {
            currentWeekIndex = w;
            break;
        }
        accumulated += weeklyGoals[w];
    }
    const currentWeekGoal = weeklyGoals[currentWeekIndex] || 2;
    const currentWeekCompleted = Math.max(0, completedSessions - accumulated);
    const sessionsLeftThisWeek = Math.max(0, currentWeekGoal - currentWeekCompleted);

    const latestAssessment = assessments && assessments.length > 0 ? assessments[0] : null;

    return (
        <>
            <Head title={t('progress.title') || 'My Progress'} />
            <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-8">
                {/* 1. Top Hero: Gamification Ranks & Quick Action Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-xl border border-indigo-500/20">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                                {t('progress.my_progress') || 'My Progress'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-300">
                                {t('progress.hub_badge') || 'Progress Hub'}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {gamification?.fluency && (
                                <FluencyLevelBadge fluency={gamification.fluency} />
                            )}
                            {gamification?.streak && (
                                <StreakFlameBadge streak={gamification.streak} />
                            )}
                        </div>
                    </div>

                    {/* Action Hub Buttons */}
                    <div className="flex flex-wrap items-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
                        {gamification?.xp_store && (
                            <button
                                onClick={() => setIsXpStoreOpen(true)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
                            >
                                <span>🛍️</span>
                                <span>
                                    {t('progress.xp_store_btn', {
                                        count: (gamification.xp_store.available_xp ?? 0).toLocaleString(),
                                    }) || `${gamification.xp_store.available_xp?.toLocaleString() ?? 0} XP Store`}
                                </span>
                            </button>
                        )}

                        <button
                            onClick={() => setIsCredentialOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-md shadow-indigo-600/30 active:scale-95 cursor-pointer"
                        >
                            <Award className="h-4 w-4" />
                            <span>{t('credential.view_public_btn', 'View Credential')}</span>
                        </button>
                    </div>
                </div>

                {/* 2. Main 4-Week Journey Roadmap Container */}
                <div className="rounded-3xl border border-[#E8E4D8] bg-white p-6 shadow-sm md:p-8">
                    {/* Top Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="inline-block h-5 w-2 rounded-sm bg-[#1E2A5A]"></span>
                            <h2 className="text-lg font-bold text-[#1E2A5A]">
                                {t('progress.roadmap_title') || '4-Week Speaking Journey'}
                            </h2>
                        </div>
                        <button
                            onClick={() => {
                                setWeek1Input(weeklyGoals[0].toString());
                                setWeek2Input(weeklyGoals[1].toString());
                                setWeek3Input(weeklyGoals[2].toString());
                                setWeek4Input(weeklyGoals[3].toString());
                                setIsGoalModalOpen(true);
                            }}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#E8E4D8] px-3.5 py-1.5 text-xs font-semibold text-[#1E2A5A] transition hover:bg-[#FDF9EC]"
                        >
                            {t('progress.goals_summary', {
                                w1: String(weeklyGoals[0]),
                                w2: String(weeklyGoals[1]),
                                w3: String(weeklyGoals[2]),
                                w4: String(weeklyGoals[3]),
                            }) || `Goals: W1 (${weeklyGoals[0]}) · W2 (${weeklyGoals[1]}) · W3 (${weeklyGoals[2]}) · W4 (${weeklyGoals[3]})`}
                            <Pencil className="h-3 w-3 text-[#888780]" />
                        </button>
                    </div>

                    {/* Summary Stats Grid */}
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-[#FDF9EC] p-3.5">
                            <p className="text-[11.5px] font-semibold text-[#854F0B]">
                                {t('progress.sessions_completed') || 'Sessions completed'}
                            </p>
                            <p className="mt-0.5 text-2xl font-bold text-[#1E2A5A]">
                                {completedSessions}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-[#EEF4FB] p-3.5">
                            <p className="text-[11.5px] font-semibold text-[#185FA5]">
                                {t('progress.minutes_spoken') || 'Minutes spoken'}
                            </p>
                            <p className="mt-0.5 text-2xl font-bold text-[#1E2A5A]">
                                {progress.minutes_spoken}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-[#F4F1E8] p-3.5">
                            <p className="text-[11.5px] font-semibold text-[#5F5E5A]">
                                {t('progress.teachers_tried') || 'Teachers tried'}
                            </p>
                            <p className="mt-0.5 text-2xl font-bold text-[#1E2A5A]">
                                {progress.teachers_tried}
                            </p>
                        </div>
                    </div>

                    {/* Dynamic 4-Week SVG Journey Map Curve */}
                    <div className="mt-6 overflow-x-auto pb-4">
                        <div style={{ minWidth: `${svgWidth}px` }}>
                            <svg
                                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                                className="w-full"
                                role="img"
                                aria-label="Dynamic 4-week roadmap graph"
                            >
                                {pathD && (
                                    <path
                                        d={pathD}
                                        fill="none"
                                        stroke="#E8E4D8"
                                        strokeWidth="5"
                                        strokeLinecap="round"
                                        strokeDasharray="2 10"
                                    />
                                )}

                                {curveNodes.map((node) => {
                                    const isDone = node.globalSessionIndex <= completedSessions;
                                    const isNextUp = node.globalSessionIndex === completedSessions + 1;

                                    if (node.isMilestone) {
                                        return (
                                            <g key={node.id}>
                                                <rect
                                                    x={node.x - 20}
                                                    y={node.y - 20}
                                                    width="40"
                                                    height="40"
                                                    rx="12"
                                                    fill={isDone ? '#1D9E75' : isNextUp ? '#F7DE8B' : '#FFFFFF'}
                                                    stroke={isDone || isNextUp ? 'none' : '#E8E4D8'}
                                                    strokeWidth="1.5"
                                                    className="transition-colors duration-300"
                                                />
                                                <text
                                                    x={node.x}
                                                    y={node.y + 5}
                                                    textAnchor="middle"
                                                    fill={isDone ? '#FFFFFF' : isNextUp ? '#1E2A5A' : '#B4B2A9'}
                                                    fontSize="15"
                                                    fontWeight="bold"
                                                >
                                                    {isDone ? '✓' : '⚑'}
                                                </text>
                                                <text
                                                    x={node.x}
                                                    y={node.y - 28}
                                                    textAnchor="middle"
                                                    fill={isDone ? '#0F6E56' : isNextUp ? '#854F0B' : '#B4B2A9'}
                                                    fontSize="11"
                                                    fontWeight="600"
                                                >
                                                    {isDone
                                                        ? t('progress.week_done', { week: String(node.weekIndex + 1) }) || `Week ${node.weekIndex + 1} done`
                                                        : t('progress.week_goal', { week: String(node.weekIndex + 1) }) || `Week ${node.weekIndex + 1} goal`}
                                                </text>
                                                {isNextUp && (
                                                    <text
                                                        x={node.x}
                                                        y={node.y + 32}
                                                        textAnchor="middle"
                                                        fill="#1E2A5A"
                                                        fontSize="10"
                                                        fontWeight="700"
                                                    >
                                                        {t('progress.you_are_here') || 'You are here'}
                                                    </text>
                                                )}
                                            </g>
                                        );
                                    }

                                    return (
                                        <g key={node.id}>
                                            {isNextUp && (
                                                <circle
                                                    cx={node.x}
                                                    cy={node.y}
                                                    r="20"
                                                    fill="none"
                                                    stroke="#F7DE8B"
                                                    strokeWidth="2.5"
                                                />
                                            )}
                                            <circle
                                                cx={node.x}
                                                cy={node.y}
                                                r="14"
                                                fill={isDone || isNextUp ? '#1E2A5A' : '#FFFFFF'}
                                                stroke={isDone || isNextUp ? 'none' : '#D3D1C7'}
                                                strokeWidth="1.5"
                                            />
                                            <text
                                                x={node.x}
                                                y={node.y + 4}
                                                textAnchor="middle"
                                                fill={isDone || isNextUp ? '#FFFFFF' : '#888780'}
                                                fontSize="12"
                                                fontWeight="600"
                                            >
                                                {node.sessionIndexInWeek}
                                            </text>
                                            {isNextUp && (
                                                <text
                                                    x={node.x}
                                                    y={node.y + 32}
                                                    textAnchor="middle"
                                                    fill="#1E2A5A"
                                                    fontSize="10"
                                                    fontWeight="700"
                                                >
                                                    {t('progress.you_are_here') || 'You are here'}
                                                </text>
                                            )}
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                    </div>

                    {/* Bottom Action Banner */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#FDF9EC] p-3.5">
                        <p className="m-0 text-xs font-medium text-[#1E2A5A]">
                            {sessionsLeftThisWeek === 1
                                ? t('progress.one_session_left', '1 session left to finish this week')
                                : t(
                                      'progress.sessions_left',
                                      { count: String(sessionsLeftThisWeek) },
                                      `${sessionsLeftThisWeek} sessions left to finish this week`
                                  )}
                            {' — '}
                            <span className="text-[#5F5E5A]">
                                {t('progress.book_with_teacher_free', 'book your next session with a top teacher')}
                            </span>
                        </p>
                        <Link
                            href="/pupil/teachers"
                            className="rounded-full bg-[#1E2A5A] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#061445]"
                        >
                            {t('progress.book_it') || 'Book it'}
                        </Link>
                    </div>
                </div>

                {/* 3. Teacher Rubric Evaluations & Fluency Breakdown */}
                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="inline-block h-5 w-2 rounded-sm bg-indigo-600"></span>
                                <h2 className="text-lg font-bold text-slate-900">
                                    {t('progress.assessment_history_title', 'Teacher Rubric Evaluations')}
                                </h2>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {t(
                                    'progress.assessment_history_subtitle',
                                    'Official CEFR & IELTS rubric scores and personalized recommendations from certified teachers'
                                )}
                            </p>
                        </div>

                        {assessments.length > 1 && (
                            <button
                                onClick={() => setIsAssessmentHistoryOpen(!isAssessmentHistoryOpen)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                            >
                                <span>{t('progress.view_all_assessments', { count: String(assessments.length) })}</span>
                                {isAssessmentHistoryOpen ? (
                                    <ChevronUp className="h-3.5 w-3.5" />
                                ) : (
                                    <ChevronDown className="h-3.5 w-3.5" />
                                )}
                            </button>
                        )}
                    </div>

                    {latestAssessment ? (
                        <div className="mt-6 space-y-6">
                            {/* Spotlight Card on Latest Assessment */}
                            <div className="rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-amber-50/40 p-5 md:p-6 border border-indigo-100">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-indigo-100/70">
                                    <div className="flex items-center gap-3">
                                        {latestAssessment.teacher.avatar ? (
                                            <img
                                                src={latestAssessment.teacher.avatar}
                                                alt={latestAssessment.teacher.name}
                                                className="h-11 w-11 rounded-full object-cover ring-2 ring-indigo-500/20"
                                            />
                                        ) : (
                                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-sm">
                                                {latestAssessment.teacher.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                                                {t('progress.latest_official_evaluation', 'Latest Official Evaluation')}
                                            </span>
                                            <h3 className="text-sm font-bold text-slate-900">
                                                {latestAssessment.teacher.name}
                                            </h3>
                                            <span className="text-[11px] text-slate-400">
                                                {latestAssessment.assessed_at}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Overall Band Pill */}
                                    <div className="flex items-center gap-2">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                                {t('progress.latest_band_score', 'Latest Overall Band')}
                                            </span>
                                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-base shadow-xs">
                                                <Sparkles className="h-3.5 w-3.5" />
                                                <span>Band {latestAssessment.overall_score.toFixed(1)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 4 Criteria Comparative Score Cards */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
                                    <div className="rounded-xl bg-white p-3.5 border border-slate-100 shadow-xs text-center">
                                        <span className="text-[11px] font-medium text-slate-500 block mb-1">
                                            {t('assessment.fluency', 'Fluency & Coherence')}
                                        </span>
                                        <div className="text-xl font-black text-indigo-900">
                                            {latestAssessment.fluency_score.toFixed(1)}
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-mono">/ 9.0</span>
                                    </div>

                                    <div className="rounded-xl bg-white p-3.5 border border-slate-100 shadow-xs text-center">
                                        <span className="text-[11px] font-medium text-slate-500 block mb-1">
                                            {t('assessment.lexical', 'Lexical Resource')}
                                        </span>
                                        <div className="text-xl font-black text-indigo-900">
                                            {latestAssessment.lexical_score.toFixed(1)}
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-mono">/ 9.0</span>
                                    </div>

                                    <div className="rounded-xl bg-white p-3.5 border border-slate-100 shadow-xs text-center">
                                        <span className="text-[11px] font-medium text-slate-500 block mb-1">
                                            {t('assessment.grammar', 'Grammatical Accuracy')}
                                        </span>
                                        <div className="text-xl font-black text-indigo-900">
                                            {latestAssessment.grammar_score.toFixed(1)}
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-mono">/ 9.0</span>
                                    </div>

                                    <div className="rounded-xl bg-white p-3.5 border border-slate-100 shadow-xs text-center">
                                        <span className="text-[11px] font-medium text-slate-500 block mb-1">
                                            {t('assessment.pronunciation', 'Pronunciation')}
                                        </span>
                                        <div className="text-xl font-black text-indigo-900">
                                            {latestAssessment.pronunciation_score.toFixed(1)}
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-mono">/ 9.0</span>
                                    </div>
                                </div>

                                {latestAssessment.teacher_notes && (
                                    <div className="rounded-xl bg-white/80 p-3.5 border border-indigo-100/80 text-xs text-slate-700">
                                        <span className="font-bold text-indigo-950 block mb-1">
                                            {t('progress.teacher_notes_label', 'Teacher Recommendation')}:
                                        </span>
                                        <p className="italic text-slate-600 leading-relaxed">
                                            "{latestAssessment.teacher_notes}"
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Historical Feed of Assessments */}
                            {isAssessmentHistoryOpen && assessments.length > 1 && (
                                <div className="space-y-3 pt-2">
                                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        {t('progress.previous_assessments', 'Previous Rubric Assessments')}
                                    </h4>
                                    <div className="space-y-3">
                                        {assessments.slice(1).map((record) => (
                                            <div
                                                key={record.id}
                                                className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition hover:bg-white hover:shadow-xs"
                                            >
                                                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                                                    <div className="flex items-center gap-2.5">
                                                        {record.teacher.avatar ? (
                                                            <img
                                                                src={record.teacher.avatar}
                                                                alt={record.teacher.name}
                                                                className="h-8 w-8 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                                                                {record.teacher.name.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <span className="text-xs font-bold text-slate-900">
                                                                {record.teacher.name}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 ml-2">
                                                                {record.assessed_at}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black text-xs">
                                                        Band {record.overall_score.toFixed(1)}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-4 gap-2 text-center text-xs mt-3">
                                                    <div className="bg-white rounded-lg p-1.5 border border-slate-100">
                                                        <span className="text-[10px] text-slate-400 block">{t('assessment.fluency_short', 'Fluency')}</span>
                                                        <span className="font-bold text-indigo-900">{record.fluency_score.toFixed(1)}</span>
                                                    </div>
                                                    <div className="bg-white rounded-lg p-1.5 border border-slate-100">
                                                        <span className="text-[10px] text-slate-400 block">{t('assessment.lexical_short', 'Lexical')}</span>
                                                        <span className="font-bold text-indigo-900">{record.lexical_score.toFixed(1)}</span>
                                                    </div>
                                                    <div className="bg-white rounded-lg p-1.5 border border-slate-100">
                                                        <span className="text-[10px] text-slate-400 block">{t('assessment.grammar_short', 'Grammar')}</span>
                                                        <span className="font-bold text-indigo-900">{record.grammar_score.toFixed(1)}</span>
                                                    </div>
                                                    <div className="bg-white rounded-lg p-1.5 border border-slate-100">
                                                        <span className="text-[10px] text-slate-400 block">{t('assessment.pronunciation_short', 'Pronunciation')}</span>
                                                        <span className="font-bold text-indigo-900">{record.pronunciation_score.toFixed(1)}</span>
                                                    </div>
                                                </div>

                                                {record.teacher_notes && (
                                                    <p className="mt-2 text-xs italic text-slate-500 pl-2 border-l-2 border-slate-300">
                                                        "{record.teacher_notes}"
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center my-6">
                            <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                                <Award className="h-6 w-6" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 mb-1">
                                {t('progress.assessment_empty_title', 'Ready for an Official Rubric Assessment?')}
                            </h3>
                            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4 leading-relaxed">
                                {t(
                                    'progress.no_assessments',
                                    'No teacher assessments yet. Book a session with a teacher to receive your first official rubric evaluation!'
                                )}
                            </p>
                            <Link
                                href="/pupil/teachers"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm"
                            >
                                <span>{t('progress.book_lesson_btn', 'Book a Lesson')}</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    )}
                </div>

                {/* 4. Speaking Passport & International Network */}
                {gamification?.passport && (
                    <SpeakingPassportCard passport={gamification.passport} />
                )}

                {/* 5. Milestone Badges Trophy Case */}
                {gamification?.badges && (
                    <MilestoneBadgesCard badges={gamification.badges} />
                )}
            </div>

            {/* Modals */}
            <XpStoreModal
                isOpen={isXpStoreOpen}
                onClose={() => setIsXpStoreOpen(false)}
                catalog={gamification?.xp_store}
            />

            <VerifiedFluencyCardModal
                isOpen={isCredentialOpen}
                onClose={() => setIsCredentialOpen(false)}
                credential={gamification?.credential}
            />

            {/* 4-Week Goal Edit Modal */}
            {isGoalModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="relative mx-4 flex w-full max-w-md flex-col rounded-3xl border border-[#E8E4D8] bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[#E8E4D8]/60 pb-3">
                            <h3 className="text-lg font-bold text-[#1E2A5A]">
                                {t('progress.modal_goals_title', 'Set 4-Week Session Goals')}
                            </h3>
                            <button
                                onClick={() => setIsGoalModalOpen(false)}
                                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveGoals} className="mt-4 space-y-4">
                            <p className="text-xs font-medium text-slate-500">
                                {t(
                                    'progress.modal_goals_desc',
                                    'Configure the number of session checkpoints for each week (1 to 350 sessions/week).'
                                )}
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-[#1E2A5A]">
                                        {t('progress.week_n_goal', { week: '1' }) || 'Week 1 Goal'}
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="350"
                                        value={week1Input}
                                        onChange={(e) => setWeek1Input(e.target.value)}
                                        className="mt-1.5 w-full rounded-2xl border border-[#E8E4D8] bg-[#FDF9EC]/50 px-4 py-2.5 text-sm font-bold text-[#1E2A5A] focus:border-[#1E2A5A] focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#1E2A5A]">
                                        {t('progress.week_n_goal', { week: '2' }) || 'Week 2 Goal'}
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="350"
                                        value={week2Input}
                                        onChange={(e) => setWeek2Input(e.target.value)}
                                        className="mt-1.5 w-full rounded-2xl border border-[#E8E4D8] bg-[#FDF9EC]/50 px-4 py-2.5 text-sm font-bold text-[#1E2A5A] focus:border-[#1E2A5A] focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#1E2A5A]">
                                        {t('progress.week_n_goal', { week: '3' }) || 'Week 3 Goal'}
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="350"
                                        value={week3Input}
                                        onChange={(e) => setWeek3Input(e.target.value)}
                                        className="mt-1.5 w-full rounded-2xl border border-[#E8E4D8] bg-[#FDF9EC]/50 px-4 py-2.5 text-sm font-bold text-[#1E2A5A] focus:border-[#1E2A5A] focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#1E2A5A]">
                                        {t('progress.week_n_goal', { week: '4' }) || 'Week 4 Goal'}
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="350"
                                        value={week4Input}
                                        onChange={(e) => setWeek4Input(e.target.value)}
                                        className="mt-1.5 w-full rounded-2xl border border-[#E8E4D8] bg-[#FDF9EC]/50 px-4 py-2.5 text-sm font-bold text-[#1E2A5A] focus:border-[#1E2A5A] focus:outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 border-t border-[#E8E4D8]/60 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setIsGoalModalOpen(false)}
                                    className="rounded-xl border border-[#E8E4D8] px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                >
                                    {t('progress.cancel_btn', 'Cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-xl bg-[#1E2A5A] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#061445] disabled:opacity-50"
                                >
                                    {submitting
                                        ? t('progress.saving', 'Saving...')
                                        : t('progress.save_goals', 'Save Goals')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

Progress.layout = {
    breadcrumbs: [{ title: 'my progress', href: '/pupil/progress' }],
};
