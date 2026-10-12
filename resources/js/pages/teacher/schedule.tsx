import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Calendar,
    Clock,
    User,
    Video,
    XCircle,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    List,
    Sparkles,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import GoogleCalendarWarningBanner from '@/components/teachers/GoogleCalendarWarningBanner';

interface Props {
    appointments: any[];
}

function TeacherMeetingButton({
    apt,
    handleStart,
    startingAptId,
}: {
    apt: any;
    handleStart: (apt: any) => void;
    startingAptId: string | null;
}) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const { t } = useTranslation();

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const start = new Date(apt.start_at);
    const hasStartedTime = currentTime >= start;

    if (!hasStartedTime) {
        return (
            <button
                disabled
                className="flex cursor-not-allowed items-center gap-1.5 rounded-xl border border-border/50 bg-muted/60 px-3.5 py-2 text-xs font-semibold text-muted-foreground"
            >
                <Clock className="h-3.5 w-3.5" /> {t('schedule.scheduled')}
            </button>
        );
    }

    return (
        <button
            disabled={startingAptId === apt.id}
            onClick={() => handleStart(apt)}
            className="flex animate-pulse cursor-pointer items-center gap-1.5 rounded-xl bg-brand-button px-4 py-2 text-xs font-bold text-brand-brown shadow-md shadow-brand-button/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-button-hover hover:shadow-lg disabled:opacity-50"
        >
            <Video className="h-3.5 w-3.5" />
            {startingAptId === apt.id
                ? t('schedule.starting')
                : t('schedule.start')}
        </button>
    );
}

const formatLocalDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function Schedule({ appointments }: Props) {
    const [startingAptId, setStartingAptId] = useState<string | null>(null);
    const { t, locale } = useTranslation();

    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

    const today = useMemo(() => new Date(), []);
    const [currentMonthDate, setCurrentMonthDate] = useState<Date>(
        new Date(today.getFullYear(), today.getMonth(), 1),
    );
    const [selectedDateKey, setSelectedDateKey] = useState<string>(
        formatLocalDateKey(today),
    );

    const [cancellingBooking, setCancellingBooking] = useState<any | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [submittingCancel, setSubmittingCancel] = useState(false);

    // Group appointments by local date key 'YYYY-MM-DD'
    const appointmentsByDate = useMemo(() => {
        const map: Record<string, any[]> = {};
        appointments.forEach((apt) => {
            const key = formatLocalDateKey(new Date(apt.start_at));
            if (!map[key]) {
                map[key] = [];
            }
            map[key].push(apt);
        });
        return map;
    }, [appointments]);

    // Compute month calendar grid days
    const calendarDays = useMemo(() => {
        const year = currentMonthDate.getFullYear();
        const month = currentMonthDate.getMonth();

        const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
        const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
        const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

        const days: Array<{
            date: Date;
            dateKey: string;
            dayNumber: number;
            isCurrentMonth: boolean;
            isToday: boolean;
        }> = [];

        // Previous month padding days
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            const dayNum = totalDaysInPrevMonth - i;
            const d = new Date(year, month - 1, dayNum);
            days.push({
                date: d,
                dateKey: formatLocalDateKey(d),
                dayNumber: dayNum,
                isCurrentMonth: false,
                isToday: formatLocalDateKey(d) === formatLocalDateKey(today),
            });
        }

        // Current month days
        for (let i = 1; i <= totalDaysInMonth; i++) {
            const d = new Date(year, month, i);
            days.push({
                date: d,
                dateKey: formatLocalDateKey(d),
                dayNumber: i,
                isCurrentMonth: true,
                isToday: formatLocalDateKey(d) === formatLocalDateKey(today),
            });
        }

        // Next month padding days to fill 35 or 42 grid cells
        const totalFilled = days.length;
        const totalSlots = totalFilled > 35 ? 42 : 35;
        const remaining = totalSlots - totalFilled;
        for (let i = 1; i <= remaining; i++) {
            const d = new Date(year, month + 1, i);
            days.push({
                date: d,
                dateKey: formatLocalDateKey(d),
                dayNumber: i,
                isCurrentMonth: false,
                isToday: formatLocalDateKey(d) === formatLocalDateKey(today),
            });
        }

        return days;
    }, [currentMonthDate, today]);

    // Sessions on currently selected day
    const selectedDaySessions = useMemo(() => {
        return appointmentsByDate[selectedDateKey] || [];
    }, [appointmentsByDate, selectedDateKey]);

    // Count of sessions in the viewed month
    const viewedMonthSessionsCount = useMemo(() => {
        const year = currentMonthDate.getFullYear();
        const month = currentMonthDate.getMonth();
        return appointments.filter((apt) => {
            const d = new Date(apt.start_at);
            return d.getFullYear() === year && d.getMonth() === month;
        }).length;
    }, [appointments, currentMonthDate]);

    const handlePrevMonth = () => {
        setCurrentMonthDate(
            (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
        );
    };

    const handleNextMonth = () => {
        setCurrentMonthDate(
            (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
        );
    };

    const handleTodayJump = () => {
        const now = new Date();
        setCurrentMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
        setSelectedDateKey(formatLocalDateKey(now));
    };

    const handleCancelSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cancellingBooking) return;
        if (
            cancelReason.trim().length < 3 ||
            cancelReason.trim().length > 1000
        ) {
            toast.error(
                t('teacher.reason_length_validation') ||
                    'Reason must be between 3 and 1000 characters',
            );
            return;
        }

        setSubmittingCancel(true);
        try {
            await axios.delete(`/bookings/${cancellingBooking.id}`, {
                data: { reason: cancelReason.trim() },
            });
            toast.success(t('schedule.cancel_success'));
            setCancellingBooking(null);
            setCancelReason('');
            router.reload();
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || t('schedule.cancel_failed'),
            );
        } finally {
            setSubmittingCancel(false);
        }
    };

    const handleStart = async (apt: any) => {
        setStartingAptId(apt.id);
        try {
            const response = await axios.post(
                `/teacher/appointments/${apt.id}/start`,
            );
            toast.success(t('schedule.start_success'));
            if (response.data.google_meet_link) {
                window.open(response.data.google_meet_link, '_blank');
            }
            router.reload();
        } catch (error: any) {
            if (error.response?.data?.requires_google_calendar) {
                toast.error(
                    error.response.data.message ||
                        'Google Calendar connection required to generate Google Meet links.',
                    {
                        action: {
                            label:
                                t('dashboard.connect_google') ||
                                'Connect Google',
                            onClick: () => {
                                window.location.href =
                                    '/auth/google?calendar=1';
                            },
                        },
                        duration: 10000,
                    },
                );
            } else {
                toast.error(
                    error.response?.data?.message || t('schedule.start_failed'),
                );
            }
        } finally {
            setStartingAptId(null);
        }
    };

    const weekDays = useMemo(() => {
        // Mon - Sun names
        const base = new Date(2026, 8, 28); // 2026-09-28 was a Monday
        const names: string[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(base);
            d.setDate(base.getDate() + i);
            names.push(
                d.toLocaleDateString(locale === 'uz' ? 'uz-UZ' : locale === 'ru' ? 'ru-RU' : 'en-US', {
                    weekday: 'short',
                }),
            );
        }
        return names;
    }, [locale]);

    const formattedMonthTitle = useMemo(() => {
        return currentMonthDate.toLocaleDateString(
            locale === 'uz' ? 'uz-UZ' : locale === 'ru' ? 'ru-RU' : 'en-US',
            { month: 'long', year: 'numeric' },
        );
    }, [currentMonthDate, locale]);

    const formattedSelectedDate = useMemo(() => {
        const parts = selectedDateKey.split('-').map(Number);
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString(
            locale === 'uz' ? 'uz-UZ' : locale === 'ru' ? 'ru-RU' : 'en-US',
            { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' },
        );
    }, [selectedDateKey, locale]);

    return (
        <>
            <Head title={t('schedule.title')} />
            <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-8">
                {/* Header Section */}
                <div className="relative overflow-hidden rounded-3xl bg-brand-navy p-8 text-white shadow-lg shadow-brand-navy/10">
                    <div className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-brand-lightblue/10 blur-xl" />
                    <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-brand-yellow/10 blur-xl" />

                    <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-black tracking-widest text-brand-yellow uppercase">
                                TEACHER SCHEDULING
                            </span>
                            <h1 className="text-3xl font-black tracking-tight text-white">
                                {t('schedule.title')}
                            </h1>
                            <p className="text-sm font-medium text-brand-lightblue/80">
                                {t('schedule.desc')}
                            </p>
                        </div>

                        {/* View Switcher Controls */}
                        <div className="inline-flex self-start md:self-auto rounded-2xl bg-white/10 p-1 backdrop-blur-md border border-white/15">
                            <button
                                type="button"
                                onClick={() => setViewMode('calendar')}
                                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 cursor-pointer ${
                                    viewMode === 'calendar'
                                        ? 'bg-brand-button text-brand-brown shadow-sm'
                                        : 'text-white/80 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <CalendarDays className="h-4 w-4" />
                                <span>{t('schedule.calendar_view')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 cursor-pointer ${
                                    viewMode === 'list'
                                        ? 'bg-brand-button text-brand-brown shadow-sm'
                                        : 'text-white/80 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <List className="h-4 w-4" />
                                <span>{t('schedule.list_view')}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Google Calendar Reminder Banner */}
                <GoogleCalendarWarningBanner />

                {viewMode === 'calendar' ? (
                    <div className="space-y-8">
                        {/* Month Calendar Card */}
                        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                            {/* Calendar Navigation Bar */}
                            <div className="flex flex-col gap-4 border-b border-border/70 p-5 sm:flex-row sm:items-center sm:justify-between bg-muted/20">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-lightblue/70 text-brand-brown">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold capitalize text-foreground">
                                            {formattedMonthTitle}
                                        </h2>
                                        <p className="text-xs font-medium text-muted-foreground">
                                            {viewedMonthSessionsCount > 0
                                                ? t('schedule.sessions_count_plural', {
                                                      count: viewedMonthSessionsCount,
                                                  })
                                                : t('schedule.no_sessions_month')}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                    <button
                                        type="button"
                                        onClick={handleTodayJump}
                                        className="rounded-xl border border-border bg-background px-3.5 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-muted cursor-pointer"
                                    >
                                        {t('schedule.today')}
                                    </button>
                                    <div className="flex items-center rounded-xl border border-border bg-background p-0.5">
                                        <button
                                            type="button"
                                            onClick={handlePrevMonth}
                                            aria-label={t('schedule.prev_month')}
                                            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleNextMonth}
                                            aria-label={t('schedule.next_month')}
                                            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Weekday Labels */}
                            <div className="grid grid-cols-7 border-b border-border/70 bg-muted/40 text-center">
                                {weekDays.map((dayName, idx) => (
                                    <div
                                        key={idx}
                                        className="py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground"
                                    >
                                        {dayName}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Days Matrix */}
                            <div className="grid grid-cols-7 divide-x divide-y divide-border/60">
                                {calendarDays.map((day) => {
                                    const dayAppointments =
                                        appointmentsByDate[day.dateKey] || [];
                                    const hasAppointments =
                                        dayAppointments.length > 0;
                                    const isSelected =
                                        selectedDateKey === day.dateKey;

                                    return (
                                        <button
                                            type="button"
                                            key={day.dateKey}
                                            onClick={() => {
                                                setSelectedDateKey(day.dateKey);
                                                if (!day.isCurrentMonth) {
                                                    setCurrentMonthDate(
                                                        new Date(
                                                            day.date.getFullYear(),
                                                            day.date.getMonth(),
                                                            1,
                                                        ),
                                                    );
                                                }
                                            }}
                                            className={`relative flex min-h-[90px] sm:min-h-[115px] flex-col p-2 text-left transition-all duration-200 cursor-pointer focus:outline-none ${
                                                day.isCurrentMonth
                                                    ? 'bg-card hover:bg-muted/30'
                                                    : 'bg-muted/15 text-muted-foreground/45 hover:bg-muted/35'
                                            } ${
                                                isSelected
                                                    ? 'ring-2 ring-inset ring-brand-brown/70 bg-brand-lightblue/20'
                                                    : ''
                                            }`}
                                        >
                                            {/* Date Number Header */}
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                                        day.isToday
                                                            ? 'bg-brand-navy text-white shadow-xs'
                                                            : isSelected
                                                            ? 'text-brand-brown font-extrabold'
                                                            : 'text-foreground'
                                                    }`}
                                                >
                                                    {day.dayNumber}
                                                </span>

                                                {hasAppointments && (
                                                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-button text-[10px] font-black text-brand-brown">
                                                        {dayAppointments.length}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Session Chips inside Day Cell */}
                                            <div className="mt-1.5 flex flex-col gap-1 overflow-hidden">
                                                {dayAppointments
                                                    .slice(0, 2)
                                                    .map((apt) => (
                                                        <div
                                                            key={apt.id}
                                                            className="flex items-center gap-1 truncate rounded-md bg-brand-lightblue/60 px-1.5 py-0.5 text-[10px] font-bold text-brand-brown dark:bg-brand-brown/20 dark:text-brand-yellow"
                                                        >
                                                            <span className="shrink-0 font-mono text-[9px] opacity-80">
                                                                {new Date(
                                                                    apt.start_at,
                                                                ).toLocaleTimeString([], {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                })}
                                                            </span>
                                                            <span className="truncate">
                                                                {apt.pupil?.full_name?.split(
                                                                    ' ',
                                                                )[0] || 'Student'}
                                                            </span>
                                                        </div>
                                                    ))}

                                                {dayAppointments.length > 2 && (
                                                    <span className="text-[10px] font-semibold text-brand-brown/80 dark:text-brand-yellow">
                                                        {t('schedule.more_sessions', {
                                                            count:
                                                                dayAppointments.length -
                                                                2,
                                                        })}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Selected Date Session Agenda Panel */}
                        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                            <div className="flex flex-col gap-1 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <span className="text-[10px] font-extrabold tracking-wider uppercase text-brand-brown">
                                        AGENDA
                                    </span>
                                    <h3 className="text-lg font-bold text-foreground">
                                        {t('schedule.sessions_on_date', {
                                            date: formattedSelectedDate,
                                        })}
                                    </h3>
                                </div>
                                <span className="inline-flex self-start sm:self-auto items-center rounded-xl bg-muted px-3 py-1 text-xs font-bold text-foreground">
                                    {selectedDaySessions.length > 0
                                        ? t('schedule.sessions_count_plural', {
                                              count: selectedDaySessions.length,
                                          })
                                        : t('schedule.no_sessions_date')}
                                </span>
                            </div>

                            <div className="mt-5 space-y-4">
                                {selectedDaySessions.length > 0 ? (
                                    selectedDaySessions.map((apt) => (
                                        <div
                                            key={apt.id}
                                            className="group flex flex-col justify-between gap-5 rounded-2xl border border-border/80 bg-background p-5 transition-shadow hover:shadow-md md:flex-row md:items-center"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-lightblue text-brand-brown transition-transform group-hover:scale-105">
                                                    <User className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-bold text-foreground">
                                                        {apt.pupil?.full_name ||
                                                            'Student'}
                                                    </h4>
                                                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-semibold text-muted-foreground">
                                                        <span className="flex items-center gap-1 text-brand-brown dark:text-brand-yellow font-bold">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {new Date(
                                                                apt.start_at,
                                                            ).toLocaleTimeString(
                                                                [],
                                                                {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                },
                                                            )}{' '}
                                                            -{' '}
                                                            {new Date(
                                                                apt.end_at,
                                                            ).toLocaleTimeString(
                                                                [],
                                                                {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                },
                                                            )}
                                                        </span>
                                                    </div>

                                                    {apt.topics &&
                                                        apt.topics.length > 0 && (
                                                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                                                                {apt.topics.map(
                                                                    (topic: string) => {
                                                                        const topicKey = `labels.${topic.toLowerCase().trim()}`;
                                                                        const translated = t(topicKey);
                                                                        const displayTopic =
                                                                            translated &&
                                                                            translated !== topicKey
                                                                                ? translated
                                                                                : topic;
                                                                        return (
                                                                            <span
                                                                                key={topic}
                                                                                className="rounded-lg bg-brand-lightblue/80 px-2 py-0.5 text-[10px] font-bold text-brand-brown dark:bg-brand-brown/20 dark:text-brand-yellow"
                                                                            >
                                                                                #{displayTopic}
                                                                            </span>
                                                                        );
                                                                    },
                                                                )}
                                                            </div>
                                                        )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2.5 self-end md:self-auto">
                                                <TeacherMeetingButton
                                                    apt={apt}
                                                    handleStart={handleStart}
                                                    startingAptId={startingAptId}
                                                />

                                                <button
                                                    onClick={() =>
                                                        setCancellingBooking(apt)
                                                    }
                                                    className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-destructive/25 px-3 py-2 text-xs font-bold text-destructive transition-all duration-200 hover:bg-destructive hover:text-white"
                                                >
                                                    <XCircle className="h-3.5 w-3.5" />{' '}
                                                    {t('teacher.cancel')}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-border/70 p-10 text-center text-muted-foreground">
                                        <CalendarDays className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                                        <p className="text-sm font-semibold text-foreground">
                                            {t('schedule.no_sessions_date')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Main Schedule List (List View) */
                    <div className="grid gap-5">
                        {appointments.length > 0 ? (
                            appointments.map((apt) => (
                                <div
                                    key={apt.id}
                                    className="group flex flex-col justify-between gap-6 rounded-3xl border border-border bg-card p-6 shadow-sm transition-shadow duration-300 hover:shadow-md md:flex-row md:items-center"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-lightblue text-brand-brown transition-transform group-hover:scale-105">
                                            <User className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold text-foreground">
                                                {apt.pupil?.full_name || 'Student'}
                                            </h4>
                                            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs font-semibold text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3.5 w-3.5 text-brand-brown" />
                                                    {new Date(
                                                        apt.start_at,
                                                    ).toLocaleDateString([], {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    })}
                                                </span>
                                                <div className="hidden h-2 w-px bg-border sm:block" />
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5 text-brand-brown" />
                                                    {new Date(
                                                        apt.start_at,
                                                    ).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}{' '}
                                                    -{' '}
                                                    {new Date(
                                                        apt.end_at,
                                                    ).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>

                                            {/* Topics Display */}
                                            {apt.topics &&
                                                apt.topics.length > 0 && (
                                                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                                                        {apt.topics.map(
                                                            (topic: string) => {
                                                                const topicKey = `labels.${topic.toLowerCase().trim()}`;
                                                                const translated = t(topicKey);
                                                                const displayTopic =
                                                                    translated &&
                                                                    translated !== topicKey
                                                                        ? translated
                                                                        : topic;
                                                                return (
                                                                    <span
                                                                        key={topic}
                                                                        className="rounded-lg bg-brand-lightblue px-2 py-0.5 text-[10px] font-bold text-brand-brown"
                                                                    >
                                                                        #{displayTopic}
                                                                    </span>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2.5">
                                        <TeacherMeetingButton
                                            apt={apt}
                                            handleStart={handleStart}
                                            startingAptId={startingAptId}
                                        />

                                        <button
                                            onClick={() =>
                                                setCancellingBooking(apt)
                                            }
                                            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-destructive/25 px-3.5 py-2.5 text-xs font-bold text-destructive transition-all duration-300 hover:bg-destructive hover:text-white"
                                        >
                                            <XCircle className="h-3.5 w-3.5" />{' '}
                                            {t('teacher.cancel')}
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center text-muted-foreground">
                                <CalendarDays className="mx-auto mb-4 h-10 w-10 animate-pulse text-muted-foreground/45" />
                                <p className="mb-1 text-base font-bold text-foreground">
                                    {t('schedule.none')}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {t('schedule.empty_desc')}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {cancellingBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="relative mx-4 flex w-full max-w-md animate-in flex-col rounded-2xl border bg-card p-6 shadow-2xl duration-150 zoom-in-95">
                        <h3 className="text-lg font-bold text-foreground">
                            {t('teacher.cancel_title') || 'Cancel Appointment'}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {t('teacher.cancel_desc') ||
                                'Please state the reason for cancelling this appointment. This will be visible to the student.'}
                        </p>
                        <form
                            onSubmit={handleCancelSubmit}
                            className="mt-4 space-y-4"
                        >
                            <div>
                                <textarea
                                    className="min-h-[100px] w-full rounded-xl border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-brand-button/20 focus:outline-none"
                                    placeholder={
                                        t('teacher.reason_placeholder') ||
                                        'Enter your reason here...'
                                    }
                                    value={cancelReason}
                                    onChange={(e) =>
                                        setCancelReason(e.target.value)
                                    }
                                    minLength={3}
                                    maxLength={1000}
                                    required
                                />
                                <div className="mt-1 text-right text-[10px] font-semibold text-muted-foreground">
                                    {cancelReason.length} / 1000
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCancellingBooking(null);
                                        setCancelReason('');
                                    }}
                                    className="cursor-pointer rounded-xl border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
                                >
                                    {t('bookings.close_btn') || 'Close'}
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        submittingCancel ||
                                        cancelReason.trim().length < 3
                                    }
                                    className="cursor-pointer rounded-xl bg-destructive px-5 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-destructive/90 disabled:opacity-50"
                                >
                                    {submittingCancel
                                        ? t('bookings.cancelling') ||
                                          'Cancelling...'
                                        : t('bookings.confirm_cancel') ||
                                          'Confirm Cancel'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

Schedule.layout = {
    breadcrumbs: [{ title: 'my schedule', href: '/teacher/schedule' }],
};

