import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { Clock, Calendar, AlertCircle, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
    availabilities: any[];
}

export default function Availability({ availabilities }: Props) {
    const [open, setOpen] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        day_of_week: 'monday',
        start_time: '09:00',
        end_time: '17:00',
        slot_duration: 30,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('teacher.availability.store'), {
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    };

    return (
        <AppLayout>
            <Head title="My Availability" />
            <div className="p-6 md:p-8">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">My Availability</h1>
                        <p className="text-muted-foreground mt-2">Manage your teaching hours and slots.</p>
                    </div>

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="rounded-xl px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 font-semibold shadow-lg shadow-indigo-500/20">
                                <Plus className="mr-2 h-4 w-4" /> Add Availability
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] rounded-2xl">
                            <form onSubmit={submit}>
                                <DialogHeader>
                                    <DialogTitle>Add New Slots</DialogTitle>
                                    <DialogDescription>
                                        Set your recurring teaching hours for a specific day.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-6 py-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="day">Day of Week</Label>
                                        <Select 
                                            value={data.day_of_week} 
                                            onValueChange={(val) => setData('day_of_week', val)}
                                        >
                                            <SelectTrigger className="rounded-xl">
                                                <SelectValue placeholder="Select day" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="monday">Monday</SelectItem>
                                                <SelectItem value="tuesday">Tuesday</SelectItem>
                                                <SelectItem value="wednesday">Wednesday</SelectItem>
                                                <SelectItem value="thursday">Thursday</SelectItem>
                                                <SelectItem value="friday">Friday</SelectItem>
                                                <SelectItem value="saturday">Saturday</SelectItem>
                                                <SelectItem value="sunday">Sunday</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.day_of_week && <p className="text-xs text-destructive">{errors.day_of_week}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="start">Start Time</Label>
                                            <Input 
                                                id="start" 
                                                type="time" 
                                                value={data.start_time}
                                                onChange={(e) => setData('start_time', e.target.value)}
                                                className="rounded-xl"
                                            />
                                            {errors.start_time && <p className="text-xs text-destructive">{errors.start_time}</p>}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="end">End Time</Label>
                                            <Input 
                                                id="end" 
                                                type="time" 
                                                value={data.end_time}
                                                onChange={(e) => setData('end_time', e.target.value)}
                                                className="rounded-xl"
                                            />
                                            {errors.end_time && <p className="text-xs text-destructive">{errors.end_time}</p>}
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="duration">Slot Duration (minutes)</Label>
                                        <Input 
                                            id="duration" 
                                            type="number" 
                                            step="15"
                                            value={data.slot_duration}
                                            onChange={(e) => setData('slot_duration', parseInt(e.target.value))}
                                            className="rounded-xl"
                                        />
                                        {errors.slot_duration && <p className="text-xs text-destructive">{errors.slot_duration}</p>}
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={processing} className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700">
                                        {processing ? 'Saving...' : 'Save Availability'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-indigo-500" /> Weekly Recurring Hours
                    </h2>

                    {availabilities.length > 0 ? (
                        <div className="grid gap-3">
                            {availabilities.map((avail) => (
                                <div key={avail.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                                            <Calendar className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <span className="font-bold capitalize text-foreground">{avail.day_of_week}</span>
                                            <p className="text-sm text-muted-foreground mt-0.5">
                                                {avail.start_time} - {avail.end_time} • {avail.slot_duration} min slots
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full uppercase tracking-wider">
                                        <Check className="h-3 w-3" /> Active
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground font-medium">No recurring hours set yet.</p>
                            <p className="text-xs text-muted-foreground mt-1">Add your working hours to start receiving bookings.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

function route(arg0: string): string {
    throw new Error('Function not implemented.');
}
