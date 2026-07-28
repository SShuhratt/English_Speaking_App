import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShieldCheck, ShieldAlert, Sparkles, MessageSquare, ExternalLink, GraduationCap } from 'lucide-react';

interface TeacherProfile {
    id: string;
    overall_level?: string;
    speaking_band?: string;
    price?: number;
    is_verified?: boolean;
}

interface Teacher {
    id: string;
    full_name: string;
    email: string;
    avatar?: string;
    created_at: string;
    teacher_profile?: TeacherProfile;
    unread_messages_count?: number;
    is_new?: boolean;
}

interface Props {
    teachers: {
        data: Teacher[];
        links: any[];
    };
    currentFilter: string;
}

export default function AdminTeachers({ teachers, currentFilter }: Props) {
    const handleToggleVerify = (id: string, currentStatus?: boolean) => {
        router.post(`/admin/teachers/${id}/verify`, {
            verified: !currentStatus,
        });
    };

    const setFilter = (filter: string) => {
        router.get('/admin/teachers', { status: filter }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Manage Teachers', href: '/admin/teachers' }]}>
            <Head title="Admin - Teacher Management" />

            <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
                {/* Header Banner */}
                <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-white/20 p-3 backdrop-blur-md">
                            <GraduationCap className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold md:text-3xl">Teacher Directory & Verification</h1>
                            <p className="mt-1 text-sm text-blue-100">
                                Verify teacher profiles, check unread support messages, and monitor registration status.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter & List Card */}
                <Card className="shadow-md">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg">Registered Teachers</CardTitle>
                            <CardDescription>
                                Filter by status and toggle teacher verification.
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                            <Button
                                size="sm"
                                variant={currentFilter === 'all' ? 'default' : 'ghost'}
                                onClick={() => setFilter('all')}
                                className={currentFilter === 'all' ? 'bg-indigo-600 text-white' : ''}
                            >
                                All Teachers
                            </Button>
                            <Button
                                size="sm"
                                variant={currentFilter === 'verified' ? 'default' : 'ghost'}
                                onClick={() => setFilter('verified')}
                                className={currentFilter === 'verified' ? 'bg-indigo-600 text-white' : ''}
                            >
                                Verified
                            </Button>
                            <Button
                                size="sm"
                                variant={currentFilter === 'new' ? 'default' : 'ghost'}
                                onClick={() => setFilter('new')}
                                className={currentFilter === 'new' ? 'bg-indigo-600 text-white' : ''}
                            >
                                New (7 Days)
                            </Button>
                            <Button
                                size="sm"
                                variant={currentFilter === 'unverified' ? 'default' : 'ghost'}
                                onClick={() => setFilter('unverified')}
                                className={currentFilter === 'unverified' ? 'bg-indigo-600 text-white' : ''}
                            >
                                Unverified
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                    <tr>
                                        <th className="px-4 py-3">Teacher Info</th>
                                        <th className="px-4 py-3">Qualification / Level</th>
                                        <th className="px-4 py-3">Status Badges</th>
                                        <th className="px-4 py-3">Unread Support</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {teachers.data.map((teacher) => {
                                        const isVerified = Boolean(teacher.teacher_profile?.is_verified);

                                        return (
                                            <tr key={teacher.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={teacher.avatar} />
                                                            <AvatarFallback>{teacher.full_name?.substring(0, 2) || 'T'}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <Link
                                                                    href={`/profile/${teacher.id}`}
                                                                    className="font-medium text-indigo-600 hover:underline flex items-center gap-1"
                                                                >
                                                                    {teacher.full_name}
                                                                    <ExternalLink className="h-3 w-3" />
                                                                </Link>
                                                                <span className="inline-flex items-center rounded bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 text-[10px] font-mono font-bold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                                    ID: {teacher.id.substring(0, 8)}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-500">{teacher.email}</p>
                                                            <p className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold select-all">
                                                                Full ID: {teacher.id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4 text-xs text-gray-600 dark:text-gray-300">
                                                    <div>Level: {teacher.teacher_profile?.overall_level || 'Not set'}</div>
                                                    <div>Speaking: {teacher.teacher_profile?.speaking_band || 'N/A'}</div>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {isVerified ? (
                                                            <Badge className="bg-emerald-600 text-white flex items-center gap-1">
                                                                <ShieldCheck className="h-3 w-3" /> Verified
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/40">
                                                                <ShieldAlert className="h-3 w-3 mr-1" /> Unverified
                                                            </Badge>
                                                        )}

                                                        {teacher.is_new && (
                                                            <Badge className="bg-blue-600 text-white flex items-center gap-1">
                                                                <Sparkles className="h-3 w-3" /> New Teacher
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4">
                                                    {(teacher.unread_messages_count || 0) > 0 ? (
                                                        <Link href={`/admin/support?user_id=${teacher.id}`}>
                                                            <Badge variant="destructive" className="flex w-fit items-center gap-1">
                                                                <MessageSquare className="h-3 w-3" />
                                                                {teacher.unread_messages_count} Unread Message{teacher.unread_messages_count! > 1 ? 's' : ''}
                                                            </Badge>
                                                        </Link>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">No unread messages</span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link href={`/profile/${teacher.id}`}>
                                                            <Button size="sm" variant="outline">
                                                                View Profile
                                                            </Button>
                                                        </Link>

                                                        <Button
                                                            size="sm"
                                                            variant={isVerified ? 'outline' : 'default'}
                                                            onClick={() => handleToggleVerify(teacher.id, isVerified)}
                                                            className={!isVerified ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                                                        >
                                                            {isVerified ? 'Unverify' : 'Verify Teacher'}
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
