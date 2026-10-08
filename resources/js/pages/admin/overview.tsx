import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-translation';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    GraduationCap,
    Clock,
    CheckCircle2,
    Calendar,
    Star,
    ArrowUpRight,
    ArrowDownRight,
    AlertCircle,
    Activity,
    CreditCard,
    Layers,
    ChevronRight,
    BarChart3,
    Sparkles,
} from 'lucide-react';

interface OverviewMetrics {
    total_revenue: number;
    direct_booking_revenue: number;
    package_sales_revenue: number;
    paid_transactions_count: number;
    average_order_value: number;
    completed_sessions_count: number;
    speaking_minutes: number;
    upcoming_sessions_count: number;
    satisfaction_rating: number;
    new_pupils_count: number;
    new_teachers_count: number;
    active_teachers_count: number;
    active_pupils_count: number;
}

interface OverviewTrends {
    total_revenue: number | null;
    paid_transactions: number | null;
    completed_sessions: number | null;
    new_pupils: number | null;
    new_teachers: number | null;
}

interface TimelinePoint {
    date: string;
    label: string;
    revenue: number;
    sessions: number;
    users: number;
}

interface RecentTransaction {
    type: 'appointment' | 'package';
    title: string;
    pupil: string;
    teacher: string;
    amount: number;
    date: string;
}

interface RecentUser {
    id: string;
    name: string;
    email: string;
    role: 'teacher' | 'pupil' | 'admin';
    created_at: string;
}

interface OverviewPageProps {
    period: 'today' | 'this_week' | 'this_month' | 'last_30_days' | 'all_time';
    metrics: OverviewMetrics;
    trends: OverviewTrends;
    matrix: Record<'today' | 'this_week' | 'this_month' | 'all_time', OverviewMetrics>;
    timeline: TimelinePoint[];
    recentTransactions: RecentTransaction[];
    recentUsers: RecentUser[];
    pendingVerificationsCount: number;
}

