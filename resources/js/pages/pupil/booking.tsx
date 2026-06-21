import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import {
    Calendar as CalendarIcon,
    Clock,
    CheckCircle2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    X,
    Info,
    Star,
    User,
    BookOpen,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Props {
    teacher: any;
}

const weeksShortMap = {
    en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    uz: ['D', 'S', 'Ch', 'P', 'J', 'Sh', 'Y'],
    ru: ['П', 'В', 'С', 'Ч', 'П', 'С', 'В'],
};

const monthsMap = {
    en: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ],
    uz: [
        'Yanvar',
        'Fevral',
        'Mart',
        'Aprel',
        'May',
        'Iyun',
        'Iyul',
        'Avgust',
        'Sentyabr',
        'Oktyabr',
        'Noyabr',
        'Dekabr',
    ],
    ru: [
        'Январь',
        'Февраль',
        'Март',
        'Апрель',
        'Май',
        'Июнь',
        'Июль',
        'Август',
        'Сентябрь',
        'Октябрь',
        'Ноябрь',
        'Декабрь',
    ],
};

const localeMap = {
    en: 'en-US',
    uz: 'uz-UZ',
    ru: 'ru-RU',
};

export default function Booking({ teacher }: Props) {
    const { auth } = usePage<any>().props;
    const { t, locale } = useTranslation();

    // Default to en if locale is not supported
    const lang = (
        locale === 'en' || locale === 'uz' || locale === 'ru' ? locale : 'en'
    ) as 'en' | 'uz' | 'ru';

    const [view, setView] = useState<'day' | 'week'>('day');
    const [showSidebar, setShowSidebar] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [currentDate, setCurrentDate] = useState<Date>(new Date()); // Month focus for mini-calendar
    const [slotsByDate, setSlotsByDate] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(false);
    const [booking, setBooking] = useState(false);
    const [customStartTime, setCustomStartTime] = useState('');
    const [customEndTime, setCustomEndTime] = useState('');
    const [confirmingSlot, setConfirmingSlot] = useState<any | null>(null);
    const [selectedStartStr, setSelectedStartStr] = useState('');
    const [selectedEndStr, setSelectedEndStr] = useState('');

    const formatTimeToHHMM = (date: Date) => {
        const h = String(date.getHours()).padStart(2, '0');
        const m = String(date.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
    };

    useEffect(() => {
        if (confirmingSlot) {
            const start = new Date(confirmingSlot.start_at);
            const end = new Date(confirmingSlot.end_at);
            setSelectedStartStr(formatTimeToHHMM(start));

            // Default to start + 30 minutes, or end if less than 30 mins remaining
            const defaultEnd = new Date(start.getTime() + 30 * 60 * 1000);
            if (defaultEnd.getTime() > end.getTime()) {
                setSelectedEndStr(formatTimeToHHMM(end));
            } else {
                setSelectedEndStr(formatTimeToHHMM(defaultEnd));
            }
        }
    }, [confirmingSlot]);

    const getSelectedStartAndEnd = () => {
        if (!confirmingSlot) return null;

        const baseDate = new Date(confirmingSlot.start_at);
        const [sh, sm] = selectedStartStr.split(':').map(Number);
        const startLocalDate = new Date(
            baseDate.getFullYear(),
            baseDate.getMonth(),
            baseDate.getDate(),
            sh,
            sm,
        );

        const [eh, em] = selectedEndStr.split(':').map(Number);
        const endLocalDate = new Date(
            baseDate.getFullYear(),
            baseDate.getMonth(),
            baseDate.getDate(),
            eh,
            em,
        );

        return { start: startLocalDate, end: endLocalDate };
    };

    const validateSelectedRange = () => {
        if (!confirmingSlot) return true;
        if (!confirmingSlot.is_all_time) return true;

        const dates = getSelectedStartAndEnd();
        if (!dates) return false;

        const limitStart = new Date(confirmingSlot.start_at);
        const limitEnd = new Date(confirmingSlot.end_at);

        return (
            dates.start.getTime() >= limitStart.getTime() &&
            dates.start.getTime() < limitEnd.getTime() &&
            dates.end.getTime() > dates.start.getTime() &&
            dates.end.getTime() <= limitEnd.getTime()
        );
    };

    const handleConfirmSubmit = () => {
        if (!confirmingSlot) return;

        let startAt = confirmingSlot.start_at;
        let endAt = confirmingSlot.end_at;

        if (confirmingSlot.is_all_time) {
            const dates = getSelectedStartAndEnd();
            if (!dates || !validateSelectedRange()) {
                toast.error(t('booking.invalid_range'));
                return;
            }
            startAt = dates.start.toISOString();
            endAt = dates.end.toISOString();
        }

        handleBook({ start_at: startAt, end_at: endAt });
        setConfirmingSlot(null);
    };

    // Live clock for red line indicator
    const [nowTime, setNowTime] = useState(new Date());
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setInterval(() => setNowTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Scroll to 8 AM on mount
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 480;
        }
    }, [view]);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first index

    const miniCalDays: (Date | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
        miniCalDays.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        miniCalDays.push(new Date(year, month, i));
    }

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const formatDateString = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const getWeekDays = (date: Date) => {
        const currentDay = date.getDay();
        const distance = currentDay === 0 ? -6 : 1 - currentDay; // distance to Monday
        const monday = new Date(date);
        monday.setDate(date.getDate() + distance);

        const weekDays: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(monday);
            day.setDate(monday.getDate() + i);
            weekDays.push(day);
        }
        return weekDays;
    };

    const fetchSlots = async () => {
        setLoading(true);
        try {
            if (view === 'day') {
                const dateStr = formatDateString(selectedDate);
                const response = await axios.get(
                    `/bookings/slots/${teacher.id}?date=${dateStr}`,
                );
                setSlotsByDate((prev) => ({
                    ...prev,
                    [dateStr]: response.data.slots,
                }));
            } else {
                const days = getWeekDays(selectedDate);
                const dateStrings = days.map((d) => formatDateString(d));

                // Fetch in parallel for all days in the week view
                const promises = dateStrings.map((d) =>
                    axios
                        .get(`/bookings/slots/${teacher.id}?date=${d}`)
                        .then((res) => ({ dateStr: d, slots: res.data.slots }))
                        .catch(() => ({ dateStr: d, slots: [] })),
                );

                const results = await Promise.all(promises);
                const newSlots: Record<string, any[]> = {};
                results.forEach((item) => {
                    newSlots[item.dateStr] = item.slots;
                });

                setSlotsByDate((prev) => ({
                    ...prev,
                    ...newSlots,
                }));
            }
        } catch (error) {
            toast.error('Failed to load slots');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSlots();

        // LIVE SYNC: Listen for booking updates
        const channel = window.Echo.channel(`teacher.${teacher.id}`);
        channel.listen('.booking.updated', (e: any) => {
            console.log('Booking updated event received:', e);
            fetchSlots(); // Refresh slots instantly
        });

        return () => {
            window.Echo.leaveChannel(`teacher.${teacher.id}`);
        };
    }, [selectedDate, view, teacher.id]);

    const handleBook = async (slot: any) => {
        setBooking(true);
        try {
            await axios.post('/bookings', {
                teacher_id: teacher.id,
                pupil_id: auth.user.id,
                start_at: slot.start_at,
                end_at: slot.end_at,
            });
            toast.success(t('booking.success'));
            fetchSlots();
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('booking.failed'));
        } finally {
            setBooking(false);
        }
    };

    const handleBookCustom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customStartTime || !customEndTime) {
            toast.error('Please select start and end times');
            return;
        }

        try {
            const dateStr = formatDateString(selectedDate);
            const [yearNum, monthNum, dayNum] = dateStr.split('-').map(Number);
            const [startHour, startMin] = customStartTime
                .split(':')
                .map(Number);
            const [endHour, endMin] = customEndTime.split(':').map(Number);

            const startLocal = new Date(
                yearNum,
                monthNum - 1,
                dayNum,
                startHour,
                startMin,
            );
            const endLocal = new Date(
                yearNum,
                monthNum - 1,
                dayNum,
                endHour,
                endMin,
            );

            // If end time is before or equal to start time, it belongs to the next day
            if (endLocal <= startLocal) {
                endLocal.setDate(endLocal.getDate() + 1);
            }

            const startAt = startLocal.toISOString();
            const endAt = endLocal.toISOString();

            setBooking(true);
            await axios.post('/bookings', {
                teacher_id: teacher.id,
                pupil_id: auth.user.id,
                start_at: startAt,
                end_at: endAt,
            });
            toast.success(t('booking.custom_success'));
            fetchSlots();
            setCustomStartTime('');
            setCustomEndTime('');
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('booking.failed'));
        } finally {
            setBooking(false);
        }
    };

    const getBlockStyle = (slot: any, colDate: Date) => {
        const startLocal = new Date(slot.start_at);
        const endLocal = new Date(slot.end_at);

        let startHour = startLocal.getHours();
        let startMinute = startLocal.getMinutes();
        let endHour = endLocal.getHours();
        let endMinute = endLocal.getMinutes();

        if (formatDateString(startLocal) !== formatDateString(colDate)) {
            startHour = 0;
            startMinute = 0;
        }

        if (formatDateString(endLocal) !== formatDateString(colDate)) {
            endHour = 24;
            endMinute = 0;
        }

        const startDecimal = startHour + startMinute / 60;
        const endDecimal = endHour + endMinute / 60;
        const duration = Math.max(0.5, endDecimal - startDecimal); // Min height is 30 mins

        return {
            top: `${startDecimal * 60}px`,
            height: `${duration * 60}px`,
        };
    };

    const getSlotsForDate = (colDate: Date) => {
        const colDateStart = new Date(colDate);
        colDateStart.setHours(0, 0, 0, 0);
        const colDateEnd = new Date(colDate);
        colDateEnd.setHours(23, 59, 59, 999);

        const allSlots: any[] = [];
        const seen = new Set<string>();

        Object.values(slotsByDate).forEach((slots) => {
            if (Array.isArray(slots)) {
                slots.forEach((slot) => {
                    const key = `${slot.start_at}-${slot.end_at}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        allSlots.push(slot);
                    }
                });
            }
        });

        return allSlots.filter((slot) => {
            const startLocal = new Date(slot.start_at);
            const endLocal = new Date(slot.end_at);
            return startLocal < colDateEnd && endLocal > colDateStart;
        });
    };

    const navigateCalendar = (direction: 'prev' | 'next') => {
        const amount = view === 'day' ? 1 : 7;
        const nextDate = new Date(selectedDate);
        nextDate.setDate(
            selectedDate.getDate() + (direction === 'prev' ? -amount : amount),
        );
        setSelectedDate(nextDate);
        setCurrentDate(nextDate);
    };

    const setToday = () => {
        const today = new Date();
        setSelectedDate(today);
        setCurrentDate(today);
    };

    const currentTitleString = () => {
        if (view === 'day') {
            return selectedDate.toLocaleDateString(localeMap[lang], {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            });
        } else {
            const days = getWeekDays(selectedDate);
            const startMonth = days[0].toLocaleDateString(localeMap[lang], {
                month: 'short',
            });
            const endMonth = days[6].toLocaleDateString(localeMap[lang], {
                month: 'short',
            });
            const startYear = days[0].getFullYear();
            const endYear = days[6].getFullYear();

            if (startYear !== endYear) {
                return `${startMonth} ${startYear} – ${endMonth} ${endYear}`;
            }
            if (startMonth !== endMonth) {
                return `${startMonth} – ${endMonth} ${startYear}`;
            }
            return `${days[0].toLocaleDateString(localeMap[lang], { month: 'long' })} ${startYear}`;
        }
    };

    return (
        <>
            <Head title={`Book with ${teacher.full_name}`} />

            <div className="flex h-[calc(100vh-4rem)] animate-in flex-col overflow-hidden bg-background duration-300 select-none fade-in">
                {/* Header (Google Calendar Style Toolbar) */}
                <div className="flex items-center justify-between border-b bg-card px-6 py-3.5">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                                <CalendarIcon className="h-5 w-5" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-foreground">
                                {t('booking.title')}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={setToday}
                                className="rounded-lg px-4 font-medium"
                            >
                                {t('booking.today')}
                            </Button>
                            <div className="flex items-center">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigateCalendar('prev')}
                                    className="h-8 w-8 rounded-lg"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigateCalendar('next')}
                                    className="h-8 w-8 rounded-lg"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                            <span className="ml-2 text-base font-bold text-foreground capitalize">
                                {currentTitleString()}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-semibold text-foreground md:hidden"
                        >
                            <CalendarIcon className="h-4 w-4 text-indigo-600" />
                            {showSidebar
                                ? t('booking.hide_sidebar')
                                : t('booking.show_sidebar')}
                        </Button>

                        {/* View Switcher */}
                        <div className="flex rounded-lg border bg-muted/30 p-1">
                            <Button
                                variant={view === 'day' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setView('day')}
                                className="rounded-md px-3.5 font-medium"
                            >
                                {t('booking.day')}
                            </Button>
                            <Button
                                variant={
                                    view === 'week' ? 'secondary' : 'ghost'
                                }
                                size="sm"
                                onClick={() => setView('week')}
                                className="rounded-md px-3.5 font-medium"
                            >
                                {t('booking.week')}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Workspace Layout */}
                <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
                    {/* Left Sidebar: Profile & Custom Booking */}
                    <div
                        className={`flex w-full shrink-0 flex-col gap-5 overflow-y-auto border-b bg-card p-4 md:w-80 md:border-r md:border-b-0 ${showSidebar ? 'flex max-h-[50vh]' : 'hidden md:flex'}`}
                    >
                        {/* Teacher Profile Card */}
                        <div className="flex flex-col items-center rounded-2xl border bg-muted/20 p-4 text-center shadow-sm">
                            <div className="mb-3 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl font-bold text-white shadow-lg">
                                {teacher.full_name
                                    .split(' ')
                                    .map((n: string) => n[0])
                                    .join('')
                                    .toUpperCase()}
                            </div>
                            <h2 className="text-lg leading-tight font-bold text-foreground">
                                {teacher.full_name}
                            </h2>
                            <p className="mt-1 mb-3 text-xs text-muted-foreground">
                                {teacher.email}
                            </p>

                            <div className="flex w-full flex-col gap-1.5 text-left text-xs">
                                <div className="flex justify-between border-b py-1">
                                    <span className="text-muted-foreground">
                                        {t('booking.ielts_level')}
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        {teacher.teacher_profile
                                            ?.overall_level || 'Certified'}
                                    </span>
                                </div>
                                {teacher.teacher_profile?.speaking_band && (
                                    <div className="flex justify-between border-b py-1">
                                        <span className="text-muted-foreground">
                                            {t('booking.speaking_band')}
                                        </span>
                                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                                            {
                                                teacher.teacher_profile
                                                    .speaking_band
                                            }
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between border-b py-1">
                                    <span className="text-muted-foreground">
                                        {t('booking.experience')}
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        {teacher.teacher_profile
                                            ?.experience_years || 0}{' '}
                                        {t('booking.years')}
                                    </span>
                                </div>
                                {teacher.teacher_profile?.rating_cache && (
                                    <div className="flex justify-between border-b py-1">
                                        <span className="text-muted-foreground">
                                            {t('booking.rating')}
                                        </span>
                                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                                            ★{' '}
                                            {
                                                teacher.teacher_profile
                                                    .rating_cache
                                            }
                                        </span>
                                    </div>
                                )}
                                {teacher.teacher_profile?.workplace && (
                                    <div className="flex justify-between border-b py-1">
                                        <span className="text-muted-foreground">
                                            {t('booking.workplace')}
                                        </span>
                                        <span className="max-w-[120px] truncate font-semibold text-foreground">
                                            {teacher.teacher_profile.workplace}
                                        </span>
                                    </div>
                                )}
                                {teacher.teacher_profile?.age && (
                                    <div className="flex justify-between border-b py-1">
                                        <span className="text-muted-foreground">
                                            {t('booking.age')}
                                        </span>
                                        <span className="font-semibold text-foreground">
                                            {teacher.teacher_profile.age}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mini Calendar */}
                        <div className="flex flex-col gap-2 border-t pt-4">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-sm font-bold text-foreground capitalize">
                                    {monthsMap[lang][month]} {year}
                                </span>
                                <div className="flex items-center">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={prevMonth}
                                        className="h-7 w-7 rounded-lg"
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={nextMonth}
                                        className="h-7 w-7 rounded-lg"
                                    >
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>

                            <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground uppercase">
                                {weeksShortMap[lang].map((w, idx) => (
                                    <span key={idx}>{w}</span>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {miniCalDays.map((day, idx) => {
                                    if (day === null) {
                                        return (
                                            <div
                                                key={`empty-${idx}`}
                                                className="aspect-square"
                                            ></div>
                                        );
                                    }

                                    const isSelected =
                                        formatDateString(day) ===
                                        formatDateString(selectedDate);
                                    const isToday =
                                        formatDateString(day) ===
                                        formatDateString(new Date());

                                    return (
                                        <button
                                            key={`day-${day.getTime()}`}
                                            onClick={() => {
                                                setSelectedDate(day);
                                                setCurrentDate(day);
                                            }}
                                            className={`relative flex aspect-square items-center justify-center rounded-full text-xs font-semibold transition-all ${
                                                isSelected
                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                    : isToday
                                                      ? 'border border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-400'
                                                      : 'text-foreground hover:bg-muted'
                                            }`}
                                        >
                                            <span>{day.getDate()}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Request Custom Time Form */}
                        <div className="flex flex-col gap-3 border-t pt-4">
                            <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                                <Clock className="h-4 w-4 text-indigo-500" />
                                {t('booking.custom_title')}
                            </h3>
                            <form
                                onSubmit={handleBookCustom}
                                className="space-y-3"
                            >
                                <div>
                                    <Label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                                        {t('booking.custom_start')}
                                    </Label>
                                    <input
                                        type="time"
                                        value={customStartTime}
                                        onChange={(e) =>
                                            setCustomStartTime(e.target.value)
                                        }
                                        className="w-full rounded-xl border bg-background px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                                        {t('booking.custom_end')}
                                    </Label>
                                    <input
                                        type="time"
                                        value={customEndTime}
                                        onChange={(e) =>
                                            setCustomEndTime(e.target.value)
                                        }
                                        className="w-full rounded-xl border bg-background px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={booking}
                                    className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-4 text-xs font-semibold text-white shadow-md transition-all hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50"
                                >
                                    {booking
                                        ? t('booking.requesting')
                                        : t('booking.custom_submit')}
                                </Button>
                            </form>
                        </div>
                    </div>

                    {/* Timeline & Columns Workspace */}
                    <div className="flex flex-1 flex-col overflow-hidden bg-muted/5">
                        {/* Day/Week header row */}
                        <div className="flex border-b bg-card">
                            <div className="w-14 flex-shrink-0 border-r bg-card md:w-16"></div>
                            <div className="flex flex-1 overflow-hidden">
                                {view === 'day' ? (
                                    <div className="flex flex-1 flex-col items-center py-3 text-center">
                                        <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                            {selectedDate.toLocaleDateString(
                                                localeMap[lang],
                                                { weekday: 'short' },
                                            )}
                                        </span>
                                        <span
                                            className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full text-xl font-bold ${
                                                formatDateString(
                                                    selectedDate,
                                                ) ===
                                                formatDateString(new Date())
                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                                    : ''
                                            }`}
                                        >
                                            {selectedDate.getDate()}
                                        </span>
                                    </div>
                                ) : (
                                    getWeekDays(selectedDate).map(
                                        (day, idx) => {
                                            const isToday =
                                                formatDateString(day) ===
                                                formatDateString(new Date());
                                            const isSelected =
                                                formatDateString(day) ===
                                                formatDateString(selectedDate);
                                            return (
                                                <div
                                                    key={idx}
                                                    className="flex min-w-[35px] flex-1 flex-col items-center border-r py-1.5 text-center last:border-r-0 md:min-w-[100px] md:py-3"
                                                >
                                                    <span className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase md:text-xs">
                                                        {day.toLocaleDateString(
                                                            localeMap[lang],
                                                            {
                                                                weekday:
                                                                    'short',
                                                            },
                                                        )}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedDate(
                                                                day,
                                                            );
                                                            setCurrentDate(day);
                                                        }}
                                                        className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all md:h-9 md:w-9 md:text-xl ${
                                                            isToday
                                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                                                : isSelected
                                                                  ? 'border border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400'
                                                                  : 'text-foreground hover:bg-muted'
                                                        }`}
                                                    >
                                                        {day.getDate()}
                                                    </button>
                                                </div>
                                            );
                                        },
                                    )
                                )}
                            </div>
                        </div>

                        {/* Vertical Timeline Scroll Grid */}
                        <div
                            ref={scrollContainerRef}
                            className="relative flex flex-1 overflow-y-auto"
                        >
                            {/* Y-Axis Hours label */}
                            <div
                                className="relative flex w-14 flex-shrink-0 flex-col border-r bg-card select-none md:w-16"
                                style={{ height: '1440px' }}
                            >
                                {Array.from({ length: 24 }).map((_, hour) => (
                                    <div
                                        key={hour}
                                        className="absolute right-2 text-[9px] font-bold text-muted-foreground/70 md:right-3 md:text-[10px]"
                                        style={{ top: `${hour * 60 - 8}px` }}
                                    >
                                        {hour === 0
                                            ? '12 AM'
                                            : hour === 12
                                              ? '12 PM'
                                              : hour > 12
                                                ? `${hour - 12} PM`
                                                : `${hour} AM`}
                                    </div>
                                ))}
                            </div>

                            {/* Main Content Columns Grid */}
                            <div
                                className="relative flex-1"
                                style={{ height: '1440px' }}
                            >
                                {/* Horizontal grid line overlay */}
                                <div className="pointer-events-none absolute inset-0">
                                    {Array.from({ length: 24 }).map(
                                        (_, hour) => (
                                            <div
                                                key={hour}
                                                className="absolute right-0 left-0 border-b border-muted-foreground/10"
                                                style={{
                                                    top: `${hour * 60}px`,
                                                }}
                                            ></div>
                                        ),
                                    )}
                                </div>

                                {/* Columns */}
                                <div className="absolute inset-0 flex">
                                    {view === 'day' ? (
                                        <div className="relative h-full flex-1">
                                            {/* Render Slots */}
                                            {loading ? (
                                                <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-[1px]">
                                                    <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-indigo-600"></div>
                                                </div>
                                            ) : (
                                                getSlotsForDate(
                                                    selectedDate,
                                                ).map((slot, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() =>
                                                            setConfirmingSlot(
                                                                slot,
                                                            )
                                                        }
                                                        style={getBlockStyle(
                                                            slot,
                                                            selectedDate,
                                                        )}
                                                        className="absolute right-2.5 left-2.5 flex cursor-pointer flex-col overflow-hidden rounded-xl border border-indigo-100 bg-indigo-50/70 p-2 text-left text-indigo-700 shadow-sm transition-all hover:scale-[1.01] hover:bg-indigo-100/90 hover:shadow-md dark:border-indigo-900/40 dark:bg-indigo-950/40 dark:text-indigo-400 dark:hover:bg-indigo-900/60"
                                                    >
                                                        <span className="flex items-center gap-1 text-[10px] font-extrabold tracking-wider uppercase">
                                                            <BookOpen className="h-3 w-3" />
                                                            {t(
                                                                'pupil.book_button',
                                                            )}
                                                        </span>
                                                        <span className="mt-1 text-xs font-bold">
                                                            {new Date(
                                                                slot.start_at,
                                                            ).toLocaleTimeString(
                                                                [],
                                                                {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                },
                                                            )}{' '}
                                                            -{' '}
                                                            {new Date(
                                                                slot.end_at,
                                                            ).toLocaleTimeString(
                                                                [],
                                                                {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                },
                                                            )}
                                                        </span>
                                                    </button>
                                                ))
                                            )}

                                            {/* Red Current Time Indicator */}
                                            {formatDateString(selectedDate) ===
                                                formatDateString(
                                                    new Date(),
                                                ) && (
                                                <div
                                                    className="pointer-events-none absolute right-0 left-0 flex items-center border-t-2 border-red-500"
                                                    style={{
                                                        top: `${(nowTime.getHours() + nowTime.getMinutes() / 60) * 60}px`,
                                                    }}
                                                >
                                                    <div className="-ml-1 h-2 w-2 rounded-full bg-red-500"></div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        getWeekDays(selectedDate).map(
                                            (day, colIdx) => {
                                                const dateStr =
                                                    formatDateString(day);
                                                const daySlots =
                                                    getSlotsForDate(day);

                                                return (
                                                    <div
                                                        key={colIdx}
                                                        className="relative h-full min-w-[35px] flex-1 border-r border-muted-foreground/10 last:border-r-0 md:min-w-[100px]"
                                                    >
                                                        {/* Render Slots */}
                                                        {daySlots.map(
                                                            (slot, index) => (
                                                                <button
                                                                    key={index}
                                                                    onClick={() =>
                                                                        setConfirmingSlot(
                                                                            slot,
                                                                        )
                                                                    }
                                                                    style={getBlockStyle(
                                                                        slot,
                                                                        day,
                                                                    )}
                                                                    className="absolute right-0.5 left-0.5 flex cursor-pointer flex-col overflow-hidden rounded-md border border-indigo-100/50 bg-indigo-50/70 p-0.5 text-left text-indigo-700 shadow-sm transition-all hover:scale-[1.01] hover:bg-indigo-100/90 hover:shadow md:rounded-xl md:p-1.5 dark:border-indigo-900/40 dark:bg-indigo-950/40 dark:text-indigo-400 dark:hover:bg-indigo-900/60"
                                                                >
                                                                    <span className="hidden items-center gap-0.5 truncate text-[9px] font-extrabold tracking-wider uppercase md:flex">
                                                                        {t(
                                                                            'pupil.book_button',
                                                                        )}
                                                                    </span>
                                                                    <span className="mt-0.5 text-[7px] leading-none font-bold whitespace-nowrap md:text-[11px]">
                                                                        {new Date(
                                                                            slot.start_at,
                                                                        ).toLocaleTimeString(
                                                                            [],
                                                                            {
                                                                                hour: '2-digit',
                                                                                minute: '2-digit',
                                                                            },
                                                                        )}
                                                                    </span>
                                                                </button>
                                                            ),
                                                        )}

                                                        {/* Red Current Time Indicator */}
                                                        {formatDateString(
                                                            day,
                                                        ) ===
                                                            formatDateString(
                                                                new Date(),
                                                            ) && (
                                                            <div
                                                                className="pointer-events-none absolute right-0 left-0 flex items-center border-t-2 border-red-500"
                                                                style={{
                                                                    top: `${(nowTime.getHours() + nowTime.getMinutes() / 60) * 60}px`,
                                                                }}
                                                            >
                                                                <div className="-ml-1.5 h-2.5 w-2.5 rounded-full bg-red-500"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            },
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {confirmingSlot && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="relative mx-4 flex w-full max-w-md animate-in flex-col rounded-2xl border bg-card p-6 shadow-2xl duration-150 zoom-in-95">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setConfirmingSlot(null)}
                            className="absolute top-4 right-4 h-8 w-8 rounded-lg"
                        >
                            <X className="h-4 w-4" />
                        </Button>

                        <div className="mt-2 flex items-start gap-4">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                                <Info className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-foreground">
                                    {confirmingSlot.is_all_time
                                        ? t('booking.all_time_title')
                                        : t('booking.confirm_title')}
                                </h3>

                                {confirmingSlot.is_all_time ? (
                                    <div className="mt-3 space-y-4">
                                        <p className="text-sm leading-relaxed text-muted-foreground">
                                            {t('booking.all_time_desc')}
                                        </p>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-1">
                                                <Label
                                                    htmlFor="all_time_start"
                                                    className="text-xs font-semibold"
                                                >
                                                    {t(
                                                        'booking.all_time_start',
                                                    )}
                                                </Label>
                                                <Input
                                                    id="all_time_start"
                                                    type="time"
                                                    value={selectedStartStr}
                                                    onChange={(e) =>
                                                        setSelectedStartStr(
                                                            e.target.value,
                                                        )
                                                    }
                                                    min={formatTimeToHHMM(
                                                        new Date(
                                                            confirmingSlot.start_at,
                                                        ),
                                                    )}
                                                    max={formatTimeToHHMM(
                                                        new Date(
                                                            confirmingSlot.end_at,
                                                        ),
                                                    )}
                                                    className="mt-1 rounded-xl"
                                                />
                                            </div>
                                            <div className="grid gap-1">
                                                <Label
                                                    htmlFor="all_time_end"
                                                    className="text-xs font-semibold"
                                                >
                                                    {t('booking.all_time_end')}
                                                </Label>
                                                <Input
                                                    id="all_time_end"
                                                    type="time"
                                                    value={selectedEndStr}
                                                    onChange={(e) =>
                                                        setSelectedEndStr(
                                                            e.target.value,
                                                        )
                                                    }
                                                    min={
                                                        selectedStartStr ||
                                                        formatTimeToHHMM(
                                                            new Date(
                                                                confirmingSlot.start_at,
                                                            ),
                                                        )
                                                    }
                                                    max={formatTimeToHHMM(
                                                        new Date(
                                                            confirmingSlot.end_at,
                                                        ),
                                                    )}
                                                    className="mt-1 rounded-xl"
                                                />
                                            </div>
                                        </div>

                                        {!validateSelectedRange() && (
                                            <p className="text-xs text-destructive">
                                                {t('booking.invalid_range')}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                                        {t('booking.confirm_message', {
                                            teacher: teacher.full_name,
                                            start: new Date(
                                                confirmingSlot.start_at,
                                            ).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            }),
                                            end: new Date(
                                                confirmingSlot.end_at,
                                            ).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            }),
                                        })}
                                    </p>
                                )}

                                <div className="mt-6 flex items-center justify-end gap-3">
                                    <button
                                        onClick={() => setConfirmingSlot(null)}
                                        className="cursor-pointer rounded-xl border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
                                    >
                                        {t('booking.cancel_btn')}
                                    </button>
                                    <button
                                        onClick={handleConfirmSubmit}
                                        disabled={
                                            booking || !validateSelectedRange()
                                        }
                                        className="cursor-pointer rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 transition-colors hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {booking
                                            ? t('booking.requesting')
                                            : t('booking.confirm_btn')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

Booking.layout = {
    breadcrumbs: [
        { title: 'find teachers', href: '/pupil/teachers' },
        { title: 'book lesson', href: '#' },
    ],
};
