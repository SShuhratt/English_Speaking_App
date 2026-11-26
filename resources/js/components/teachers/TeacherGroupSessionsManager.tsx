import React, { useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Clock,
    Loader2,
    Play,
    Plus,
    RefreshCw,
    Sparkles,
    Users,
    XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';

export interface GroupSessionEnrollmentItem {
    id: string;
    pupil_id: string;
    status: string;
    payment_status: string;
    price_paid: number;
    pupil?: {
        id: string;
        full_name: string;
        email?: string;
        avatar?: string | null;
    };
}

export interface GroupSessionItem {
    id: string;
    teacher_id: string;
    title: string;
    topic?: string | null;
    target_level: string;
    start_at: string;
    end_at: string;
    duration_minutes: number;
    max_seats: number;
    price_per_seat: number;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    meeting_started: boolean;
    google_meet_link?: string | null;
    cancellation_reason?: string | null;
    occupied_seats?: number;
    available_seats?: number;
    enrollments?: GroupSessionEnrollmentItem[];
}

export interface ExistingBookingSlot {
    id?: string;
    start_at: string;
    end_at: string;
    status?: string;
    title?: string;
    pupil?: {
        full_name?: string;
    };
}

interface Props {
    sessions: GroupSessionItem[];
    preferredFormat?: 'one_on_one' | 'group' | 'both' | string;
    defaultPrice?: number;
    existingAppointments?: ExistingBookingSlot[];
    googleConnected?: boolean;
}

const formatPriceInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const formatSpaceNumber = (value: number) =>
    Math.round(value)
        .toLocaleString('ru-RU')
        .replace(/,/g, ' ');

const toTashkentDatetimeLocal = (date: Date): string => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Tashkent',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).formatToParts(date);

    const get = (t: string) => parts.find((p) => p.type === t)?.value || '00';
    let hour = get('hour');
    if (hour === '24') hour = '00';

    return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}`;
};

const LEVEL_PRESETS = [
    { value: 'All Levels', label: 'All Levels' },
    { value: 'A1-A2', label: 'A1–A2' },
    { value: 'B1-B2', label: 'B1–B2' },
    { value: 'C1-C2', label: 'C1–C2' },
    { value: 'IELTS Prep', label: 'IELTS' },
] as const;

const DURATION_PRESETS = [30, 45, 60, 90] as const;
const SEAT_PRESETS = [3, 5, 8, 10] as const;
const PRICE_PRESETS = [30000, 50000, 75000, 100000] as const;

export default function TeacherGroupSessionsManager({
    sessions: initialSessions,
    preferredFormat: initialFormat = 'one_on_one',
    defaultPrice = 50000,
    existingAppointments = [],
    googleConnected = true,
}: Props) {
    const { locale } = useTranslation();
    const [sessions, setSessions] = useState<GroupSessionItem[]>(
        initialSessions || [],
    );
    const [formatPref, setFormatPref] = useState<string>(initialFormat);
    const [savingFormat, setSavingFormat] = useState(false);

    // Create modal state
    const [createOpen, setCreateOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [title, setTitle] = useState('');
    const [topic, setTopic] = useState('');
    const [levelMode, setLevelMode] = useState<'preset' | 'custom'>('preset');
    const [levelPreset, setLevelPreset] = useState('B1-B2');
    const [customLevel, setCustomLevel] = useState('');
    const [startAt, setStartAt] = useState(() => {
        const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
        d.setHours(19, 0, 0, 0);
        return toTashkentDatetimeLocal(d);
    });
    const [durationMode, setDurationMode] = useState<'preset' | 'custom'>('preset');
    const [duration, setDuration] = useState('60');
    const [seatsMode, setSeatsMode] = useState<'preset' | 'custom'>('preset');
    const [maxSeats, setMaxSeats] = useState('5');
    const [pricePerSeat, setPricePerSeat] = useState(
        formatPriceInput(String(defaultPrice >= 1000 ? defaultPrice : 50000)),
    );
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Reschedule modal state
    const [reschedulingSession, setReschedulingSession] =
        useState<GroupSessionItem | null>(null);
    const [rescheduleStartAt, setRescheduleStartAt] = useState('');
    const [rescheduleDuration, setRescheduleDuration] = useState('60');
    const [rescheduleError, setRescheduleError] = useState('');

    // Cancel confirmation modal state
    const [cancellingSession, setCancellingSession] =
        useState<GroupSessionItem | null>(null);
    const [cancelReason, setCancelReason] = useState('');

    const [busySessionId, setBusySessionId] = useState<string | null>(null);

    useEffect(() => {
        if (initialSessions) {
            setSessions(initialSessions);
        }
    }, [initialSessions]);

    const copy =
        locale === 'uz'
            ? {
                  groupDiscoveryTitle: "Guruh suhbatlarini qabul qilish",
                  groupDiscoveryDescOn:
                      "O'quvchilar sizni «Guruh suhbatlari» katalogida topa olishadi. Yangi guruh mashg'uloti yaratilsa ham avtomatik yoqiladi.",
                  groupDiscoveryDescOff:
                      "Hozircha faqat 1-ga-1 darslar faol. Istalgan vaqt guruh suhbati yaratib yoqishingiz mumkin.",
                  acceptGroupLabel: 'Guruh mashg‘ulotlari yoqilgan',
                  pauseOneOnOneLabel: 'Faqat guruh (1-ga-1 band qilishni vaqtincha yopish)',
                  heading: 'Guruh suhbat mashg‘ulotlari',
                  subtitle:
                      "2–20 o'quvchi uchun umumiy Google Meet havolali guruh suhbatlarini rejalashtiring.",
                  createBtn: 'Guruh mashg‘uloti yaratish',
                  empty: "Hozircha guruh mashg'ulotlari yo'q. Birinchisini yarating!",
                  seats: "o'rin band",
                  perSeat: "so'm / o'rin",
                  startBtn: 'Boshlash',
                  joinRoom: 'Xonaga kirish',
                  rescheduleBtn: "Ko'chirish",
                  cancelBtn: 'Bekor qilish',
                  noShowHint:
                      "Boshlanish vaqtidan keyin 15 daqiqa ichida boshlanmasa avtomatik bekor qilinadi.",
              }
            : locale === 'ru'
              ? {
                    groupDiscoveryTitle: 'Приём записей на групповые сессии',
                    groupDiscoveryDescOn:
                        'Студенты смогут находить вас по фильтру групповых занятий. При создании сессии также включается автоматически.',
                    groupDiscoveryDescOff:
                        'Сейчас активны только 1-на-1 уроки. Вы можете включить группы в любой момент или сразу создать сессию.',
                    acceptGroupLabel: 'Групповые сессии включены',
                    pauseOneOnOneLabel: 'Только группы (временно скрыть 1-на-1 бронь)',
                    heading: 'Групповые разговорные сессии',
                    subtitle:
                        'Планируйте групповые встречи (2–20 студентов) с общей ссылкой Google Meet.',
                    createBtn: 'Создать групповую сессию',
                    empty: 'У вас пока нет групповых сессий. Создайте первую!',
                    seats: 'мест занято',
                    perSeat: 'сум / место',
                    startBtn: 'Начать сессию',
                    joinRoom: 'Войти в комнату',
                    rescheduleBtn: 'Перенести',
                    cancelBtn: 'Отменить',
                    noShowHint:
                        'Если не начать сессию в течение 15 минут после старта, она отменится автоматически.',
                }
              : {
                    groupDiscoveryTitle: 'Accept Group Conversations',
                    groupDiscoveryDescOn:
                        'Students can discover your speaking clubs in the catalog. Creating a group session enables this automatically.',
                    groupDiscoveryDescOff:
                        'Currently offering 1-on-1 sessions only. Enable this or schedule a group session below anytime.',
                    acceptGroupLabel: 'Group sessions active',
                    pauseOneOnOneLabel: 'Group Only (pause 1-on-1 discovery)',
                    heading: 'Group Conversation Sessions',
                    subtitle:
                        'Schedule fixed-time speaking clubs (2–20 seats) with one shared Google Meet link.',
                    createBtn: 'Create Group Session',
                    empty: 'No group sessions scheduled yet. Create your first speaking club!',
                    seats: 'seats taken',
                    perSeat: 'UZS / seat',
                    startBtn: 'Start Session',
                    joinRoom: 'Open Meet',
                    rescheduleBtn: 'Reschedule',
                    cancelBtn: 'Cancel',
                    noShowHint:
                        'Auto-cancels if not started within 15 minutes of start time.',
                };

    const isGroupEnabled = formatPref === 'group' || formatPref === 'both';

    const updateFormatPreference = async (
        nextFormat: 'one_on_one' | 'group' | 'both',
    ) => {
        setSavingFormat(true);
        try {
            await axios.post('/teacher/session-format-preferences', {
                preferred_session_format: nextFormat,
            });
            setFormatPref(nextFormat);
            toast.success('Teaching format preference updated.');
        } catch (err: any) {
            toast.error(
                err?.response?.data?.message || 'Failed to update preference.',
            );
        } finally {
            setSavingFormat(false);
        }
    };

    const toggleGroupEnabled = () => {
        if (isGroupEnabled) {
            updateFormatPreference('one_on_one');
        } else {
            updateFormatPreference('both');
        }
    };

    const toggleGroupOnly = () => {
        updateFormatPreference(formatPref === 'group' ? 'both' : 'group');
    };

    const resolvedTargetLevel =
        levelMode === 'custom'
            ? customLevel.trim() || 'All Levels'
            : levelPreset;

    const numericPrice = Number(pricePerSeat.replace(/\D/g, '')) || 0;
    const numericSeats = Number(maxSeats) || 0;
    const numericDuration = Number(duration) || 60;
    const maxGrossRevenue = numericPrice * numericSeats;
    // Net cash after 2% gateway fee (0.98), teacher keeps 80% of net cash = 78.4%
    const estimatedTeacherPayout = Math.round(maxGrossRevenue * 0.98 * 0.8);

    // Quick Tashkent time helper presets
    const applyQuickTime = (daysAhead: number, hour: number, minute = 0) => {
        const nowTashkent = new Date(
            new Date().toLocaleString('en-US', { timeZone: 'Asia/Tashkent' }),
        );
        nowTashkent.setDate(nowTashkent.getDate() + daysAhead);
        nowTashkent.setHours(hour, minute, 0, 0);
        const y = nowTashkent.getFullYear();
        const m = String(nowTashkent.getMonth() + 1).padStart(2, '0');
        const d = String(nowTashkent.getDate()).padStart(2, '0');
        const hh = String(hour).padStart(2, '0');
        const mm = String(minute).padStart(2, '0');
        setStartAt(`${y}-${m}-${d}T${hh}:${mm}`);
        setFieldErrors((prev) => ({ ...prev, start_at: '' }));
    };

    // Live conflict detection in Asia/Tashkent (+05:00)
    const conflictMessage = useMemo(() => {
        if (!startAt || numericDuration < 30) return null;
        const proposedStartMs = Date.parse(`${startAt}:00+05:00`);
        if (Number.isNaN(proposedStartMs)) return null;
        const proposedEndMs = proposedStartMs + numericDuration * 60 * 1000;

        if (proposedStartMs <= Date.now()) {
            return 'Start time must be in the future (Asia/Tashkent UTC+5).';
        }

        for (const gs of sessions) {
            if (gs.status !== 'scheduled' && gs.status !== 'in_progress') {
                continue;
            }
            const sMs = Date.parse(gs.start_at);
            const eMs = Date.parse(gs.end_at);
            if (!Number.isNaN(sMs) && !Number.isNaN(eMs)) {
                if (sMs < proposedEndMs && eMs > proposedStartMs) {
                    const startLabel = new Date(sMs).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Asia/Tashkent',
                    });
                    const endLabel = new Date(eMs).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Asia/Tashkent',
                    });
                    return `Overlaps existing group session "${gs.title}" (${startLabel}–${endLabel}).`;
                }
            }
        }

        for (const apt of existingAppointments) {
            if (
                apt.status &&
                !['pending', 'accepted', 'confirmed'].includes(apt.status)
            ) {
                continue;
            }
            const aMs = Date.parse(apt.start_at);
            const bMs = Date.parse(apt.end_at);
            if (!Number.isNaN(aMs) && !Number.isNaN(bMs)) {
                if (aMs < proposedEndMs && bMs > proposedStartMs) {
                    const startLabel = new Date(aMs).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Asia/Tashkent',
                    });
                    const endLabel = new Date(bMs).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Asia/Tashkent',
                    });
                    return `Overlaps a 1-on-1 booking (${startLabel}–${endLabel}).`;
                }
            }
        }

        return null;
    }, [startAt, numericDuration, sessions, existingAppointments]);

    const validateClientForm = (): boolean => {
        const nextErrors: Record<string, string> = {};
        if (title.trim().length < 3) {
            nextErrors.title = 'Please enter a clear title (at least 3 characters).';
        }
        if (!startAt) {
            nextErrors.start_at = 'Please select a start date and time.';
        } else if (conflictMessage) {
            nextErrors.start_at = conflictMessage;
        }
        if (numericDuration < 30 || numericDuration > 180) {
            nextErrors.duration_minutes = 'Duration must be between 30 and 180 minutes.';
        }
        if (numericSeats < 2 || numericSeats > 20) {
            nextErrors.max_seats = 'Seat capacity must be between 2 and 20 students.';
        }
        if (numericPrice < 1000) {
            nextErrors.price_per_seat = 'Price per seat must be at least 1,000 UZS.';
        }
        setFieldErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateClientForm()) {
            return;
        }

        setSubmitting(true);
        setFieldErrors({});
        try {
            const res = await axios.post('/teacher/group-sessions', {
                title: title.trim(),
                topic: topic.trim() || null,
                target_level: resolvedTargetLevel,
                start_at: startAt,
                duration_minutes: numericDuration,
                max_seats: numericSeats,
                price_per_seat: numericPrice,
            });
            if (res.data?.session) {
                setSessions((prev) => [res.data.session, ...prev]);
            } else {
                router.reload({ only: ['groupSessions'] });
            }
            if (!isGroupEnabled) {
                setFormatPref('both');
            }
            toast.success('Group conversation scheduled and visible to pupils!');
            setCreateOpen(false);
            setTitle('');
            setTopic('');
            setCustomLevel('');
        } catch (err: any) {
            const serverErrors = err?.response?.data?.errors;
            if (serverErrors && typeof serverErrors === 'object') {
                const mapped: Record<string, string> = {};
                Object.entries(serverErrors).forEach(([key, msgs]) => {
                    mapped[key] = Array.isArray(msgs) ? String(msgs[0]) : String(msgs);
                });
                setFieldErrors(mapped);
            }
            const firstErr =
                (serverErrors ? Object.values(serverErrors)[0] : null) ||
                err?.response?.data?.message ||
                'Failed to create group session.';
            toast.error(String(Array.isArray(firstErr) ? firstErr[0] : firstErr));
        } finally {
            setSubmitting(false);
        }
    };

    const handleReschedule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reschedulingSession) return;
        setSubmitting(true);
        setRescheduleError('');
        try {
            await axios.put(
                `/teacher/group-sessions/${reschedulingSession.id}`,
                {
                    start_at: rescheduleStartAt,
                    duration_minutes: Number(rescheduleDuration),
                },
            );
            toast.success('Group session rescheduled.');
            setReschedulingSession(null);
            router.reload({ only: ['groupSessions'] });
        } catch (err: any) {
            const firstErr =
                Object.values(err?.response?.data?.errors || {})[0] ||
                err?.response?.data?.message ||
                'Failed to reschedule.';
            const msg = String(Array.isArray(firstErr) ? firstErr[0] : firstErr);
            setRescheduleError(msg);
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleStart = async (session: GroupSessionItem) => {
        setBusySessionId(session.id);
        try {
            const res = await axios.post(
                `/teacher/group-sessions/${session.id}/start`,
            );
            toast.success('Group conversation started!');
            if (res.data?.google_meet_link) {
                window.open(res.data.google_meet_link, '_blank');
            }
            router.reload({ only: ['groupSessions'] });
        } catch (err: any) {
            toast.error(
                err?.response?.data?.message || 'Unable to start session.',
            );
        } finally {
            setBusySessionId(null);
        }
    };

    const handleConfirmCancel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cancellingSession) return;
        setBusySessionId(cancellingSession.id);
        try {
            await axios.post(
                `/teacher/group-sessions/${cancellingSession.id}/cancel`,
                {
                    reason: cancelReason.trim() || 'Cancelled by teacher.',
                },
            );
            toast.success('Group session cancelled.');
            setCancellingSession(null);
            setCancelReason('');
            router.reload({ only: ['groupSessions'] });
        } catch (err: any) {
            toast.error(
                err?.response?.data?.message || 'Unable to cancel session.',
            );
        } finally {
            setBusySessionId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Simplified Discovery Toggle Card */}
            <Card className="border-border/80">
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-foreground">
                                {copy.groupDiscoveryTitle}
                            </h3>
                            <Badge
                                variant={isGroupEnabled ? 'default' : 'secondary'}
                                className={
                                    isGroupEnabled
                                        ? 'bg-emerald-600 text-white'
                                        : ''
                                }
                            >
                                {isGroupEnabled ? 'Visible' : '1-on-1 Only'}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {isGroupEnabled
                                ? copy.groupDiscoveryDescOn
                                : copy.groupDiscoveryDescOff}
                        </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                size="sm"
                                disabled={savingFormat}
                                variant={isGroupEnabled ? 'default' : 'outline'}
                                onClick={toggleGroupEnabled}
                                className={`rounded-xl text-xs font-semibold ${
                                    isGroupEnabled
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                        : ''
                                }`}
                            >
                                {savingFormat ? (
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                )}
                                {copy.acceptGroupLabel}: {isGroupEnabled ? 'ON' : 'OFF'}
                            </Button>
                        </div>

                        {isGroupEnabled && (
                            <label className="flex cursor-pointer items-center gap-2 text-[11px] font-medium text-muted-foreground">
                                <input
                                    type="checkbox"
                                    checked={formatPref === 'group'}
                                    disabled={savingFormat}
                                    onChange={toggleGroupOnly}
                                    className="h-3.5 w-3.5 rounded border-border accent-brand-navy"
                                />
                                <span>{copy.pauseOneOnOneLabel}</span>
                            </label>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Google Calendar reminder if disconnected */}
            {!googleConnected && (
                <div className="flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>
                            Google Calendar is not connected yet. Connect it so starting a group session generates a shared Google Meet link automatically.
                        </span>
                    </div>
                    <a
                        href="/auth/google?calendar=1"
                        className="shrink-0 font-bold underline underline-offset-2 hover:text-amber-700"
                    >
                        Connect Google Calendar
                    </a>
                </div>
            )}

            {/* Header + Create Button */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="text-lg font-bold text-foreground">
                        {copy.heading}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        {copy.subtitle} {copy.noShowHint}
                    </p>
                </div>
                <Button
                    type="button"
                    onClick={() => {
                        setFieldErrors({});
                        setCreateOpen(true);
                    }}
                    className="shrink-0 rounded-xl bg-brand-navy text-white hover:bg-brand-navy/90 dark:bg-brand-yellow dark:text-brand-navy"
                >
                    <Plus className="mr-1.5 h-4 w-4" />
                    {copy.createBtn}
                </Button>
            </div>

            {/* Sessions List */}
            {sessions.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
                        <p className="text-sm font-semibold text-foreground">
                            {copy.empty}
                        </p>
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                                setFieldErrors({});
                                setCreateOpen(true);
                            }}
                            className="mt-4 rounded-xl bg-brand-navy text-white hover:bg-brand-navy/90 dark:bg-brand-yellow dark:text-brand-navy"
                        >
                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                            {copy.createBtn}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {sessions.map((session) => {
                        const occupied =
                            session.occupied_seats ??
                            session.enrollments?.filter(
                                (e) => e.status !== 'cancelled',
                            ).length ??
                            0;
                        const isActionable =
                            session.status === 'scheduled' ||
                            session.status === 'in_progress';

                        return (
                            <Card key={session.id} className="flex flex-col">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <CardTitle className="truncate text-base">
                                                {session.title}
                                            </CardTitle>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {session.target_level} ·{' '}
                                                {session.duration_minutes} min
                                            </p>
                                        </div>
                                        <Badge
                                            variant={
                                                session.status === 'cancelled'
                                                    ? 'destructive'
                                                    : session.status ===
                                                        'in_progress'
                                                      ? 'default'
                                                      : 'secondary'
                                            }
                                            className="shrink-0 capitalize"
                                        >
                                            {session.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex flex-1 flex-col justify-between gap-4 text-xs">
                                    <div className="space-y-2">
                                        {session.topic && (
                                            <p className="line-clamp-2 text-muted-foreground">
                                                {session.topic}
                                            </p>
                                        )}
                                        <div className="flex flex-wrap items-center gap-3 font-semibold text-foreground tabular-nums">
                                            <span className="inline-flex items-center gap-1">
                                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                {new Date(
                                                    session.start_at,
                                                ).toLocaleString()}
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                                {occupied}/{session.max_seats}{' '}
                                                {copy.seats}
                                            </span>
                                        </div>
                                        <p className="font-bold text-brand-navy tabular-nums dark:text-brand-yellow">
                                            {formatSpaceNumber(session.price_per_seat)}{' '}
                                            {copy.perSeat}
                                        </p>
                                        {session.cancellation_reason && (
                                            <p className="text-[11px] text-rose-600 dark:text-rose-400">
                                                {session.cancellation_reason}
                                            </p>
                                        )}
                                    </div>

                                    {isActionable && (
                                        <div className="flex flex-wrap gap-2 border-t pt-3">
                                            {session.google_meet_link &&
                                            session.meeting_started ? (
                                                <a
                                                    href={
                                                        session.google_meet_link
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                                                >
                                                    <Play className="h-3.5 w-3.5" />
                                                    {copy.joinRoom}
                                                </a>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    disabled={
                                                        busySessionId ===
                                                        session.id
                                                    }
                                                    onClick={() =>
                                                        handleStart(session)
                                                    }
                                                    className="h-8 bg-emerald-600 text-white hover:bg-emerald-700"
                                                >
                                                    {busySessionId ===
                                                    session.id ? (
                                                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <Play className="mr-1 h-3.5 w-3.5" />
                                                    )}
                                                    {copy.startBtn}
                                                </Button>
                                            )}

                                            {session.status === 'scheduled' &&
                                                !session.meeting_started && (
                                                    <>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={
                                                                busySessionId ===
                                                                session.id
                                                            }
                                                            onClick={() => {
                                                                setRescheduleError('');
                                                                setReschedulingSession(
                                                                    session,
                                                                );
                                                                setRescheduleStartAt(
                                                                    toTashkentDatetimeLocal(
                                                                        new Date(
                                                                            session.start_at,
                                                                        ),
                                                                    ),
                                                                );
                                                                setRescheduleDuration(
                                                                    String(
                                                                        session.duration_minutes,
                                                                    ),
                                                                );
                                                            }}
                                                            className="h-8"
                                                        >
                                                            <RefreshCw className="mr-1 h-3.5 w-3.5" />
                                                            {copy.rescheduleBtn}
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="ghost"
                                                            disabled={
                                                                busySessionId ===
                                                                session.id
                                                            }
                                                            onClick={() => {
                                                                setCancelReason('');
                                                                setCancellingSession(
                                                                    session,
                                                                );
                                                            }}
                                                            className="h-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                                        >
                                                            <XCircle className="mr-1 h-3.5 w-3.5" />
                                                            {copy.cancelBtn}
                                                        </Button>
                                                    </>
                                                )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Create Modal (Preset + Custom + Live Conflict & Payout Preview) */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{copy.createBtn}</DialogTitle>
                        <DialogDescription>{copy.subtitle}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} noValidate className="space-y-4">
                        {/* Title */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="gs_title">Title</Label>
                            <Input
                                id="gs_title"
                                required
                                value={title}
                                aria-invalid={Boolean(fieldErrors.title)}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    if (fieldErrors.title) {
                                        setFieldErrors((p) => ({ ...p, title: '' }));
                                    }
                                }}
                                placeholder="IELTS Speaking Part 2 & 3 Debates"
                            />
                            {fieldErrors.title && (
                                <p className="text-xs font-medium text-destructive">
                                    {fieldErrors.title}
                                </p>
                            )}
                        </div>

                        {/* Topic */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="gs_topic">
                                Topic / Description{' '}
                                <span className="font-normal text-muted-foreground">
                                    (optional)
                                </span>
                            </Label>
                            <Textarea
                                id="gs_topic"
                                rows={2}
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="Guided discussion with vocabulary & fluency feedback."
                            />
                        </div>

                        {/* Target Level: Preset + Custom */}
                        <div className="grid gap-2">
                            <Label>Target Level</Label>
                            <div className="flex flex-wrap gap-1.5">
                                {LEVEL_PRESETS.map((preset) => {
                                    const active =
                                        levelMode === 'preset' &&
                                        levelPreset === preset.value;
                                    return (
                                        <Button
                                            key={preset.value}
                                            type="button"
                                            size="sm"
                                            variant={active ? 'default' : 'outline'}
                                            onClick={() => {
                                                setLevelMode('preset');
                                                setLevelPreset(preset.value);
                                            }}
                                            className="h-7 rounded-lg px-2.5 text-xs"
                                        >
                                            {preset.label}
                                        </Button>
                                    );
                                })}
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={
                                        levelMode === 'custom'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    onClick={() => setLevelMode('custom')}
                                    className="h-7 rounded-lg px-2.5 text-xs"
                                >
                                    + Custom
                                </Button>
                            </div>
                            {levelMode === 'custom' && (
                                <Input
                                    value={customLevel}
                                    onChange={(e) => setCustomLevel(e.target.value)}
                                    placeholder="e.g. Band 7–8, Business English"
                                    maxLength={40}
                                />
                            )}
                        </div>

                        {/* Start Date & Time + Quick Picks + Overlap Check */}
                        <div className="grid gap-1.5">
                            <div className="flex items-center justify-between gap-2">
                                <Label htmlFor="gs_start">Start Date & Time</Label>
                                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    Asia/Tashkent (UTC+5)
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 pb-1">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => applyQuickTime(1, 19, 0)}
                                    className="h-6 rounded-md px-2 text-[11px]"
                                >
                                    Tomorrow 19:00
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => applyQuickTime(1, 20, 30)}
                                    className="h-6 rounded-md px-2 text-[11px]"
                                >
                                    Tomorrow 20:30
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => applyQuickTime(2, 19, 0)}
                                    className="h-6 rounded-md px-2 text-[11px]"
                                >
                                    In 2 days 19:00
                                </Button>
                            </div>
                            <Input
                                id="gs_start"
                                type="datetime-local"
                                required
                                value={startAt}
                                aria-invalid={Boolean(
                                    fieldErrors.start_at || conflictMessage,
                                )}
                                onChange={(e) => {
                                    setStartAt(e.target.value);
                                    if (fieldErrors.start_at) {
                                        setFieldErrors((p) => ({
                                            ...p,
                                            start_at: '',
                                        }));
                                    }
                                }}
                            />
                            {(fieldErrors.start_at || conflictMessage) && (
                                <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                    <span>
                                        {fieldErrors.start_at || conflictMessage}
                                    </span>
                                </p>
                            )}
                        </div>

                        {/* Duration: Preset + Custom */}
                        <div className="grid gap-1.5">
                            <Label>Duration (minutes)</Label>
                            <div className="flex flex-wrap items-center gap-1.5">
                                {DURATION_PRESETS.map((mins) => {
                                    const active =
                                        durationMode === 'preset' &&
                                        Number(duration) === mins;
                                    return (
                                        <Button
                                            key={mins}
                                            type="button"
                                            size="sm"
                                            variant={active ? 'default' : 'outline'}
                                            onClick={() => {
                                                setDurationMode('preset');
                                                setDuration(String(mins));
                                            }}
                                            className="h-7 rounded-lg px-2.5 text-xs tabular-nums"
                                        >
                                            {mins} min
                                        </Button>
                                    );
                                })}
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={
                                        durationMode === 'custom'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    onClick={() => setDurationMode('custom')}
                                    className="h-7 rounded-lg px-2.5 text-xs"
                                >
                                    Custom
                                </Button>
                                {durationMode === 'custom' && (
                                    <Input
                                        type="number"
                                        min={30}
                                        max={180}
                                        value={duration}
                                        onChange={(e) =>
                                            setDuration(e.target.value)
                                        }
                                        className="h-7 w-24 text-xs tabular-nums"
                                    />
                                )}
                            </div>
                            {fieldErrors.duration_minutes && (
                                <p className="text-xs font-medium text-destructive">
                                    {fieldErrors.duration_minutes}
                                </p>
                            )}
                        </div>

                        {/* Max Seats: Preset + Custom */}
                        <div className="grid gap-1.5">
                            <Label>Max Seats (2–20 students)</Label>
                            <div className="flex flex-wrap items-center gap-1.5">
                                {SEAT_PRESETS.map((seats) => {
                                    const active =
                                        seatsMode === 'preset' &&
                                        Number(maxSeats) === seats;
                                    return (
                                        <Button
                                            key={seats}
                                            type="button"
                                            size="sm"
                                            variant={active ? 'default' : 'outline'}
                                            onClick={() => {
                                                setSeatsMode('preset');
                                                setMaxSeats(String(seats));
                                            }}
                                            className="h-7 rounded-lg px-2.5 text-xs tabular-nums"
                                        >
                                            {seats} seats
                                        </Button>
                                    );
                                })}
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={
                                        seatsMode === 'custom'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    onClick={() => setSeatsMode('custom')}
                                    className="h-7 rounded-lg px-2.5 text-xs"
                                >
                                    Custom
                                </Button>
                                {seatsMode === 'custom' && (
                                    <Input
                                        type="number"
                                        min={2}
                                        max={20}
                                        value={maxSeats}
                                        onChange={(e) =>
                                            setMaxSeats(e.target.value)
                                        }
                                        className="h-7 w-20 text-xs tabular-nums"
                                    />
                                )}
                            </div>
                            {fieldErrors.max_seats && (
                                <p className="text-xs font-medium text-destructive">
                                    {fieldErrors.max_seats}
                                </p>
                            )}
                        </div>

                        {/* Price / Seat: Preset + Custom + Payout Preview */}
                        <div className="grid gap-2">
                            <Label htmlFor="gs_price">Price / Seat (UZS)</Label>
                            <div className="flex flex-wrap gap-1.5">
                                {PRICE_PRESETS.map((p) => {
                                    const active = numericPrice === p;
                                    return (
                                        <Button
                                            key={p}
                                            type="button"
                                            size="sm"
                                            variant={active ? 'default' : 'outline'}
                                            onClick={() => {
                                                setPricePerSeat(
                                                    formatPriceInput(String(p)),
                                                );
                                                setFieldErrors((prev) => ({
                                                    ...prev,
                                                    price_per_seat: '',
                                                }));
                                            }}
                                            className="h-7 rounded-lg px-2.5 text-xs tabular-nums"
                                        >
                                            {formatSpaceNumber(p)}
                                        </Button>
                                    );
                                })}
                            </div>
                            <Input
                                id="gs_price"
                                required
                                value={pricePerSeat}
                                aria-invalid={Boolean(fieldErrors.price_per_seat)}
                                onChange={(e) => {
                                    setPricePerSeat(
                                        formatPriceInput(e.target.value),
                                    );
                                    if (fieldErrors.price_per_seat) {
                                        setFieldErrors((prev) => ({
                                            ...prev,
                                            price_per_seat: '',
                                        }));
                                    }
                                }}
                                placeholder="50 000"
                                className="tabular-nums"
                            />
                            {fieldErrors.price_per_seat && (
                                <p className="text-xs font-medium text-destructive">
                                    {fieldErrors.price_per_seat}
                                </p>
                            )}

                            {/* Live Revenue Preview */}
                            <div className="rounded-xl border border-border/70 bg-muted/40 p-3 text-xs">
                                <div className="flex items-center justify-between font-semibold text-foreground tabular-nums">
                                    <span className="inline-flex items-center gap-1.5">
                                        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                                        Est. teacher payout if full ({numericSeats} seats)
                                    </span>
                                    <span className="text-emerald-700 dark:text-emerald-400">
                                        ~{formatSpaceNumber(estimatedTeacherPayout)} UZS
                                    </span>
                                </div>
                                <p className="mt-1 text-[11px] text-muted-foreground tabular-nums">
                                    {formatSpaceNumber(numericPrice)} UZS/seat × {numericSeats} = {formatSpaceNumber(maxGrossRevenue)} UZS gross · 80% of net cash after 2% gateway fee · Vouchers disabled.
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCreateOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting || Boolean(conflictMessage)}
                            >
                                {submitting && (
                                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                                )}
                                Create Session
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Reschedule Modal */}
            <Dialog
                open={Boolean(reschedulingSession)}
                onOpenChange={() => setReschedulingSession(null)}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{copy.rescheduleBtn}</DialogTitle>
                        <DialogDescription>
                            {reschedulingSession?.title}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleReschedule} className="space-y-4">
                        <div className="grid gap-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="resched_start">New Start Time</Label>
                                <span className="text-[11px] text-muted-foreground">
                                    Asia/Tashkent
                                </span>
                            </div>
                            <Input
                                id="resched_start"
                                type="datetime-local"
                                required
                                value={rescheduleStartAt}
                                onChange={(e) => {
                                    setRescheduleStartAt(e.target.value);
                                    setRescheduleError('');
                                }}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="resched_dur">Duration (min)</Label>
                            <Input
                                id="resched_dur"
                                type="number"
                                min={30}
                                max={180}
                                required
                                value={rescheduleDuration}
                                onChange={(e) =>
                                    setRescheduleDuration(e.target.value)
                                }
                            />
                        </div>
                        {rescheduleError && (
                            <p className="text-xs font-medium text-destructive">
                                {rescheduleError}
                            </p>
                        )}
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setReschedulingSession(null)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting && (
                                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                                )}
                                Save New Time
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Clean Cancel Confirmation Modal */}
            <Dialog
                open={Boolean(cancellingSession)}
                onOpenChange={() => setCancellingSession(null)}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{copy.cancelBtn}</DialogTitle>
                        <DialogDescription>
                            {cancellingSession?.title} — enrolled pupils will be notified automatically.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleConfirmCancel} className="space-y-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="cancel_reason">
                                Reason{' '}
                                <span className="font-normal text-muted-foreground">
                                    (optional)
                                </span>
                            </Label>
                            <Textarea
                                id="cancel_reason"
                                rows={2}
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="e.g., Schedule conflict or unexpected illness"
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCancellingSession(null)}
                            >
                                Keep Session
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={
                                    Boolean(cancellingSession) &&
                                    busySessionId === cancellingSession?.id
                                }
                            >
                                Confirm Cancellation
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
