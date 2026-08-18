import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, router } from '@inertiajs/react';
import { store, destroy } from '@/routes/teacher/availability';
import {
    Clock,
    Calendar as CalendarIcon,
    Plus,
    Trash2,
    ChevronLeft,
    ChevronRight,
    X,
    Info,
    Sparkles,
    Check,
    AlertCircle,
    User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';

interface Props {
    availabilities: any[];
    appointments?: any[];
}

const translations = {
    en: {
        title: 'Availability',
        today: 'Today',
        day: 'Day',
        week: 'Week',
        createAvailability: 'Create Availability',
        myCalendars: 'My Calendars',
        singleDateOverride: 'Single Date Override',
        weeklyRecurring: 'Weekly Recurring',
        singleDate: 'Single Date',
        recurringWeekly: 'Recurring Weekly',
        minSlots: 'min',
        chooseDatePicker: 'Choose Date',
        hideDatePicker: 'Hide Calendar',
        save: 'Save',
        cancel: 'Cancel',
        deleteAvailability: 'Delete Availability',
        addAvailability: 'Add Availability',
        availabilityType: 'Availability Type',
        startTime: 'Start Time',
        endTime: 'End Time',
        slotDuration: 'Slot Duration',
        confirmDelete: 'Are you sure you want to delete this availability?',
        deleteSuccess: 'Availability deleted successfully.',
        saveSuccess: 'Availability saved successfully.',
        every: 'Every',
        mon: 'M',
        tue: 'T',
        wed: 'W',
        thu: 'T',
        fri: 'F',
        sat: 'S',
        sun: 'S',
        weeksShort: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        months: [
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
        typeSingleDate: 'Single Date Availability',
        typeWeeklyRecurring: 'Weekly Recurring Availability',
        dateDay: 'Date/Day:',
        timeRange: 'Time Range:',
        slotDurationLabel: 'Slot Duration:',
        minutesPerSession: 'minutes per session',
        saving: 'Saving...',
        slotDurationAll: 'All time',
        slotDurationCustom: 'Custom...',
        enterMinutes: 'Enter minutes',
        deleteRangeTitle: 'Delete specific time range',
        deleteRangeButton: 'Delete Selected Range',
        deleteRangeDesc: 'Select a sub-range within this block to remove it.',
        confirmDeleteRange:
            'Are you sure you want to delete this specific time range?',
        editAvailability: 'Edit Availability',
        updateAvailability: 'Update Availability',
        updateSuccess: 'Availability updated successfully.',
        updateError: 'Failed to update availability.',
        awaitingPayment: 'Awaiting for payment',
        booked: 'Booked',
        available: 'Available',
        expired: 'Expired',
        completed: 'Completed',
        statusLabel: 'Status',
        studentLabel: 'Student',
        topicsLabel: 'Topics',
    },
    uz: {
        title: 'Bandlik jadvali',
        today: 'Bugun',
        day: 'Kun',
        week: 'Hafta',
        createAvailability: "Bandlik qo'shish",
        myCalendars: 'Mening kalendarlarim',
        singleDateOverride: "Yagona kunlik o'zgarishlar",
        weeklyRecurring: 'Haftalik takrorlanuvchi',
        singleDate: 'Yagona kun',
        recurringWeekly: 'Haftalik takroriy',
        minSlots: 'daq',
        chooseDatePicker: 'Sana tanlash',
        hideDatePicker: 'Yashirish',
        save: 'Saqlash',
        cancel: 'Bekor qilish',
        deleteAvailability: "O'chirish",
        addAvailability: "Bandlik qo'shish",
        availabilityType: 'Turi',
        startTime: 'Boshlanish vaqti',
        endTime: 'Tugash vaqti',
        slotDuration: 'Slot davomiyligi',
        confirmDelete: "Ushbu bandlik vaqtini o'chirib tashlamoqchimisiz?",
        deleteSuccess: "Bandlik muvaffaqiyatli o'chirildi.",
        saveSuccess: 'Bandlik muvaffaqiyatli saqlandi.',
        every: 'Har',
        mon: 'D',
        tue: 'S',
        wed: 'Ch',
        thu: 'P',
        fri: 'J',
        sat: 'Sh',
        sun: 'Y',
        weeksShort: ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'],
        months: [
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
        typeSingleDate: 'Yagona kunlik bandlik',
        typeWeeklyRecurring: 'Haftalik takrorlanuvchi bandlik',
        dateDay: 'Sana/Kun:',
        timeRange: "Vaqt oralig'i:",
        slotDurationLabel: 'Slot davomiyligi:',
        minutesPerSession: 'daqiqadan har bir dars uchun',
        saving: 'Saqlanmoqda...',
        slotDurationAll: 'Butun vaqt',
        slotDurationCustom: 'Boshqa...',
        enterMinutes: 'Daqiqalarni kiriting',
        deleteRangeTitle: "Tanlangan vaqt oralig'ini o'chirish",
        deleteRangeButton: "Tanlangan oralig'ni o'chirish",
        deleteRangeDesc:
            "Ushbu blok ichidan o'chirmoqchi bo'lgan oralig'ingizni tanlang.",
        confirmDeleteRange:
            "Ushbu tanlangan vaqt oralig'ini o'chirib tashlamoqchimisiz?",
        editAvailability: 'Tahrirlash',
        updateAvailability: 'Yangilash',
        updateSuccess: 'Bandlik muvaffaqiyatli yangilandi.',
        updateError: "Bandlikni yangilab bo'lmadi.",
        awaitingPayment: "To'lov kutilmoqda",
        booked: 'Band qilingan',
        available: "Bo'sh",
        expired: "Muddati o'tgan",
        completed: 'Bajarildi',
        statusLabel: 'Holat',
        studentLabel: 'Talaba',
        topicsLabel: 'Mavzular',
    },
    ru: {
        title: 'График доступности',
        today: 'Сегодня',
        day: 'День',
        week: 'Неделя',
        createAvailability: 'Добавить доступность',
        myCalendars: 'Мои календари',
        singleDateOverride: 'Разовые изменения',
        weeklyRecurring: 'Еженедельно повторяющиеся',
        singleDate: 'Разово',
        recurringWeekly: 'Еженедельно',
        minSlots: 'мин',
        chooseDatePicker: 'Выбрать дату',
        hideDatePicker: 'Скрыть',
        save: 'Сохранить',
        cancel: 'Отмена',
        deleteAvailability: 'Удалить доступность',
        addAvailability: 'Добавить доступность',
        availabilityType: 'Тип доступности',
        startTime: 'Время начала',
        endTime: 'Время окончания',
        slotDuration: 'Длительность слота',
        confirmDelete: 'Вы уверены, что хотите удалить эту доступность?',
        deleteSuccess: 'Доступность успешно удалена.',
        saveSuccess: 'Доступность успешно сохранена.',
        every: 'Каждый',
        mon: 'П',
        tue: 'В',
        wed: 'С',
        thu: 'Ч',
        fri: 'П',
        sat: 'С',
        sun: 'В',
        weeksShort: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
        months: [
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
        typeSingleDate: 'Разовая доступность',
        typeWeeklyRecurring: 'Еженедельная доступность',
        dateDay: 'Дата/День:',
        timeRange: 'Интервал:',
        slotDurationLabel: 'Длительность слота:',
        minutesPerSession: 'минут на занятие',
        saving: 'Сохранение...',
        slotDurationAll: 'Всё время',
        slotDurationCustom: 'Другое...',
        enterMinutes: 'Введите минуты',
        deleteRangeTitle: 'Удалить временной интервал',
        deleteRangeButton: 'Удалить выбранный интервал',
        deleteRangeDesc:
            'Выберите подинтервал внутри этого блока, чтобы удалить его.',
        confirmDeleteRange:
            'Вы уверены, что хотите удалить этот конкретный временной интервал?',
        editAvailability: 'Редактировать',
        updateAvailability: 'Обновить',
        updateSuccess: 'Доступность успешно обновлена.',
        updateError: 'Не удалось обновить доступность.',
        awaitingPayment: 'Ожидается оплата',
        booked: 'Забронировано',
        available: 'Свободно',
        expired: 'Истекло',
        completed: 'Завершено',
        statusLabel: 'Статус',
        studentLabel: 'Студент',
        topicsLabel: 'Темы',
    },
};

const daysMap = {
    en: {
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday',
        saturday: 'Saturday',
        sunday: 'Sunday',
    },
    uz: {
        monday: 'Dushanba',
        tuesday: 'Seshanba',
        wednesday: 'Chorshanba',
        thursday: 'Payshanba',
        friday: 'Juma',
        saturday: 'Shanba',
        sunday: 'Yakshanba',
    },
    ru: {
        monday: 'Понедельник',
        tuesday: 'Вторник',
        wednesday: 'Среда',
        thursday: 'Четверг',
        friday: 'Пятница',
        saturday: 'Суббота',
        sunday: 'Воскресенье',
    },
};

const localeMap = {
    en: 'en-US',
    uz: 'uz-UZ',
    ru: 'ru-RU',
};

export default function Availability({
    availabilities,
    appointments = [],
}: Props) {
    const { locale } = useTranslation();
    const lang = (
        locale === 'en' || locale === 'uz' || locale === 'ru' ? locale : 'en'
    ) as 'en' | 'uz' | 'ru';

    const t = translations[lang];

    const [view, setView] = useState<'day' | 'week'>('week');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentDate, setCurrentDate] = useState(new Date()); // Month focus for sidebar mini-calendar
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [selectedSlotDetail, setSelectedSlotDetail] = useState<any | null>(
        null,
    );

    // Calendar visibility toggles
    const [showCustom, setShowCustom] = useState(true);
    const [showRecurring, setShowRecurring] = useState(true);

    const [isCustomDuration, setIsCustomDuration] = useState(false);
    const [customMinutes, setCustomMinutes] = useState('30');

    useEffect(() => {
        if (!isCreateModalOpen) {
            setIsCustomDuration(false);
            setCustomMinutes('30');
        }
    }, [isCreateModalOpen]);

    const handleSlotDurationChange = (val: string) => {
        if (val === 'custom') {
            setIsCustomDuration(true);
            setData('slot_duration', parseInt(customMinutes) || 30);
        } else {
            setIsCustomDuration(false);
            setData('slot_duration', parseInt(val));
        }
    };

    const handleCustomMinutesChange = (val: string) => {
        setCustomMinutes(val);
        setData('slot_duration', parseInt(val) || 0);
    };

    // Live clock for red line indicator
    const [nowTime, setNowTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setNowTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

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

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<{
        type: string;
        day_of_week: string;
        start_time: string;
        end_time: string;
        date: string;
        slot_duration: number;
    }>({
        type: 'custom',
        day_of_week: 'monday',
        start_time: '09:00',
        end_time: '17:00',
        date: '',
        slot_duration: 30,
    });

    useEffect(() => {
        if (selectedEvent) {
            setIsEditing(false);
            if (selectedEvent.type === 'custom') {
                const start = parseUtcDate(selectedEvent.start_at);
                const end = parseUtcDate(selectedEvent.end_at);
                setRangeStartVal(formatTimeForInput(start));
                setRangeEndVal(formatTimeForInput(end));
                setEditData({
                    type: 'custom',
                    day_of_week: getWeekdayName(start),
                    start_time: formatTimeForInput(start),
                    end_time: formatTimeForInput(end),
                    date: formatDateString(start),
                    slot_duration: selectedEvent.slot_duration ?? 30,
                });
            } else {
                const startStr = selectedEvent.start_time
                    ? selectedEvent.start_time.substring(0, 5)
                    : '';
                const endStr = selectedEvent.end_time
                    ? selectedEvent.end_time.substring(0, 5)
                    : '';
                setRangeStartVal(startStr);
                setRangeEndVal(endStr);
                setEditData({
                    type: 'recurring',
                    day_of_week: selectedEvent.day_of_week ?? 'monday',
                    start_time: startStr || '09:00',
                    end_time: endStr || '17:00',
                    date: formatDateString(selectedDate),
                    slot_duration: selectedEvent.slot_duration ?? 30,
                });
            }
        } else {
            setRangeStartVal('');
            setRangeEndVal('');
            setIsEditing(false);
        }
    }, [selectedEvent]);

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEvent || !selectedEvent.id) return;

        let payload: any = {
            type: editData.type,
            slot_duration: Number(editData.slot_duration),
        };

        if (editData.type === 'recurring') {
            payload.day_of_week = editData.day_of_week;
            payload.start_time = editData.start_time;
            payload.end_time = editData.end_time;
        } else {
            const [startHour, startMin] = editData.start_time
                .split(':')
                .map(Number);
            const [endHour, endMin] = editData.end_time.split(':').map(Number);
            const [year, month, day] = editData.date.split('-').map(Number);

            const startLocal = new Date(
                year,
                month - 1,
                day,
                startHour,
                startMin,
                0,
                0,
            );
            const endLocal = new Date(
                year,
                month - 1,
                day,
                endHour,
                endMin,
                0,
                0,
            );
            if (endLocal <= startLocal) {
                endLocal.setDate(endLocal.getDate() + 1);
            }

            payload.start_at = startLocal.toISOString();
            payload.end_at = endLocal.toISOString();
        }

        router.put(`/teacher/availability/${selectedEvent.id}`, payload, {
            onSuccess: () => {
                toast.success(t.updateSuccess);
                setSelectedEvent(null);
                setIsEditing(false);
            },
            onError: (errors: any) => {
                const msg = errors.range || errors.message || t.updateError;
                toast.error(msg);
            },
        });
    };

    const getWeekdayName = (date: Date) => {
        return date
            .toLocaleDateString('en-US', { weekday: 'long' })
            .toLowerCase();
    };

    const formatDateString = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const parseUtcDate = (dateStr: string) => {
        if (!dateStr) return new Date();
        if (
            !dateStr.endsWith('Z') &&
            !dateStr.includes('+') &&
            !/-\d{2}:\d{2}$/.test(dateStr)
        ) {
            return new Date(dateStr.replace(' ', 'T') + 'Z');
        }
        return new Date(dateStr);
    };

    const [rangeStartVal, setRangeStartVal] = useState('');
    const [rangeEndVal, setRangeEndVal] = useState('');

    const formatTimeForInput = (date: Date) => {
        const h = String(date.getHours()).padStart(2, '0');
        const m = String(date.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
    };

    const handleDeleteRange = () => {
        if (!selectedEvent || !selectedEvent.id) return;

        let rangeStartIso = '';
        let rangeEndIso = '';

        try {
            const [startHour, startMin] = rangeStartVal.split(':').map(Number);
            const [endHour, endMin] = rangeEndVal.split(':').map(Number);

            if (selectedEvent.type === 'custom') {
                const startLocal = parseUtcDate(selectedEvent.start_at);
                startLocal.setHours(startHour, startMin, 0, 0);
                const endLocal = parseUtcDate(selectedEvent.end_at);
                endLocal.setHours(endHour, endMin, 0, 0);

                if (endLocal <= startLocal) {
                    endLocal.setDate(endLocal.getDate() + 1);
                }

                rangeStartIso = startLocal.toISOString();
                rangeEndIso = endLocal.toISOString();
            } else {
                const dummyDate = new Date();
                const startLocal = new Date(dummyDate);
                startLocal.setHours(startHour, startMin, 0, 0);
                const endLocal = new Date(dummyDate);
                endLocal.setHours(endHour, endMin, 0, 0);

                if (endLocal <= startLocal) {
                    endLocal.setDate(endLocal.getDate() + 1);
                }

                rangeStartIso = startLocal.toISOString();
                rangeEndIso = endLocal.toISOString();
            }
        } catch (err) {
            toast.error('Invalid time range');
            return;
        }

        if (confirm(t.confirmDeleteRange)) {
            router.delete(`/teacher/availability/${selectedEvent.id}`, {
                data: {
                    delete_type: 'range',
                    range_start: rangeStartIso,
                    range_end: rangeEndIso,
                },
                onSuccess: () => {
                    toast.success(t.deleteSuccess);
                    setSelectedEvent(null);
                },
                onError: (errors) => {
                    if (errors.range) {
                        toast.error(errors.range);
                    } else {
                        toast.error('Failed to delete time range');
                    }
                },
            });
        }
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

    const matchCustomAvailability = (avail: any, dateStr: string) => {
        if (!avail.start_at) return false;
        const localDate = parseUtcDate(avail.start_at);
        return formatDateString(localDate) === dateStr;
    };

    const getAvailabilitiesForDate = (date: Date) => {
        const dayName = getWeekdayName(date);
        const dateStr = formatDateString(date);

        return availabilities.filter((avail) => {
            if (avail.type === 'custom') {
                return showCustom && matchCustomAvailability(avail, dateStr);
            } else {
                return showRecurring && avail.day_of_week === dayName;
            }
        });
    };

    const hasAvailability = (date: Date) => {
        const dayName = getWeekdayName(date);
        const dateStr = formatDateString(date);
        return availabilities.some((avail) => {
            if (avail.type === 'custom') {
                return matchCustomAvailability(avail, dateStr);
            } else {
                return avail.day_of_week === dayName;
            }
        });
    };

    const getSlotsWithStatusForDate = (colDate: Date) => {
        const avails = getAvailabilitiesForDate(colDate);
        if (avails.length === 0) return [];

        const now = new Date();
        const dateStr = formatDateString(colDate);
        const slotsList: any[] = [];

        avails.forEach((avail) => {
            let startH = 9,
                startM = 0,
                endH = 17,
                endM = 0;
            if (avail.type === 'custom') {
                const sLocal = parseUtcDate(avail.start_at);
                const eLocal = parseUtcDate(avail.end_at);
                startH = sLocal.getHours();
                startM = sLocal.getMinutes();
                endH = eLocal.getHours();
                endM = eLocal.getMinutes();
                if (formatDateString(sLocal) !== dateStr) {
                    startH = 0;
                    startM = 0;
                }
                if (formatDateString(eLocal) !== dateStr) {
                    endH = 24;
                    endM = 0;
                }
            } else {
                const [sh, sm] = (avail.start_time || '09:00')
                    .split(':')
                    .map(Number);
                const [eh, em] = (avail.end_time || '17:00')
                    .split(':')
                    .map(Number);
                startH = sh;
                startM = sm;
                endH = eh;
                endM = em;
            }

            const slotDur =
                avail.slot_duration && avail.slot_duration > 0
                    ? avail.slot_duration
                    : 30;
            let currMinutes = startH * 60 + startM;
            const endMinutes = endH * 60 + endM;

            while (currMinutes + slotDur <= endMinutes) {
                const sH = Math.floor(currMinutes / 60);
                const sM = currMinutes % 60;
                const eH = Math.floor((currMinutes + slotDur) / 60);
                const eM = (currMinutes + slotDur) % 60;

                const slotStart = new Date(
                    colDate.getFullYear(),
                    colDate.getMonth(),
                    colDate.getDate(),
                    sH,
                    sM,
                    0,
                );
                const slotEnd = new Date(
                    colDate.getFullYear(),
                    colDate.getMonth(),
                    colDate.getDate(),
                    eH,
                    eM,
                    0,
                );

                const matchingApp = (appointments || []).find((app: any) => {
                    if (app.status === 'cancelled') {
                        const cancelledAt = app.updated_at
                            ? new Date(app.updated_at)
                            : new Date();
                        const appStart = new Date(app.start_at);
                        if (cancelledAt.getTime() <= appStart.getTime()) {
                            return false; // restored slot!
                        }
                    }
                    const appStart = new Date(app.start_at).getTime();
                    const appEnd = new Date(app.end_at).getTime();
                    const sStartMs = slotStart.getTime();
                    const sEndMs = slotEnd.getTime();
                    return appStart < sEndMs && appEnd > sStartMs;
                });

                let status = 'available';
                if (matchingApp) {
                    if (
                        matchingApp.payment_status === 'verifying' ||
                        matchingApp.status === 'pending'
                    ) {
                        status = 'awaiting_payment';
                    } else if (
                        matchingApp.status === 'accepted' ||
                        matchingApp.status === 'confirmed' ||
                        matchingApp.payment_status === 'paid'
                    ) {
                        if (now.getTime() >= slotEnd.getTime()) {
                            status = 'completed';
                        } else {
                            status = 'booked';
                        }
                    }
                } else {
                    if (now.getTime() >= slotStart.getTime()) {
                        status = 'expired';
                    } else {
                        status = 'available';
                    }
                }

                const timeLabel = `${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')} - ${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`;

                slotsList.push({
                    id: `${avail.id}-${sH}-${sM}`,
                    avail,
                    startMinutes: currMinutes,
                    durationMinutes: slotDur,
                    slotStart,
                    slotEnd,
                    timeLabel,
                    status,
                    appointment: matchingApp || null,
                });

                currMinutes += slotDur;
            }
        });

        return slotsList;
    };

    // Form setup matching standard Inertia Form hook
    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'custom',
        day_of_week: getWeekdayName(selectedDate),
        start_time: '09:00',
        end_time: '17:00',
        date: formatDateString(selectedDate),
        start_at: '',
        end_at: '',
        slot_duration: 30,
    });

    // Sync selectedDate with form date/day of week
    useEffect(() => {
        setData((prev) => ({
            ...prev,
            date: formatDateString(selectedDate),
            day_of_week: getWeekdayName(selectedDate),
        }));
    }, [selectedDate]);

    // Keep start_at and end_at in sync with times and dates in UTC (for custom availability)
    useEffect(() => {
        if (
            data.type === 'custom' &&
            data.date &&
            data.start_time &&
            data.end_time
        ) {
            try {
                const [y, m, d] = data.date.split('-').map(Number);
                const [startHour, startMin] = data.start_time
                    .split(':')
                    .map(Number);
                const [endHour, endMin] = data.end_time.split(':').map(Number);

                if (
                    !isNaN(y) &&
                    !isNaN(m) &&
                    !isNaN(d) &&
                    !isNaN(startHour) &&
                    !isNaN(startMin) &&
                    !isNaN(endHour) &&
                    !isNaN(endMin)
                ) {
                    const startLocal = new Date(
                        y,
                        m - 1,
                        d,
                        startHour,
                        startMin,
                    );
                    const endLocal = new Date(y, m - 1, d, endHour, endMin);

                    if (endLocal <= startLocal) {
                        endLocal.setDate(endLocal.getDate() + 1);
                    }

                    setData((prev) => ({
                        ...prev,
                        start_at: startLocal.toISOString(),
                        end_at: endLocal.toISOString(),
                    }));
                }
            } catch (err) {
                // Ignore parsing errors
            }
        } else {
            setData((prev) => ({
                ...prev,
                start_at: '',
                end_at: '',
            }));
        }
    }, [data.date, data.start_time, data.end_time, data.type]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(store.url(), {
            onSuccess: () => {
                toast.success(t.saveSuccess);
                setIsCreateModalOpen(false);
            },
        });
    };

    const handleDelete = (id: string | number) => {
        if (confirm(t.confirmDelete)) {
            router.delete(destroy.url(id), {
                onSuccess: () => {
                    toast.success(t.deleteSuccess);
                    setSelectedEvent(null);
                },
            });
        }
    };

    const handleGridClick = (
        e: React.MouseEvent<HTMLDivElement>,
        dateFocus: Date,
    ) => {
        if ((e.target as HTMLElement).closest('.availability-block')) {
            return; // click was on an event block, handled separately
        }
        const rect = e.currentTarget.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const clickedHour = Math.floor(clickY / 60);

        const startHourStr = String(clickedHour).padStart(2, '0');
        const endHourStr = String(Math.min(23, clickedHour + 1)).padStart(
            2,
            '0',
        );

        setSelectedDate(dateFocus);
        setData((prev) => ({
            ...prev,
            start_time: `${startHourStr}:00`,
            end_time: `${endHourStr}:00`,
            type: 'custom',
        }));
        setIsCreateModalOpen(true);
    };

    const getBlockStyle = (avail: any, colDate: Date) => {
        let startHour = 9;
        let startMinute = 0;
        let endHour = 17;
        let endMinute = 0;

        if (avail.type === 'custom') {
            const startLocal = parseUtcDate(avail.start_at);
            const endLocal = parseUtcDate(avail.end_at);

            startHour = startLocal.getHours();
            startMinute = startLocal.getMinutes();

            if (formatDateString(startLocal) !== formatDateString(colDate)) {
                startHour = 0;
                startMinute = 0;
            }

            if (formatDateString(endLocal) !== formatDateString(colDate)) {
                endHour = 24;
                endMinute = 0;
            } else {
                endHour = endLocal.getHours();
                endMinute = endLocal.getMinutes();
            }
        } else {
            const [sh, sm] = avail.start_time.split(':').map(Number);
            const [eh, em] = avail.end_time.split(':').map(Number);
            startHour = sh;
            startMinute = sm;
            endHour = eh;
            endMinute = em;
        }

        const startDecimal = startHour + startMinute / 60;
        const endDecimal = endHour + endMinute / 60;
        const duration = Math.max(0.5, endDecimal - startDecimal); // Min height is 30 mins

        return {
            top: `${startDecimal * 60}px`,
            height: `${duration * 60}px`,
        };
    };

    const getEventTimeLabel = (avail: any) => {
        if (avail.type === 'custom') {
            const startLocal = parseUtcDate(avail.start_at);
            const endLocal = parseUtcDate(avail.end_at);
            return `${startLocal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endLocal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        return `${avail.start_time.substring(0, 5)} - ${avail.end_time.substring(0, 5)}`;
    };

    // Date navigation
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
            <Head title="Teacher Availability Scheduler" />
            <div className="flex h-[calc(100vh-4rem)] animate-in flex-col overflow-hidden bg-background duration-300 select-none fade-in">
                {/* Header (Google Calendar Style Toolbar) */}
                <div className="flex items-center justify-between border-b bg-card px-6 py-3.5">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-brown text-white shadow-md shadow-brand-brown/20">
                                <CalendarIcon className="h-5 w-5" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-foreground">
                                {t.title}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={setToday}
                                className="rounded-lg px-4 font-medium"
                            >
                                {t.today}
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
                            <span className="ml-2 text-lg font-semibold text-foreground capitalize">
                                {currentTitleString()}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Switcher */}
                        <div className="flex rounded-lg border bg-muted/30 p-1">
                            <Button
                                variant={view === 'day' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setView('day')}
                                className="rounded-md font-medium"
                            >
                                {t.day}
                            </Button>
                            <Button
                                variant={
                                    view === 'week' ? 'secondary' : 'ghost'
                                }
                                size="sm"
                                onClick={() => setView('week')}
                                className="rounded-md font-medium"
                            >
                                {t.week}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Trial Info Banner */}
                <div className="mx-6 mt-3 mb-1 flex items-center gap-3 rounded-2xl border border-[#F7DE8B] bg-[#FBEDBD]/60 px-4 py-3 text-xs text-[#5C4500]">
                    <Sparkles className="h-4 w-4 shrink-0 text-[#8A6A12]" />
                    <span>
                        <strong>Trial lessons happen automatically.</strong>{' '}
                        First-time students can book a 20-minute trial (⅓ of
                        your lesson price) inside any slot you open below. You
                        don't need to create or manage anything extra.
                    </span>
                </div>

                {/* Main Workspace Layout */}
                <div
                    className={
                        view === 'day'
                            ? 'flex flex-1 flex-row overflow-hidden'
                            : 'flex flex-1 flex-col overflow-hidden md:flex-row'
                    }
                >
                    {/* Left Sidebar (Mini Cal, Create, Calendars toggles) */}
                    <div
                        className={
                            view === 'day'
                                ? 'flex w-[58%] flex-shrink-0 flex-col gap-3 overflow-y-auto border-r bg-card p-2 md:w-64 md:gap-6 md:p-4'
                                : 'flex max-h-[40vh] w-full flex-shrink-0 flex-col gap-3 overflow-y-auto border-b bg-card p-3 md:max-h-none md:w-64 md:gap-6 md:border-r md:border-b-0 md:p-4'
                        }
                    >
                        <Button
                            onClick={() => {
                                reset();
                                setIsCreateModalOpen(true);
                            }}
                            className="w-full justify-start gap-3 rounded-full border bg-white px-5 py-6 text-gray-800 shadow-md transition-all hover:bg-muted hover:shadow-lg"
                        >
                            <Plus className="h-6 w-6 text-brand-brown" />
                            <span className="text-sm font-semibold tracking-wide">
                                {t.createAvailability}
                            </span>
                        </Button>

                        {/* Mini Calendar */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-sm font-semibold text-foreground capitalize">
                                    {t.months[month]} {year}
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
                                {t.weeksShort.map((w, idx) => (
                                    <span key={idx}>{w.substring(0, 1)}</span>
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
                                    const hasSlots = hasAvailability(day);

                                    return (
                                        <button
                                            key={`day-${day.getTime()}`}
                                            onClick={() => {
                                                setSelectedDate(day);
                                                setCurrentDate(day);
                                            }}
                                            className={`relative flex aspect-square items-center justify-center rounded-full text-xs font-semibold transition-all ${
                                                isSelected
                                                    ? 'bg-brand-brown text-white shadow-sm'
                                                    : isToday
                                                      ? 'border border-brand-brown/20 bg-brand-lightblue text-brand-brown'
                                                      : 'text-foreground hover:bg-muted'
                                            }`}
                                        >
                                            <span>{day.getDate()}</span>
                                            {hasSlots && (
                                                <span
                                                    className={`absolute bottom-0.5 h-1 w-1 rounded-full ${
                                                        isSelected
                                                            ? 'bg-white'
                                                            : 'bg-brand-brown'
                                                    }`}
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Calendar Toggles (My Calendars style) */}
                        <div className="flex flex-col gap-3 border-t pt-4">
                            <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                {t.myCalendars}
                            </span>

                            <label className="group flex cursor-pointer items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={showCustom}
                                    onChange={(e) =>
                                        setShowCustom(e.target.checked)
                                    }
                                    className="h-4.5 w-4.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-sm font-medium text-foreground transition-all group-hover:text-brand-brown">
                                    {t.singleDateOverride}
                                </span>
                            </label>

                            <label className="group flex cursor-pointer items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={showRecurring}
                                    onChange={(e) =>
                                        setShowRecurring(e.target.checked)
                                    }
                                    className="h-4.5 w-4.5 rounded border-gray-300 text-brand-brown focus:ring-brand-brown"
                                />
                                <span className="text-sm font-medium text-foreground transition-all group-hover:text-brand-brown">
                                    {t.weeklyRecurring}
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Timeline & Columns Workspace */}
                    <div
                        className={
                            view === 'day'
                                ? 'flex min-w-0 flex-1 flex-col overflow-hidden border-t bg-muted/5 md:border-t-0'
                                : 'flex min-h-[300px] w-full min-w-0 flex-1 flex-col overflow-hidden border-t bg-muted/5 md:min-h-0 md:w-auto md:border-t-0'
                        }
                    >
                        <div className="flex w-full min-w-0 flex-1 flex-col overflow-hidden">
                            {/* Status Legend Bar */}
                            <div className="flex flex-wrap items-center gap-2 border-b bg-card/60 p-2.5 px-4 text-xs">
                                <span className="mr-1 font-bold text-muted-foreground">
                                    Status Legend:
                                </span>
                                <div className="flex items-center gap-1.5 rounded-md border border-emerald-500 bg-emerald-500/20 px-2 py-0.5 font-bold text-emerald-900">
                                    <span className="h-2 w-2 rounded-full bg-emerald-600"></span>{' '}
                                    Available
                                </div>
                                <div className="flex items-center gap-1.5 rounded-md border border-amber-600 bg-amber-400 px-2 py-0.5 font-bold text-amber-950">
                                    <span className="h-2 w-2 rounded-full bg-amber-700"></span>{' '}
                                    Awaiting for payment
                                </div>
                                <div className="flex items-center gap-1.5 rounded-md border border-indigo-700 bg-indigo-950 px-2 py-0.5 font-bold text-white">
                                    <span className="h-2 w-2 rounded-full bg-indigo-400"></span>{' '}
                                    Booked
                                </div>
                                <div className="flex items-center gap-1.5 rounded-md border border-rose-400 bg-rose-500/15 px-2 py-0.5 font-bold text-rose-900">
                                    <Clock className="h-3 w-3 text-rose-600" />{' '}
                                    Expired
                                </div>
                                <div className="flex items-center gap-1.5 rounded-md border border-rose-800 bg-rose-600 px-2 py-0.5 font-bold text-white">
                                    <Check className="h-3 w-3 text-white" />{' '}
                                    Completed
                                </div>
                            </div>

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
                                                        ? 'bg-brand-brown text-white shadow-md shadow-brand-brown/20'
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
                                                    formatDateString(
                                                        new Date(),
                                                    );
                                                const isSelected =
                                                    formatDateString(day) ===
                                                    formatDateString(
                                                        selectedDate,
                                                    );
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
                                                                setCurrentDate(
                                                                    day,
                                                                );
                                                            }}
                                                            className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all md:h-9 md:w-9 md:text-xl ${
                                                                isToday
                                                                    ? 'bg-brand-brown text-white shadow-md shadow-brand-brown/20'
                                                                    : isSelected
                                                                      ? 'bg-brand-lightblue text-brand-brown'
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
                            <div className="relative flex flex-1 overflow-y-auto">
                                {/* Y-Axis Hours label */}
                                <div
                                    className="relative flex w-14 flex-shrink-0 flex-col border-r bg-card select-none md:w-16"
                                    style={{ height: '1440px' }}
                                >
                                    {Array.from({ length: 24 }).map(
                                        (_, hour) => (
                                            <div
                                                key={hour}
                                                className="absolute right-2 text-[9px] font-bold text-muted-foreground/70 md:right-3 md:text-[10px]"
                                                style={{
                                                    top: `${hour * 60 - 8}px`,
                                                }}
                                            >
                                                {hour === 0
                                                    ? '12 AM'
                                                    : hour === 12
                                                      ? '12 PM'
                                                      : hour > 12
                                                        ? `${hour - 12} PM`
                                                        : `${hour} AM`}
                                            </div>
                                        ),
                                    )}
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
                                            <div
                                                className="relative h-full flex-1 cursor-pointer transition-colors hover:bg-brand-brown/5"
                                                onClick={(e) =>
                                                    handleGridClick(
                                                        e,
                                                        selectedDate,
                                                    )
                                                }
                                            >
                                                {/* Render 30-min Sub-slots with explicit status colors */}
                                                {getSlotsWithStatusForDate(
                                                    selectedDate,
                                                ).map((slot) => {
                                                    const topPx =
                                                        (slot.startMinutes /
                                                            60) *
                                                        60;
                                                    const heightPx = Math.max(
                                                        26,
                                                        (slot.durationMinutes /
                                                            60) *
                                                            60,
                                                    );

                                                    let statusStyle =
                                                        'border-emerald-500 bg-emerald-500/20 text-emerald-900 border-l-4';
                                                    let statusText =
                                                        t.available ||
                                                        'Available';
                                                    let icon = null;

                                                    if (
                                                        slot.status ===
                                                        'awaiting_payment'
                                                    ) {
                                                        statusStyle =
                                                            'border-amber-600 bg-amber-400 text-amber-950 border-l-4 font-bold shadow-sm';
                                                        statusText =
                                                            t.awaitingPayment ||
                                                            'Awaiting for payment';
                                                    } else if (
                                                        slot.status === 'booked'
                                                    ) {
                                                        statusStyle =
                                                            'border-indigo-700 bg-indigo-950 text-white border-l-4 font-bold shadow-sm';
                                                        statusText =
                                                            t.booked ||
                                                            'Booked';
                                                    } else if (
                                                        slot.status ===
                                                        'completed'
                                                    ) {
                                                        statusStyle =
                                                            'border-rose-800 bg-rose-600 text-white border-l-4 font-bold shadow-sm';
                                                        statusText =
                                                            t.completed ||
                                                            'Completed';
                                                        icon = (
                                                            <Check className="mr-1 inline h-3.5 w-3.5 text-white" />
                                                        );
                                                    } else if (
                                                        slot.status ===
                                                        'expired'
                                                    ) {
                                                        statusStyle =
                                                            'border-rose-400 bg-rose-500/15 text-rose-900 border-l-2';
                                                        statusText =
                                                            t.expired ||
                                                            'Expired';
                                                        icon = (
                                                            <Clock className="mr-1 inline h-3.5 w-3.5 text-rose-600" />
                                                        );
                                                    }

                                                    return (
                                                        <div
                                                            key={slot.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (
                                                                    slot.appointment
                                                                ) {
                                                                    setSelectedSlotDetail(
                                                                        slot,
                                                                    );
                                                                } else {
                                                                    setSelectedEvent(
                                                                        slot.avail,
                                                                    );
                                                                }
                                                            }}
                                                            style={{
                                                                position:
                                                                    'absolute',
                                                                top: `${topPx}px`,
                                                                height: `${heightPx}px`,
                                                                left: '8px',
                                                                right: '8px',
                                                                zIndex: 10,
                                                            }}
                                                            title={`${slot.timeLabel} • ${statusText}`}
                                                            className={`availability-block flex cursor-pointer flex-col overflow-hidden rounded-xl p-2 transition-all hover:scale-[1.01] hover:shadow-md ${statusStyle}`}
                                                        >
                                                            <div className="flex items-center justify-between text-[11px] leading-tight">
                                                                <span className="flex items-center truncate font-bold">
                                                                    {icon}
                                                                    {
                                                                        slot.timeLabel
                                                                    }
                                                                </span>
                                                                <span className="ml-1 truncate text-[10px] font-extrabold tracking-wider uppercase opacity-90">
                                                                    {statusText}
                                                                </span>
                                                            </div>
                                                            {slot.appointment
                                                                ?.pupil && (
                                                                <div className="mt-0.5 truncate text-[11px] font-medium opacity-95">
                                                                    👤{' '}
                                                                    {
                                                                        slot
                                                                            .appointment
                                                                            .pupil
                                                                            .full_name
                                                                    }
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}

                                                {/* Red Current Time Indicator */}
                                                {formatDateString(
                                                    selectedDate,
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
                                                        <div className="-ml-1 h-2 w-2 rounded-full bg-red-500"></div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            getWeekDays(selectedDate).map(
                                                (day, colIdx) => (
                                                    <div
                                                        key={colIdx}
                                                        className="relative h-full min-w-[35px] flex-1 cursor-pointer border-r border-muted-foreground/10 transition-colors last:border-r-0 hover:bg-brand-brown/5 md:min-w-[100px]"
                                                        onClick={(e) =>
                                                            handleGridClick(
                                                                e,
                                                                day,
                                                            )
                                                        }
                                                    >
                                                        {/* Render 30-min Sub-slots with explicit status colors */}
                                                        {getSlotsWithStatusForDate(
                                                            day,
                                                        ).map((slot) => {
                                                            const topPx =
                                                                (slot.startMinutes /
                                                                    60) *
                                                                60;
                                                            const heightPx =
                                                                Math.max(
                                                                    22,
                                                                    (slot.durationMinutes /
                                                                        60) *
                                                                        60,
                                                                );

                                                            let statusStyle =
                                                                'border-emerald-500 bg-emerald-500/20 text-emerald-900 border-l-2';
                                                            let statusText =
                                                                t.available ||
                                                                'Available';
                                                            let icon = null;

                                                            if (
                                                                slot.status ===
                                                                'awaiting_payment'
                                                            ) {
                                                                statusStyle =
                                                                    'border-amber-600 bg-amber-400 text-amber-950 border-l-4 font-bold shadow-sm';
                                                                statusText =
                                                                    t.awaitingPayment ||
                                                                    'Awaiting for payment';
                                                            } else if (
                                                                slot.status ===
                                                                'booked'
                                                            ) {
                                                                statusStyle =
                                                                    'border-indigo-700 bg-indigo-950 text-white border-l-4 font-bold shadow-sm';
                                                                statusText =
                                                                    t.booked ||
                                                                    'Booked';
                                                            } else if (
                                                                slot.status ===
                                                                'completed'
                                                            ) {
                                                                statusStyle =
                                                                    'border-rose-800 bg-rose-600 text-white border-l-4 font-bold shadow-sm';
                                                                statusText =
                                                                    t.completed ||
                                                                    'Completed';
                                                                icon = (
                                                                    <Check className="mr-1 inline h-3 w-3 text-white" />
                                                                );
                                                            } else if (
                                                                slot.status ===
                                                                'expired'
                                                            ) {
                                                                statusStyle =
                                                                    'border-rose-400 bg-rose-500/15 text-rose-900 border-l-2';
                                                                statusText =
                                                                    t.expired ||
                                                                    'Expired';
                                                                icon = (
                                                                    <Clock className="mr-1 inline h-3 w-3 text-rose-600" />
                                                                );
                                                            }

                                                            return (
                                                                <div
                                                                    key={
                                                                        slot.id
                                                                    }
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        if (
                                                                            slot.appointment
                                                                        ) {
                                                                            setSelectedSlotDetail(
                                                                                slot,
                                                                            );
                                                                        } else {
                                                                            setSelectedEvent(
                                                                                slot.avail,
                                                                            );
                                                                        }
                                                                    }}
                                                                    style={{
                                                                        position:
                                                                            'absolute',
                                                                        top: `${topPx}px`,
                                                                        height: `${heightPx}px`,
                                                                        left: '1px',
                                                                        right: '1px',
                                                                        zIndex: 10,
                                                                    }}
                                                                    title={`${slot.timeLabel} • ${statusText}`}
                                                                    className={`availability-block flex cursor-pointer flex-col overflow-hidden rounded-md p-1 transition-all hover:scale-[1.01] hover:shadow-md ${statusStyle}`}
                                                                >
                                                                    <div className="flex items-center justify-between text-[10px] leading-tight">
                                                                        <span className="flex items-center truncate font-semibold">
                                                                            {
                                                                                icon
                                                                            }
                                                                            <span className="hidden md:inline">
                                                                                {
                                                                                    slot.timeLabel
                                                                                }
                                                                            </span>
                                                                            <span className="inline md:hidden">
                                                                                {
                                                                                    slot.timeLabel.split(
                                                                                        ' - ',
                                                                                    )[0]
                                                                                }
                                                                            </span>
                                                                        </span>
                                                                        <span className="ml-1 hidden truncate text-[9px] font-extrabold tracking-wider uppercase opacity-90 md:inline">
                                                                            {
                                                                                statusText
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    {slot
                                                                        .appointment
                                                                        ?.pupil && (
                                                                        <div className="mt-0.5 hidden truncate text-[9px] font-medium opacity-95 md:block">
                                                                            👤{' '}
                                                                            {
                                                                                slot
                                                                                    .appointment
                                                                                    .pupil
                                                                                    .full_name
                                                                            }
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}

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
                                                ),
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Google Calendar Event details / edit / delete modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="relative flex w-full max-w-md animate-in flex-col rounded-2xl border bg-card p-6 shadow-2xl duration-150 zoom-in-95">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setSelectedEvent(null);
                                setIsEditing(false);
                            }}
                            className="absolute top-4 right-4 h-8 w-8 rounded-lg"
                        >
                            <X className="h-4 w-4" />
                        </Button>

                        {isEditing ? (
                            <form onSubmit={handleUpdate} className="space-y-4">
                                <h3 className="text-lg font-bold text-foreground">
                                    {t.editAvailability}
                                </h3>

                                <div>
                                    <Label className="text-xs font-semibold">
                                        {t.availabilityType}
                                    </Label>
                                    <Select
                                        value={editData.type}
                                        onValueChange={(val) =>
                                            setEditData((prev) => ({
                                                ...prev,
                                                type: val,
                                            }))
                                        }
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="custom">
                                                {t.singleDateOverride}
                                            </SelectItem>
                                            <SelectItem value="recurring">
                                                {t.weeklyRecurring}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {editData.type === 'recurring' ? (
                                    <div>
                                        <Label className="text-xs font-semibold">
                                            {t.dateDay}
                                        </Label>
                                        <Select
                                            value={editData.day_of_week}
                                            onValueChange={(val) =>
                                                setEditData((prev) => ({
                                                    ...prev,
                                                    day_of_week: val,
                                                }))
                                            }
                                        >
                                            <SelectTrigger className="mt-1 capitalize">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[
                                                    'monday',
                                                    'tuesday',
                                                    'wednesday',
                                                    'thursday',
                                                    'friday',
                                                    'saturday',
                                                    'sunday',
                                                ].map((day) => (
                                                    <SelectItem
                                                        key={day}
                                                        value={day}
                                                        className="capitalize"
                                                    >
                                                        {daysMap[lang][
                                                            day as keyof (typeof daysMap)['en']
                                                        ] || day}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ) : (
                                    <div>
                                        <Label className="text-xs font-semibold">
                                            {t.dateDay}
                                        </Label>
                                        <Input
                                            type="date"
                                            value={editData.date}
                                            onChange={(e) =>
                                                setEditData((prev) => ({
                                                    ...prev,
                                                    date: e.target.value,
                                                }))
                                            }
                                            className="mt-1"
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs font-semibold">
                                            {t.startTime}
                                        </Label>
                                        <Input
                                            type="time"
                                            value={editData.start_time}
                                            onChange={(e) =>
                                                setEditData((prev) => ({
                                                    ...prev,
                                                    start_time: e.target.value,
                                                }))
                                            }
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold">
                                            {t.endTime}
                                        </Label>
                                        <Input
                                            type="time"
                                            value={editData.end_time}
                                            onChange={(e) =>
                                                setEditData((prev) => ({
                                                    ...prev,
                                                    end_time: e.target.value,
                                                }))
                                            }
                                            className="mt-1"
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-2 border-t pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsEditing(false)}
                                        className="rounded-lg"
                                    >
                                        {t.cancel}
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="rounded-lg"
                                    >
                                        {t.updateAvailability}
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <div className="mt-2 flex items-start gap-4">
                                    <div
                                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                                            selectedEvent.type === 'custom'
                                                ? 'bg-emerald-500/10 text-emerald-600'
                                                : 'bg-brand-lightblue text-brand-brown'
                                        }`}
                                    >
                                        <Info className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-foreground capitalize">
                                            {selectedEvent.type === 'custom'
                                                ? t.typeSingleDate
                                                : t.typeWeeklyRecurring}
                                        </h3>

                                        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                                            <p className="flex items-center gap-2">
                                                <span className="font-semibold text-foreground">
                                                    {t.dateDay}
                                                </span>
                                                <span className="capitalize">
                                                    {selectedEvent.type ===
                                                    'recurring'
                                                        ? `${t.every} ${daysMap[lang][selectedEvent.day_of_week as keyof (typeof daysMap)['en']] || selectedEvent.day_of_week}`
                                                        : parseUtcDate(
                                                              selectedEvent.start_at,
                                                          ).toLocaleDateString(
                                                              localeMap[lang],
                                                              {
                                                                  weekday:
                                                                      'long',
                                                                  month: 'long',
                                                                  day: 'numeric',
                                                                  year: 'numeric',
                                                              },
                                                          )}
                                                </span>
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <span className="font-semibold text-foreground">
                                                    {t.timeRange}
                                                </span>
                                                <span>
                                                    {getEventTimeLabel(
                                                        selectedEvent,
                                                    )}
                                                </span>
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <span className="font-semibold text-foreground">
                                                    {t.slotDurationLabel}
                                                </span>
                                                <span>
                                                    {selectedEvent.slot_duration ===
                                                    0
                                                        ? t.slotDurationAll
                                                        : `${selectedEvent.slot_duration} ${t.minutesPerSession}`}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 border-t pt-4">
                                    <h4 className="text-xs font-bold text-foreground">
                                        {t.deleteRangeTitle}
                                    </h4>
                                    <p className="mt-0.5 mb-2 text-[10px] text-muted-foreground">
                                        {t.deleteRangeDesc}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-[10px]">
                                                {t.startTime}
                                            </Label>
                                            <Input
                                                type="time"
                                                value={rangeStartVal}
                                                onChange={(e) =>
                                                    setRangeStartVal(
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-8 px-2 text-xs"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[10px]">
                                                {t.endTime}
                                            </Label>
                                            <Input
                                                type="time"
                                                value={rangeEndVal}
                                                onChange={(e) =>
                                                    setRangeEndVal(
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-8 px-2 text-xs"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleDeleteRange}
                                        className="mt-2.5 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        {t.deleteRangeButton}
                                    </Button>
                                </div>

                                <div className="mt-6 flex flex-wrap justify-end gap-2 border-t pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsEditing(true)}
                                        className="rounded-lg"
                                    >
                                        {t.editAvailability}
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() =>
                                            handleDelete(selectedEvent.id)
                                        }
                                        className="flex items-center gap-2 rounded-lg"
                                    >
                                        <Trash2 className="h-4 w-4" />{' '}
                                        {t.deleteAvailability}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Custom Google Calendar Create Availability Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <form
                        onSubmit={submit}
                        className="relative flex w-full max-w-md animate-in flex-col rounded-2xl border bg-card p-6 shadow-2xl duration-150 zoom-in-95"
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute top-4 right-4 h-8 w-8 rounded-lg"
                        >
                            <X className="h-4 w-4" />
                        </Button>

                        <h3 className="mb-4 text-lg font-bold text-foreground">
                            {t.addAvailability}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <Label>{t.availabilityType}</Label>
                                <div className="mt-1.5 grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setData('type', 'custom')
                                        }
                                        className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${
                                            data.type === 'custom'
                                                ? 'border-brand-brown bg-brand-brown text-white shadow-sm'
                                                : 'bg-card text-foreground hover:bg-muted'
                                        }`}
                                    >
                                        {t.singleDate} ({selectedDate.getDate()}{' '}
                                        {t.months[
                                            selectedDate.getMonth()
                                        ].substring(0, 3)}
                                        )
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setData('type', 'recurring')
                                        }
                                        className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${
                                            data.type === 'recurring'
                                                ? 'border-brand-brown bg-brand-brown text-white shadow-sm'
                                                : 'bg-card text-foreground hover:bg-muted'
                                        }`}
                                    >
                                        {t.every}{' '}
                                        {selectedDate.toLocaleDateString(
                                            localeMap[lang],
                                            { weekday: 'short' },
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="start_time">
                                        {t.startTime}
                                    </Label>
                                    <Input
                                        id="start_time"
                                        type="time"
                                        value={data.start_time}
                                        onChange={(e) =>
                                            setData(
                                                'start_time',
                                                e.target.value,
                                            )
                                        }
                                        className="rounded-xl"
                                        required
                                    />
                                    {errors.start_time && (
                                        <p className="text-xs text-destructive">
                                            {errors.start_time}
                                        </p>
                                    )}
                                    {errors.start_at && (
                                        <p className="text-xs text-destructive">
                                            {errors.start_at}
                                        </p>
                                    )}
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="end_time">
                                        {t.endTime}
                                    </Label>
                                    <Input
                                        id="end_time"
                                        type="time"
                                        value={data.end_time}
                                        onChange={(e) =>
                                            setData('end_time', e.target.value)
                                        }
                                        className="rounded-xl"
                                        required
                                    />
                                    {errors.end_time && (
                                        <p className="text-xs text-destructive">
                                            {errors.end_time}
                                        </p>
                                    )}
                                    {errors.end_at && (
                                        <p className="text-xs text-destructive">
                                            {errors.end_at}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="rounded-lg"
                            >
                                {t.cancel}
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="rounded-lg bg-brand-button font-semibold text-brand-brown hover:bg-brand-button-hover"
                            >
                                {processing ? t.saving : t.save}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Selected Slot Detail Modal */}
            {selectedSlotDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md animate-in rounded-2xl border border-gray-100 bg-white p-6 shadow-xl duration-150 zoom-in-95 fade-in">
                        <div className="mb-4 flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5 text-[#1E2A5A]" />
                                <h3 className="text-base font-bold text-[#1E2A5A]">
                                    Session Details
                                </h3>
                            </div>
                            <button
                                onClick={() => setSelectedSlotDetail(null)}
                                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-3 text-sm text-gray-700">
                            <div className="flex items-center justify-between rounded-xl border bg-gray-50 p-2.5">
                                <span className="font-medium text-gray-500">
                                    Time Range:
                                </span>
                                <span className="font-bold text-gray-900">
                                    {selectedSlotDetail.timeLabel}
                                </span>
                            </div>

                            <div className="flex items-center justify-between rounded-xl border bg-gray-50 p-2.5">
                                <span className="font-medium text-gray-500">
                                    Status:
                                </span>
                                <span
                                    className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold tracking-wider uppercase ${
                                        selectedSlotDetail.status ===
                                        'awaiting_payment'
                                            ? 'border border-amber-300 bg-amber-100 text-amber-900'
                                            : selectedSlotDetail.status ===
                                                'booked'
                                              ? 'border border-indigo-700 bg-indigo-950 text-white'
                                              : selectedSlotDetail.status ===
                                                  'completed'
                                                ? 'border border-rose-300 bg-rose-100 text-rose-900'
                                                : selectedSlotDetail.status ===
                                                    'expired'
                                                  ? 'border border-rose-200 bg-rose-50 text-rose-800'
                                                  : 'border border-emerald-300 bg-emerald-100 text-emerald-900'
                                    }`}
                                >
                                    {selectedSlotDetail.status ===
                                    'awaiting_payment'
                                        ? 'Awaiting for payment'
                                        : selectedSlotDetail.status === 'booked'
                                          ? 'Booked'
                                          : selectedSlotDetail.status ===
                                              'completed'
                                            ? 'Completed'
                                            : selectedSlotDetail.status ===
                                                'expired'
                                              ? 'Expired'
                                              : 'Available'}
                                </span>
                            </div>

                            {selectedSlotDetail.appointment?.pupil && (
                                <div className="flex items-center justify-between rounded-xl border bg-gray-50 p-2.5">
                                    <span className="font-medium text-gray-500">
                                        Student:
                                    </span>
                                    <span className="flex items-center gap-1.5 font-bold text-gray-900">
                                        <User className="h-4 w-4 text-brand-brown" />
                                        {
                                            selectedSlotDetail.appointment.pupil
                                                .full_name
                                        }
                                    </span>
                                </div>
                            )}

                            {selectedSlotDetail.appointment?.topics &&
                                selectedSlotDetail.appointment.topics.length >
                                    0 && (
                                    <div className="flex items-center justify-between rounded-xl border bg-gray-50 p-2.5">
                                        <span className="font-medium text-gray-500">
                                            Topics:
                                        </span>
                                        <span className="font-bold text-gray-900">
                                            {selectedSlotDetail.appointment.topics.join(
                                                ', ',
                                            )}
                                        </span>
                                    </div>
                                )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setSelectedSlotDetail(null)}
                                className="rounded-xl font-semibold"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

Availability.layout = {
    breadcrumbs: [{ title: 'availability', href: '/teacher/availability' }],
};
