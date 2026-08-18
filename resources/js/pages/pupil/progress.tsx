import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router, Link } from '@inertiajs/react';
import { Pencil, Check, Flag, X } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { toast } from 'sonner';

interface Props {
    progress: {
        completed_sessions: number;
        minutes_spoken: number;
        teachers_tried: number;
        weekly_goal: number;
        weekly_goals?: number[];
    };
}

export default function Progress({ progress }: Props) {
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
    const [week1Input, setWeek1Input] = useState(
        initialWeeklyGoals[0].toString(),
    );
    const [week2Input, setWeek2Input] = useState(
        initialWeeklyGoals[1].toString(),
    );
    const [week3Input, setWeek3Input] = useState(
        initialWeeklyGoals[2].toString(),
    );
    const [week4Input, setWeek4Input] = useState(
        initialWeeklyGoals[3].toString(),
    );
    const [submitting, setSubmitting] = useState(false);

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
                        `Please enter a positive integer for Week ${i + 1} goal.`,
                );
                return;
            }
            if (goals[i] > 350) {
                toast.error(
                    t('progress.unrealistic_goal') ||
                        'Respect to huge goals! But be a realist like the developer!',
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
                            'Weekly goals updated successfully!',
                    );
                    setIsGoalModalOpen(false);
                },
                onError: (errors) => {
                    toast.error(
                        errors.weekly_goals ||
                            errors.weekly_goal ||
                            'Failed to update goal',
                    );
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const completedSessions = progress.completed_sessions || 0;
    const weeklyGoals = initialWeeklyGoals;

    // Calculate total planned sessions across all 4 weeks
    const totalPlannedSessions = weeklyGoals.reduce((a, b) => a + b, 0);

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
            // Oscillating wave curve calculation
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

        // Add small spacer between weeks if needed
        currentX += 20;
    }

    // Generate smooth SVG Bezier Path data string connecting all nodes
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
    const sessionsLeftThisWeek = Math.max(
        0,
        currentWeekGoal - currentWeekCompleted,
    );

    return (
        <>
            <Head title={t('progress.title') || 'My Progress'} />
            <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-8">
                {/* Main Progress Container Card */}
                <div className="rounded-3xl border border-[#E8E4D8] bg-white p-6 shadow-sm md:p-8">
                    {/* Top Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h1 className="text-xl font-bold text-[#1E2A5A]">
                            {t('progress.my_progress') || 'My progress'}
                        </h1>
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
                            Goals: W1 ({weeklyGoals[0]}) · W2 ({weeklyGoals[1]})
                            · W3 ({weeklyGoals[2]}) · W4 ({weeklyGoals[3]})
                            <Pencil className="h-3 w-3 text-[#888780]" />
                        </button>
                    </div>

                    {/* Summary Stats Grid */}
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-[#FDF9EC] p-3.5">
                            <p className="text-[11.5px] font-semibold text-[#854F0B]">
                                {t('progress.sessions_completed') ||
                                    'Sessions completed'}
                            </p>
                            <p className="mt-0.5 text-2xl font-bold text-[#1E2A5A]">
                                {completedSessions}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-[#EEF4FB] p-3.5">
                            <p className="text-[11.5px] font-semibold text-[#185FA5]">
                                {t('progress.minutes_spoken') ||
                                    'Minutes spoken'}
                            </p>
                            <p className="mt-0.5 text-2xl font-bold text-[#1E2A5A]">
                                {progress.minutes_spoken}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-[#F4F1E8] p-3.5">
                            <p className="text-[11.5px] font-semibold text-[#5F5E5A]">
                                {t('progress.teachers_tried') ||
                                    'Teachers tried'}
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
                                {/* Smooth Connecting Wave Path */}
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

                                {/* Render Checkpoint & Milestone Nodes */}
                                {curveNodes.map((node) => {
                                    const isDone =
                                        node.globalSessionIndex <=
                                        completedSessions;
                                    const isNextUp =
                                        node.globalSessionIndex ===
                                        completedSessions + 1;

                                    if (node.isMilestone) {
                                        // Week Milestone Flag Node
                                        return (
                                            <g key={node.id}>
                                                <rect
                                                    x={node.x - 20}
                                                    y={node.y - 20}
                                                    width="40"
                                                    height="40"
                                                    rx="12"
                                                    fill={
                                                        isDone
                                                            ? '#1D9E75'
                                                            : isNextUp
                                                              ? '#F7DE8B'
                                                              : '#FFFFFF'
                                                    }
                                                    stroke={
                                                        isDone || isNextUp
                                                            ? 'none'
                                                            : '#E8E4D8'
                                                    }
                                                    strokeWidth="1.5"
                                                    className="transition-colors duration-300"
                                                />
                                                <text
                                                    x={node.x}
                                                    y={node.y + 5}
                                                    textAnchor="middle"
                                                    fill={
                                                        isDone
                                                            ? '#FFFFFF'
                                                            : isNextUp
                                                              ? '#1E2A5A'
                                                              : '#B4B2A9'
                                                    }
                                                    fontSize="15"
                                                    fontWeight="bold"
                                                >
                                                    {isDone ? '✓' : '⚑'}
                                                </text>
                                                <text
                                                    x={node.x}
                                                    y={node.y - 28}
                                                    textAnchor="middle"
                                                    fill={
                                                        isDone
                                                            ? '#0F6E56'
                                                            : isNextUp
                                                              ? '#854F0B'
                                                              : '#B4B2A9'
                                                    }
                                                    fontSize="11"
                                                    fontWeight="600"
                                                >
                                                    Week {node.weekIndex + 1}{' '}
                                                    {isDone ? 'done' : 'goal'}
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
                                                        You are here
                                                    </text>
                                                )}
                                            </g>
                                        );
                                    }

                                    // Regular Session Checkpoint Node
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
                                                fill={
                                                    isDone || isNextUp
                                                        ? '#1E2A5A'
                                                        : '#FFFFFF'
                                                }
                                                stroke={
                                                    isDone || isNextUp
                                                        ? 'none'
                                                        : '#D3D1C7'
                                                }
                                                strokeWidth="1.5"
                                            />
                                            <text
                                                x={node.x}
                                                y={node.y + 4}
                                                textAnchor="middle"
                                                fill={
                                                    isDone || isNextUp
                                                        ? '#FFFFFF'
                                                        : '#888780'
                                                }
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
                                                    You are here
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
                                ? t('progress.one_session_left') ||
                                  '1 session left to finish Week ' +
                                      (currentWeekIndex + 1)
                                : `${sessionsLeftThisWeek} ${t('progress.sessions_left') || 'sessions left to finish Week ' + (currentWeekIndex + 1)}`}
                            {' — '}
                            <span className="text-[#5F5E5A]">
                                {t('progress.book_with_teacher_free') ||
                                    'book your next session with a top teacher'}
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
            </div>

            {/* 4-Week Goal Edit Modal */}
            {isGoalModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="relative mx-4 flex w-full max-w-md flex-col rounded-3xl border border-[#E8E4D8] bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[#E8E4D8]/60 pb-3">
                            <h3 className="text-lg font-bold text-[#1E2A5A]">
                                Set 4-Week Session Goals
                            </h3>
                            <button
                                onClick={() => setIsGoalModalOpen(false)}
                                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSaveGoals}
                            className="mt-4 space-y-4"
                        >
                            <p className="text-xs font-medium text-slate-500">
                                Configure the number of session checkpoints for
                                each week (1 to 350 sessions/week).
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-[#1E2A5A]">
                                        Week 1 Goal
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="350"
                                        value={week1Input}
                                        onChange={(e) =>
                                            setWeek1Input(e.target.value)
                                        }
                                        className="mt-1.5 w-full rounded-2xl border border-[#E8E4D8] bg-[#FDF9EC]/50 px-4 py-2.5 text-sm font-bold text-[#1E2A5A] focus:border-[#1E2A5A] focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#1E2A5A]">
                                        Week 2 Goal
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="350"
                                        value={week2Input}
                                        onChange={(e) =>
                                            setWeek2Input(e.target.value)
                                        }
                                        className="mt-1.5 w-full rounded-2xl border border-[#E8E4D8] bg-[#FDF9EC]/50 px-4 py-2.5 text-sm font-bold text-[#1E2A5A] focus:border-[#1E2A5A] focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#1E2A5A]">
                                        Week 3 Goal
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="350"
                                        value={week3Input}
                                        onChange={(e) =>
                                            setWeek3Input(e.target.value)
                                        }
                                        className="mt-1.5 w-full rounded-2xl border border-[#E8E4D8] bg-[#FDF9EC]/50 px-4 py-2.5 text-sm font-bold text-[#1E2A5A] focus:border-[#1E2A5A] focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#1E2A5A]">
                                        Week 4 Goal
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="350"
                                        value={week4Input}
                                        onChange={(e) =>
                                            setWeek4Input(e.target.value)
                                        }
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
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-xl bg-[#1E2A5A] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#061445] disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : 'Save Goals'}
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