export default function AdminOverview({
    period,
    metrics,
    trends,
    matrix,
    timeline,
    recentTransactions,
    recentUsers,
    pendingVerificationsCount,
}: OverviewPageProps) {
    const { t } = useTranslation();
    const [chartMode, setChartMode] = useState<'revenue' | 'sessions' | 'users'>('revenue');

    const formatCurrency = (val: number) => {
        return `${Number(val || 0).toLocaleString('ru-RU').replace(/,/g, ' ')} UZS`;
    };

    const handlePeriodChange = (newPeriod: string) => {
        router.get(
            '/admin/overview',
            { period: newPeriod },
            { preserveState: true, preserveScroll: true }
        );
    };

    const periods = [
        { id: 'today', label: t('overview.period_today', 'Today') },
        { id: 'this_week', label: t('overview.period_this_week', 'This Week') },
        { id: 'this_month', label: t('overview.period_this_month', 'This Month') },
        { id: 'last_30_days', label: t('overview.period_last_30_days', 'Last 30 Days') },
        { id: 'all_time', label: t('overview.period_all_time', 'All Time') },
    ];

    const maxChartValue = React.useMemo(() => {
        if (!timeline || timeline.length === 0) return 1;
        const vals = timeline.map((p) => (chartMode === 'revenue' ? p.revenue : chartMode === 'sessions' ? p.sessions : p.users));
        return Math.max(...vals, 1);
    }, [timeline, chartMode]);

    return (
        <>
            <Head title={t('overview.title', 'Platform Overview & Monitoring')} />

            <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
                {/* Header with Title and Period Filter Bar */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl dark:text-white">
                                {t('overview.title', 'Platform Overview & Monitoring')}
                            </h1>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Live
                            </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 sm:text-sm dark:text-gray-400">
                            {t('overview.subtitle', 'Real-time performance, revenue analytics, speaking sessions, and user activity.')}
                        </p>
                    </div>

                    {/* Period Switcher */}
                    <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-gray-200/90 bg-white p-1 shadow-xs dark:border-gray-800 dark:bg-gray-900">
                        {periods.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => handlePeriodChange(p.id)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                                    period === p.id
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Pending Verifications Action Banner */}
                {pendingVerificationsCount > 0 && (
                    <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:flex-row sm:items-center dark:border-amber-900/50 dark:from-amber-950/30 dark:to-orange-950/20">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                                    {t('overview.pending_verifications', 'Pending Payment Verifications')}
                                </h2>
                                <p className="text-xs text-amber-700 dark:text-amber-300/80">
                                    {pendingVerificationsCount} transactions await receipt verification in the approval queue.
                                </p>
                            </div>
                        </div>
                        <Button
                            asChild
                            size="sm"
                            className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 font-bold"
                        >
                            <Link href="/admin/dashboard">
                                {t('overview.view_queue', 'View Queue')}
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                )}

                {/* Primary KPI Cards Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* 1. Total Gross Revenue */}
                    <Card className="rounded-2xl border-gray-200/80 shadow-xs transition-all hover:shadow-sm dark:border-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <span className="text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                {t('overview.total_revenue', 'Total Gross Revenue')}
                            </span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                                <DollarSign className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="text-2xl font-black text-gray-900 dark:text-white">
                                {formatCurrency(metrics.total_revenue)}
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500 dark:text-gray-400">
                                    {t('overview.paid_transactions', 'Paid Transactions')}: <strong className="text-gray-700 dark:text-gray-200">{metrics.paid_transactions_count}</strong>
                                </span>
                                {trends.total_revenue !== null && (
                                    <span
                                        className={`inline-flex items-center font-bold ${
                                            trends.total_revenue >= 0 ? 'text-emerald-600' : 'text-red-500'
                                        }`}
                                    >
                                        {trends.total_revenue >= 0 ? (
                                            <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" />
                                        ) : (
                                            <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />
                                        )}
                                        {Math.abs(trends.total_revenue)}%
                                    </span>
                                )}
                            </div>
                            {/* Revenue Breakdown */}
                            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between text-[11px] text-gray-400">
                                <span>Packs: <strong className="text-gray-600 dark:text-gray-300">{formatCurrency(metrics.package_sales_revenue)}</strong></span>
                                <span>Direct: <strong className="text-gray-600 dark:text-gray-300">{formatCurrency(metrics.direct_booking_revenue)}</strong></span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. Completed Sessions & Minutes */}
                    <Card className="rounded-2xl border-gray-200/80 shadow-xs transition-all hover:shadow-sm dark:border-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <span className="text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                {t('overview.completed_sessions', 'Completed Sessions')}
                            </span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="text-2xl font-black text-gray-900 dark:text-white">
                                {metrics.completed_sessions_count.toLocaleString()}
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500 dark:text-gray-400">
                                    {t('overview.speaking_minutes', 'Speaking Minutes')}: <strong className="text-gray-700 dark:text-gray-200">{metrics.speaking_minutes.toLocaleString()} min</strong>
                                </span>
                                {trends.completed_sessions !== null && (
                                    <span
                                        className={`inline-flex items-center font-bold ${
                                            trends.completed_sessions >= 0 ? 'text-emerald-600' : 'text-red-500'
                                        }`}
                                    >
                                        {trends.completed_sessions >= 0 ? (
                                            <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" />
                                        ) : (
                                            <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />
                                        )}
                                        {Math.abs(trends.completed_sessions)}%
                                    </span>
                                )}
                            </div>
                            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between text-[11px] text-gray-400">
                                <span>Upcoming: <strong className="text-indigo-600 dark:text-indigo-400">{metrics.upcoming_sessions_count} scheduled</strong></span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 3. User Growth (Pupils & Teachers) */}
                    <Card className="rounded-2xl border-gray-200/80 shadow-xs transition-all hover:shadow-sm dark:border-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <span className="text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                {t('overview.new_pupils', 'New Pupils')} / {t('overview.new_teachers', 'Teachers')}
                            </span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                                <Users className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-gray-900 dark:text-white">
                                    +{metrics.new_pupils_count}
                                </span>
                                <span className="text-xs font-bold text-gray-400">pupils</span>
                                <span className="text-gray-300 dark:text-gray-700">/</span>
                                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                                    +{metrics.new_teachers_count}
                                </span>
                                <span className="text-xs font-bold text-gray-400">teachers</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                <span>Active: <strong className="text-gray-700 dark:text-gray-200">{metrics.active_pupils_count} pupils · {metrics.active_teachers_count} teachers</strong></span>
                            </div>
                            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between text-[11px] text-gray-400">
                                <span>Pupil trend: <strong className={trends.new_pupils && trends.new_pupils >= 0 ? 'text-emerald-600' : 'text-gray-500'}>{trends.new_pupils ? `${trends.new_pupils}%` : 'Stable'}</strong></span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 4. AOV & Satisfaction Rating */}
                    <Card className="rounded-2xl border-gray-200/80 shadow-xs transition-all hover:shadow-sm dark:border-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <span className="text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                {t('overview.avg_order_value', 'Avg Order Value')}
                            </span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="text-2xl font-black text-gray-900 dark:text-white">
                                {formatCurrency(metrics.average_order_value)}
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500 dark:text-gray-400">
                                    {t('overview.satisfaction_rating', 'Satisfaction Rating')}:
                                </span>
                                <span className="inline-flex items-center font-black text-amber-600 dark:text-amber-400">
                                    ★ {metrics.satisfaction_rating} / 5.0
                                </span>
                            </div>
                            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between text-[11px] text-gray-400">
                                <span>Total Gross Orders: <strong className="text-gray-700 dark:text-gray-200">{metrics.paid_transactions_count}</strong></span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Timeline Trends Chart */}
                <Card className="rounded-2xl border-gray-200/80 shadow-xs dark:border-gray-800">
                    <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-4">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
                                <BarChart3 className="h-4 w-4 text-indigo-600" />
                                {t('overview.activity_trend', 'Activity & Revenue Trends')}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Daily breakdown over the active window.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
                            <button
                                type="button"
                                onClick={() => setChartMode('revenue')}
                                className={`rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
                                    chartMode === 'revenue'
                                        ? 'bg-white text-indigo-600 shadow-xs dark:bg-gray-900 dark:text-indigo-400'
                                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                                }`}
                            >
                                Revenue
                            </button>
                            <button
                                type="button"
                                onClick={() => setChartMode('sessions')}
                                className={`rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
                                    chartMode === 'sessions'
                                        ? 'bg-white text-indigo-600 shadow-xs dark:bg-gray-900 dark:text-indigo-400'
                                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                                }`}
                            >
                                Sessions
                            </button>
                            <button
                                type="button"
                                onClick={() => setChartMode('users')}
                                className={`rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
                                    chartMode === 'users'
                                        ? 'bg-white text-indigo-600 shadow-xs dark:bg-gray-900 dark:text-indigo-400'
                                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                                }`}
                            >
                                New Users
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {timeline.length === 0 ? (
                            <div className="flex h-48 items-center justify-center text-xs text-gray-400 italic">
                                No activity recorded for this period.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Bar visualization */}
                                <div className="flex h-48 items-end gap-1.5 pt-6 sm:gap-2">
                                    {timeline.map((point) => {
                                        const currentVal = chartMode === 'revenue' ? point.revenue : chartMode === 'sessions' ? point.sessions : point.users;
                                        const heightPercent = Math.max(6, Math.round((currentVal / maxChartValue) * 100));

                                        return (
                                            <div
                                                key={point.date}
                                                className="group relative flex flex-1 flex-col items-center h-full justify-end"
                                            >
                                                {/* Tooltip on hover */}
                                                <div className="pointer-events-none absolute -top-10 z-20 hidden -translate-x-1/2 rounded-md bg-gray-900 px-2 py-1 text-[10px] font-bold text-white shadow-lg whitespace-nowrap group-hover:block dark:bg-gray-100 dark:text-gray-900">
                                                    {point.label}: {chartMode === 'revenue' ? formatCurrency(currentVal) : `${currentVal} ${chartMode}`}
                                                </div>

                                                {/* Bar */}
                                                <div
                                                    style={{ height: `${heightPercent}%` }}
                                                    className={`w-full rounded-t-md transition-all ${
                                                        chartMode === 'revenue'
                                                            ? 'bg-emerald-500/85 hover:bg-emerald-600'
                                                            : chartMode === 'sessions'
                                                              ? 'bg-indigo-500/85 hover:bg-indigo-600'
                                                              : 'bg-blue-500/85 hover:bg-blue-600'
                                                    }`}
                                                />
                                                <span className="mt-2 block truncate text-[9px] font-medium text-gray-400">
                                                    {point.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Multi-Period Cross-Comparison Matrix */}
                <Card className="rounded-2xl border-gray-200/80 shadow-xs dark:border-gray-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
                            <Layers className="h-4 w-4 text-indigo-600" />
                            {t('overview.comparison_matrix', 'Multi-Period Cross Comparison')}
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Instant matrix benchmark comparing key metrics across all standard time horizons.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-extrabold uppercase text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                                    <th className="py-2.5 px-3">{t('overview.metric', 'Metric')}</th>
                                    <th className="py-2.5 px-3 text-right">{t('overview.period_today', 'Today')}</th>
                                    <th className="py-2.5 px-3 text-right">{t('overview.period_this_week', 'This Week')}</th>
                                    <th className="py-2.5 px-3 text-right">{t('overview.period_this_month', 'This Month')}</th>
                                    <th className="py-2.5 px-3 text-right font-black text-indigo-600 dark:text-indigo-400">{t('overview.period_all_time', 'All Time')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                    <td className="py-2.5 px-3 font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                        <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                                        {t('overview.total_revenue', 'Total Gross Revenue')}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(matrix.today.total_revenue)}</td>
                                    <td className="py-2.5 px-3 text-right font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(matrix.this_week.total_revenue)}</td>
                                    <td className="py-2.5 px-3 text-right font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(matrix.this_month.total_revenue)}</td>
                                    <td className="py-2.5 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(matrix.all_time.total_revenue)}</td>
                                </tr>
                                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                    <td className="py-2.5 px-3 font-medium text-gray-600 dark:text-gray-400 pl-6">
                                        — {t('overview.package_sales', 'Speaking Packs')}
                                    </td>
                                    <td className="py-2.5 px-3 text-right text-gray-600 dark:text-gray-400">{formatCurrency(matrix.today.package_sales_revenue)}</td>
                                    <td className="py-2.5 px-3 text-right text-gray-600 dark:text-gray-400">{formatCurrency(matrix.this_week.package_sales_revenue)}</td>
                                    <td className="py-2.5 px-3 text-right text-gray-600 dark:text-gray-400">{formatCurrency(matrix.this_month.package_sales_revenue)}</td>
                                    <td className="py-2.5 px-3 text-right font-bold text-gray-900 dark:text-gray-200">{formatCurrency(matrix.all_time.package_sales_revenue)}</td>
                                </tr>
                                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                    <td className="py-2.5 px-3 font-medium text-gray-600 dark:text-gray-400 pl-6">
                                        — {t('overview.direct_bookings', 'Direct Bookings')}
                                    </td>
                                    <td className="py-2.5 px-3 text-right text-gray-600 dark:text-gray-400">{formatCurrency(matrix.today.direct_booking_revenue)}</td>
                                    <td className="py-2.5 px-3 text-right text-gray-600 dark:text-gray-400">{formatCurrency(matrix.this_week.direct_booking_revenue)}</td>
                                    <td className="py-2.5 px-3 text-right text-gray-600 dark:text-gray-400">{formatCurrency(matrix.this_month.direct_booking_revenue)}</td>
                                    <td className="py-2.5 px-3 text-right font-bold text-gray-900 dark:text-gray-200">{formatCurrency(matrix.all_time.direct_booking_revenue)}</td>
                                </tr>
                                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                    <td className="py-2.5 px-3 font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
                                        {t('overview.completed_sessions', 'Completed Sessions')}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-semibold text-gray-700 dark:text-gray-300">{matrix.today.completed_sessions_count}</td>
                                    <td className="py-2.5 px-3 text-right font-semibold text-gray-700 dark:text-gray-300">{matrix.this_week.completed_sessions_count}</td>
                                    <td className="py-2.5 px-3 text-right font-semibold text-gray-700 dark:text-gray-300">{matrix.this_month.completed_sessions_count}</td>
                                    <td className="py-2.5 px-3 text-right font-black text-indigo-600 dark:text-indigo-400">{matrix.all_time.completed_sessions_count}</td>
                                </tr>
                                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                    <td className="py-2.5 px-3 font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                                        {t('overview.speaking_minutes', 'Speaking Minutes')}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-semibold text-gray-700 dark:text-gray-300">{matrix.today.speaking_minutes.toLocaleString()}</td>
                                    <td className="py-2.5 px-3 text-right font-semibold text-gray-700 dark:text-gray-300">{matrix.this_week.speaking_minutes.toLocaleString()}</td>
                                    <td className="py-2.5 px-3 text-right font-semibold text-gray-700 dark:text-gray-300">{matrix.this_month.speaking_minutes.toLocaleString()}</td>
                                    <td className="py-2.5 px-3 text-right font-black text-amber-600 dark:text-amber-400">{matrix.all_time.speaking_minutes.toLocaleString()}</td>
                                </tr>
                                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                    <td className="py-2.5 px-3 font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                        <Users className="h-3.5 w-3.5 text-blue-600" />
                                        {t('overview.new_pupils', 'New Pupils')}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-semibold text-gray-700 dark:text-gray-300">{matrix.today.new_pupils_count}</td>
                                    <td className="py-2.5 px-3 text-right font-semibold text-gray-700 dark:text-gray-300">{matrix.this_week.new_pupils_count}</td>
                                    <td className="py-2.5 px-3 text-right font-semibold text-gray-700 dark:text-gray-300">{matrix.this_month.new_pupils_count}</td>
                                    <td className="py-2.5 px-3 text-right font-black text-blue-600 dark:text-blue-400">{matrix.all_time.new_pupils_count}</td>
                                </tr>
                                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                    <td className="py-2.5 px-3 font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                        <GraduationCap className="h-3.5 w-3.5 text-purple-600" />
                                        {t('overview.new_teachers', 'New Teachers')}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-semibold text-gray-700 dark:text-gray-300">{matrix.today.new_teachers_count}</td>
                                    <td className="py-2.5 px-3 text-right font-semibold text-gray-700 dark:text-gray-300">{matrix.this_week.new_teachers_count}</td>
                                    <td className="py-2.5 px-3 text-right font-semibold text-gray-700 dark:text-gray-300">{matrix.this_month.new_teachers_count}</td>
                                    <td className="py-2.5 px-3 text-right font-black text-purple-600 dark:text-purple-400">{matrix.all_time.new_teachers_count}</td>
                                </tr>
                                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                    <td className="py-2.5 px-3 font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                        <CreditCard className="h-3.5 w-3.5 text-gray-600" />
                                        {t('overview.paid_transactions', 'Paid Transactions')}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-semibold text-gray-700 dark:text-gray-300">{matrix.today.paid_transactions_count}</td>
                                    <td className="py-2.5 px-3 text-right font-semibold text-gray-700 dark:text-gray-300">{matrix.this_week.paid_transactions_count}</td>
                                    <td className="py-2.5 px-3 text-right font-semibold text-gray-700 dark:text-gray-300">{matrix.this_month.paid_transactions_count}</td>
                                    <td className="py-2.5 px-3 text-right font-black text-gray-900 dark:text-white">{matrix.all_time.paid_transactions_count}</td>
                                </tr>
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Bottom Activity Feeds: Recent Transactions & New Registrations */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Recent Transactions */}
                    <Card className="rounded-2xl border-gray-200/80 shadow-xs dark:border-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div>
                                <CardTitle className="text-sm font-bold text-gray-900 dark:text-white">
                                    {t('overview.recent_transactions', 'Recent Completed Transactions')}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Verified package sales and confirmed single sessions.
                                </CardDescription>
                            </div>
                            <Button asChild variant="ghost" size="sm" className="text-xs text-indigo-600 dark:text-indigo-400">
                                <Link href="/admin/dashboard?status=confirmed">
                                    View all
                                    <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {recentTransactions.length === 0 ? (
                                <p className="py-8 text-center text-xs text-gray-400 italic">
                                    {t('overview.no_transactions', 'No transactions in this period yet')}
                                </p>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {recentTransactions.map((tx, idx) => (
                                        <div key={idx} className="flex items-center justify-between py-2.5">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                                                        tx.type === 'package'
                                                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                                                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                                    }`}
                                                >
                                                    {tx.type === 'package' ? <Layers className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-gray-900 dark:text-white">
                                                        {tx.title}
                                                    </div>
                                                    <div className="text-[11px] text-gray-400">
                                                        {tx.pupil} → {tx.teacher}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-black text-gray-900 dark:text-white">
                                                    {formatCurrency(tx.amount)}
                                                </div>
                                                <div className="text-[10px] text-gray-400">{tx.date}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* New Platform Registrations */}
                    <Card className="rounded-2xl border-gray-200/80 shadow-xs dark:border-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div>
                                <CardTitle className="text-sm font-bold text-gray-900 dark:text-white">
                                    {t('overview.recent_users', 'New Platform Registrations')}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Latest pupils and teachers who joined the community.
                                </CardDescription>
                            </div>
                            <Button asChild variant="ghost" size="sm" className="text-xs text-indigo-600 dark:text-indigo-400">
                                <Link href="/admin/teachers">
                                    {t('nav.teachers', 'Teachers')}
                                    <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {recentUsers.length === 0 ? (
                                <p className="py-8 text-center text-xs text-gray-400 italic">
                                    {t('overview.no_users', 'No users registered in this period yet')}
                                </p>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {recentUsers.map((u) => (
                                        <div key={u.id} className="flex items-center justify-between py-2.5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                                    {u.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-gray-900 dark:text-white">
                                                        {u.name}
                                                    </div>
                                                    <div className="text-[11px] text-gray-400 truncate max-w-[180px] sm:max-w-xs">
                                                        {u.email}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant="secondary"
                                                    className={`text-[10px] capitalize font-bold ${
                                                        u.role === 'teacher'
                                                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                                                            : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                                                    }`}
                                                >
                                                    {u.role}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

AdminOverview.layout = {
    breadcrumbs: [{ title: 'Overview', href: '/admin/overview' }],
};
