import { Head, usePage, Link } from '@inertiajs/react';
import { Calendar, Clock, Video, BookOpen, ChevronRight, Star, Mic, Play, TrendingUp, CheckCircle2, Users } from 'lucide-react';
import { dashboard } from '@/routes';
import type { Auth } from '@/types';

function PupilDashboard({ user }: { user: any }) {
    return (
        <div className="flex h-full flex-1 flex-col gap-8 p-4 md:p-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.name} 👋</h1>
                    <p className="text-muted-foreground">Here is what's happening with your learning journey.</p>
                </div>
                <Link href="/pupil/teachers" className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-105">
                    Book a Session <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-2 rounded-2xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-indigo-500">
                        <Clock className="h-5 w-5" />
                        <h3 className="font-medium">Total Speaking Hours</h3>
                    </div>
                    <p className="text-4xl font-bold">12<span className="text-xl font-medium text-muted-foreground">.5h</span></p>
                    <p className="text-sm text-emerald-500 flex items-center gap-1 mt-1"><TrendingUp className="h-3 w-3" /> +2.5h this week</p>
                </div>
                <div className="flex flex-col gap-2 rounded-2xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-purple-500">
                        <Calendar className="h-5 w-5" />
                        <h3 className="font-medium">Upcoming Sessions</h3>
                    </div>
                    <p className="text-4xl font-bold">2</p>
                    <p className="text-sm text-muted-foreground mt-1">Next: Tomorrow at 10:00 AM</p>
                </div>
                <div className="flex flex-col gap-2 rounded-2xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-amber-500">
                        <Star className="h-5 w-5" />
                        <h3 className="font-medium">Average Feedback</h3>
                    </div>
                    <p className="text-4xl font-bold">8.5<span className="text-xl font-medium text-muted-foreground">/10</span></p>
                    <p className="text-sm text-emerald-500 flex items-center gap-1 mt-1"><TrendingUp className="h-3 w-3" /> +0.5 from last month</p>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold">Upcoming Sessions</h2>
                    <div className="rounded-2xl border bg-card shadow-sm">
                        <div className="flex items-center justify-between border-b p-5">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50">
                                    <Mic className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-semibold">IELTS Speaking Mock Test</h4>
                                    <p className="text-sm text-muted-foreground">with Teacher Sarah</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-indigo-600 dark:text-indigo-400">Tomorrow</p>
                                <p className="text-sm text-muted-foreground">10:00 AM - 10:45 AM</p>
                            </div>
                        </div>
                        <div className="p-4 bg-muted/50 flex justify-end gap-3 rounded-b-2xl">
                            <button className="rounded-lg px-4 py-2 text-sm font-medium border hover:bg-muted transition-colors">Reschedule</button>
                            <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                                <Video className="h-4 w-4" /> Join Call
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold">Recent Feedback</h2>
                    <div className="rounded-2xl border bg-card p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex justify-center items-center text-white font-bold">
                                    JW
                                </div>
                                <div>
                                    <h4 className="font-semibold">James Wilson</h4>
                                    <p className="text-xs text-muted-foreground">General Conversation · Oct 12</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-sm font-medium dark:bg-amber-900/30 dark:text-amber-400">
                                <Star className="h-3.5 w-3.5 fill-current" /> 9/10
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed italic">
                            "Excellent fluency today! You managed complex grammar structures well. Just remember to watch the pronunciation of 'th' sounds when speaking quickly. Overall, fantastic progress!"
                        </p>
                        <div className="mt-4 pt-4 border-t flex justify-between items-center">
                            <button className="text-sm text-indigo-600 hover:underline dark:text-indigo-400 font-medium">View full report</button>
                            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                                <Play className="h-4 w-4" /> Review Recording
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TeacherDashboard({ user }: { user: any }) {
    return (
        <div className="flex h-full flex-1 flex-col gap-8 p-4 md:p-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back, {user.name}. Manage your sessions and availability.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/teacher/availability" className="inline-flex items-center justify-center rounded-xl border bg-background px-6 py-2.5 text-sm font-semibold hover:bg-muted transition-colors">
                        <Clock className="mr-2 h-4 w-4" /> Manage Availability
                    </Link>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-2 rounded-2xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-indigo-500">
                        <Video className="h-5 w-5" />
                        <h3 className="font-medium">Sessions Today</h3>
                    </div>
                    <p className="text-4xl font-bold">4</p>
                    <p className="text-sm text-muted-foreground mt-1">Next one in 2 hours</p>
                </div>
                <div className="flex flex-col gap-2 rounded-2xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-emerald-500">
                        <Users className="h-5 w-5" />
                        <h3 className="font-medium">Total Pupils</h3>
                    </div>
                    <p className="text-4xl font-bold">28</p>
                    <p className="text-sm text-emerald-500 flex items-center gap-1 mt-1"><TrendingUp className="h-3 w-3" /> +3 this month</p>
                </div>
                <div className="flex flex-col gap-2 rounded-2xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-amber-500">
                        <Star className="h-5 w-5" />
                        <h3 className="font-medium">Your Rating</h3>
                    </div>
                    <p className="text-4xl font-bold">4.9<span className="text-xl font-medium text-muted-foreground">/5</span></p>
                    <p className="text-sm text-muted-foreground mt-1">Based on 142 reviews</p>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold">Today's Schedule</h2>

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900/50 dark:bg-indigo-900/10">
                            <div className="flex flex-col items-center justify-center rounded-lg bg-white px-3 py-2 text-center shadow-sm dark:bg-background">
                                <span className="text-xs font-bold uppercase text-muted-foreground">14:00</span>
                                <span className="text-xs text-muted-foreground">45m</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold">IELTS Prep - Speaking Part 2</h4>
                                <p className="text-sm text-muted-foreground">with Alex Johnson</p>
                            </div>
                            <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                                <Video className="h-4 w-4" /> Join
                            </button>
                        </div>

                        <div className="flex items-center gap-4 rounded-xl border p-4 bg-card">
                            <div className="flex flex-col items-center justify-center rounded-lg bg-muted px-3 py-2 text-center">
                                <span className="text-xs font-bold uppercase text-muted-foreground">16:30</span>
                                <span className="text-xs text-muted-foreground">30m</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold">General Conversation</h4>
                                <p className="text-sm text-muted-foreground">with Maria Garcia</p>
                            </div>
                            <button className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
                                Details
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold">Pending Feedback</h2>
                    <div className="rounded-2xl border bg-card p-5 text-center py-10">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 mb-4">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-medium">All caught up!</h3>
                        <p className="text-muted-foreground mt-1 max-w-sm mx-auto">You've submitted feedback for all your past sessions. Great job!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const role = (auth.user?.role as string) || 'pupil';

    return (
        <>
            <Head title="Dashboard" />

            {role === 'teacher' ? (
                <TeacherDashboard user={auth.user} />
            ) : (
                <PupilDashboard user={auth.user} />
            )}
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
