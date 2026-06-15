import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, router } from '@inertiajs/react';
import { store, destroy } from '@/routes/teacher/availability';
import { Clock, Calendar as CalendarIcon, AlertCircle, Plus, Trash2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
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
import { toast } from 'sonner';

interface Props {
    availabilities: any[];
}

export default function Availability({ availabilities }: Props) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Monday-first index: (dayOfWeek + 6) % 7
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;

    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
    }

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const getWeekdayName = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    };

    const formatDateString = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const parseUtcDate = (dateStr: string) => {
        if (!dateStr) return new Date();
        if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !/-\d{2}:\d{2}$/.test(dateStr)) {
            return new Date(dateStr.replace(' ', 'T') + 'Z');
        }
        return new Date(dateStr);
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
                return matchCustomAvailability(avail, dateStr);
            } else {
                return avail.day_of_week === dayName;
            }
        });
    };

    const hasAvailability = (date: Date) => {
        return getAvailabilitiesForDate(date).length > 0;
    };

    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'custom', // Default to custom single date
        day_of_week: getWeekdayName(selectedDate),
        start_time: '09:00',
        end_time: '17:00',
        date: formatDateString(selectedDate),
        start_at: '',
        end_at: '',
        slot_duration: 30,
    });

    // Sync form date/day when selectedDate changes
    useEffect(() => {
        setData((prev) => ({
            ...prev,
            date: formatDateString(selectedDate),
            day_of_week: getWeekdayName(selectedDate),
        }));
    }, [selectedDate]);

    // Keep start_at and end_at in sync with times and dates in UTC
    useEffect(() => {
        if (data.type === 'custom' && data.date && data.start_time && data.end_time) {
            try {
                const [year, month, day] = data.date.split('-').map(Number);
                const [startHour, startMin] = data.start_time.split(':').map(Number);
                const [endHour, endMin] = data.end_time.split(':').map(Number);

                if (!isNaN(year) && !isNaN(month) && !isNaN(day) && !isNaN(startHour) && !isNaN(startMin) && !isNaN(endHour) && !isNaN(endMin)) {
                    const startLocal = new Date(year, month - 1, day, startHour, startMin);
                    const endLocal = new Date(year, month - 1, day, endHour, endMin);

                    // If end time is before or equal to start time, it belongs to the next day (crossing midnight)
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
                // Ignore parsing errors before valid input is ready
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
                toast.success('Availability saved successfully.');
            },
        });
    };

    const handleDelete = (id: string | number) => {
        if (confirm('Are you sure you want to delete this availability?')) {
            router.delete(destroy.url(id), {
                onSuccess: () => {
                    toast.success('Availability deleted successfully.');
                },
            });
        }
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const activeAvailabilities = getAvailabilitiesForDate(selectedDate);

    return (
        <AppLayout>
            <Head title="My Availability Calendar" />
            <div className="p-6 md:p-8 max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                        My Availability Calendar
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your teaching schedule by selecting dates on the calendar.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left side: Calendar View */}
                    <div className="lg:col-span-7 flex flex-col gap-6">
                        <div className="rounded-2xl border bg-card p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-foreground">
                                    {monthNames[month]} {year}
                                </h2>
                                <div className="flex items-center gap-1.5">
                                    <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8 rounded-lg">
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8 rounded-lg">
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted-foreground uppercase mb-3">
                                <span>Mon</span>
                                <span>Tue</span>
                                <span>Wed</span>
                                <span>Thu</span>
                                <span>Fri</span>
                                <span>Sat</span>
                                <span>Sun</span>
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {days.map((day, idx) => {
                                    if (day === null) {
                                        return <div key={`empty-${idx}`} className="aspect-square bg-muted/10 rounded-xl"></div>;
                                    }

                                    const isSelected = formatDateString(day) === formatDateString(selectedDate);
                                    const isToday = formatDateString(day) === formatDateString(new Date());
                                    const hasSlots = hasAvailability(day);

                                    return (
                                        <button
                                            key={`day-${day.getTime()}`}
                                            onClick={() => setSelectedDate(day)}
                                            className={`aspect-square relative flex flex-col items-center justify-center rounded-xl transition-all font-semibold text-sm ${
                                                isSelected
                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                                    : isToday
                                                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50'
                                                    : 'hover:bg-muted text-foreground'
                                            }`}
                                        >
                                            <span>{day.getDate()}</span>
                                            {hasSlots && (
                                                <span className={`absolute bottom-2 h-1.5 w-1.5 rounded-full ${
                                                    isSelected ? 'bg-white' : 'bg-indigo-500'
                                                }`} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Summary / All Availabilities List */}
                        <div className="rounded-2xl border bg-card p-6 shadow-sm">
                            <h3 className="text-md font-semibold mb-4 flex items-center gap-2 text-foreground">
                                <Clock className="h-4 w-4 text-indigo-500" /> Active Schedule Summary
                            </h3>
                            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                                {availabilities.length > 0 ? (
                                    availabilities.map((avail) => (
                                        <div key={avail.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/30 transition-all text-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                    <CalendarIcon className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <span className="font-semibold capitalize">
                                                        {avail.type === 'recurring' ? `Every ${avail.day_of_week}` : parseUtcDate(avail.start_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {avail.type === 'recurring'
                                                            ? `${avail.start_time.substring(0, 5)} - ${avail.end_time.substring(0, 5)}`
                                                            : `${parseUtcDate(avail.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${parseUtcDate(avail.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                                        } • {avail.slot_duration} min slots
                                                    </p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(avail.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">No hours configured yet.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right side: Selected Day Detail & Form */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        <div className="rounded-2xl border bg-card p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-foreground mb-4">
                                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </h2>

                            {/* Section: Selected date availabilities */}
                            <div className="mb-6">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                                    Existing Availabilities
                                </h3>
                                {activeAvailabilities.length > 0 ? (
                                    <div className="space-y-2">
                                        {activeAvailabilities.map((avail) => (
                                            <div key={avail.id} className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
                                                <div>
                                                    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide mb-1.5 ${
                                                        avail.type === 'custom'
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                                                            : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400'
                                                    }`}>
                                                        {avail.type === 'custom' ? 'Single Date' : 'Weekly'}
                                                    </span>
                                                    <p className="text-sm font-semibold">
                                                        {avail.type === 'recurring'
                                                            ? `${avail.start_time.substring(0, 5)} - ${avail.end_time.substring(0, 5)}`
                                                            : `${parseUtcDate(avail.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${parseUtcDate(avail.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                                        }
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {avail.slot_duration} min slots
                                                    </p>
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(avail.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-xl border border-dashed text-center text-sm text-muted-foreground">
                                        No availabilities set for this date.
                                    </div>
                                )}
                            </div>

                            {/* Section: Add availability form */}
                            <form onSubmit={submit} className="border-t pt-6">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                                    Add New Availability
                                </h3>

                                <div className="grid gap-4">
                                    <div>
                                        <Label>Type</Label>
                                        <div className="grid grid-cols-2 gap-2 mt-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setData('type', 'custom')}
                                                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                                                    data.type === 'custom'
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                        : 'bg-card text-foreground hover:bg-muted'
                                                }`}
                                            >
                                                Single Date ({selectedDate.getDate()} {monthNames[month].substring(0, 3)})
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setData('type', 'recurring')}
                                                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                                                    data.type === 'recurring'
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                        : 'bg-card text-foreground hover:bg-muted'
                                                }`}
                                            >
                                                Every {selectedDate.toLocaleDateString('en-US', { weekday: 'short' })}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="start_time">Start Time</Label>
                                            <Input
                                                id="start_time"
                                                type="time"
                                                value={data.start_time}
                                                onChange={(e) => setData('start_time', e.target.value)}
                                                className="rounded-xl"
                                            />
                                            {errors.start_time && <p className="text-xs text-destructive">{errors.start_time}</p>}
                                            {errors.start_at && <p className="text-xs text-destructive">{errors.start_at}</p>}
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="end_time">End Time</Label>
                                            <Input
                                                id="end_time"
                                                type="time"
                                                value={data.end_time}
                                                onChange={(e) => setData('end_time', e.target.value)}
                                                className="rounded-xl"
                                            />
                                            {errors.end_time && <p className="text-xs text-destructive">{errors.end_time}</p>}
                                            {errors.end_at && <p className="text-xs text-destructive">{errors.end_at}</p>}
                                        </div>
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="slot_duration">Slot Duration</Label>
                                        <Select
                                            value={String(data.slot_duration)}
                                            onValueChange={(val) => setData('slot_duration', parseInt(val))}
                                        >
                                            <SelectTrigger className="rounded-xl" id="slot_duration">
                                                <SelectValue placeholder="Select duration" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="15">15 minutes</SelectItem>
                                                <SelectItem value="30">30 minutes</SelectItem>
                                                <SelectItem value="45">45 minutes</SelectItem>
                                                <SelectItem value="60">60 minutes</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.slot_duration && <p className="text-xs text-destructive">{errors.slot_duration}</p>}
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/20"
                                    >
                                        {processing ? 'Saving...' : 'Add Availability'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
