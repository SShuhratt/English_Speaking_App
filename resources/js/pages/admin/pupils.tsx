import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users, MessageSquare, ExternalLink } from 'lucide-react';

interface PupilProfile {
    id: string;
    level?: string;
    phone_number?: string;
}

interface Pupil {
    id: string;
    full_name: string;
    email: string;
    avatar?: string;
    created_at: string;
    pupil_profile?: PupilProfile;
    unread_messages_count?: number;
}

interface Props {
    pupils: {
        data: Pupil[];
        links: any[];
    };
}

export default function AdminPupils({ pupils }: Props) {
    return (
        <>
            <Head title="Admin - Pupil Management" />

            <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
                {/* Header Banner */}
                <div className="rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-white/20 p-3 backdrop-blur-md">
                            <Users className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold md:text-3xl">Pupil Directory</h1>
                            <p className="mt-1 text-sm text-emerald-100">
                                View registered pupils, check support inquiries, and inspect pupil profiles.
                            </p>
                        </div>
                    </div>
                </div>

                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg">Registered Pupils</CardTitle>
                        <CardDescription>
                            Full list of pupils with unread message status and profile access.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                    <tr>
                                        <th className="px-4 py-3">Pupil Info</th>
                                        <th className="px-4 py-3">English Level</th>
                                        <th className="px-4 py-3">Joined Date</th>
                                        <th className="px-4 py-3">Unread Support</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {pupils.data.map((pupil) => (
                                        <tr key={pupil.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={pupil.avatar} />
                                                        <AvatarFallback>{pupil.full_name?.substring(0, 2) || 'P'}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <Link
                                                                href={`/profile/${pupil.id}`}
                                                                className="font-medium text-indigo-600 hover:underline flex items-center gap-1"
                                                            >
                                                                {pupil.full_name}
                                                                <ExternalLink className="h-3 w-3" />
                                                            </Link>
                                                            <span className="inline-flex items-center rounded bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 text-[10px] font-mono font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                                                ID: {pupil.id.substring(0, 8)}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500">{pupil.email}</p>
                                                        <p className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold select-all">
                                                            Full ID: {pupil.id}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 text-xs text-gray-600 dark:text-gray-300">
                                                <Badge variant="outline" className="capitalize">
                                                    {pupil.pupil_profile?.level || 'Not set'}
                                                </Badge>
                                            </td>

                                            <td className="px-4 py-4 text-xs text-gray-500">
                                                {new Date(pupil.created_at).toLocaleDateString()}
                                            </td>

                                            <td className="px-4 py-4">
                                                {(pupil.unread_messages_count || 0) > 0 ? (
                                                    <Link href={`/admin/support?user_id=${pupil.id}`}>
                                                        <Badge variant="destructive" className="flex w-fit items-center gap-1">
                                                            <MessageSquare className="h-3 w-3" />
                                                            {pupil.unread_messages_count} Unread Message{pupil.unread_messages_count! > 1 ? 's' : ''}
                                                        </Badge>
                                                    </Link>
                                                ) : (
                                                    <span className="text-xs text-gray-400">No unread messages</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-4 text-right">
                                                <Link href={`/profile/${pupil.id}`}>
                                                    <Button size="sm" variant="outline">
                                                        View Profile
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
