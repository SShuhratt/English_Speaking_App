import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users, MessageSquare, ExternalLink, Trash2 } from 'lucide-react';
import DeleteUserModal from '@/components/delete-user-modal';
import { useTranslation } from '@/hooks/use-translation';

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
    const { t } = useTranslation();
    const [deletingUser, setDeletingUser] = useState<{
        id: string;
        name: string;
    } | null>(null);

    return (
        <>
            <Head title={t('admin.pupils_title')} />

            <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
                {/* Header Banner */}
                <div className="rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-white/20 p-3 backdrop-blur-md">
                            <Users className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold md:text-3xl">
                                {t('admin.pupils_heading')}
                            </h1>
                            <p className="mt-1 text-sm text-emerald-100">
                                {t('admin.pupils_desc')}
                            </p>
                        </div>
                    </div>
                </div>

                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg">
                            {t('admin.pupils_list_title')}
                        </CardTitle>
                        <CardDescription>
                            {t('admin.pupils_list_desc')}
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-gray-50 text-xs text-gray-700 uppercase dark:bg-gray-800 dark:text-gray-300">
                                    <tr>
                                        <th className="px-4 py-3">
                                            {t('admin.col_pupil_info')}
                                        </th>
                                        <th className="px-4 py-3">
                                            {t('admin.col_english_level')}
                                        </th>
                                        <th className="px-4 py-3">
                                            {t('admin.col_joined_date')}
                                        </th>
                                        <th className="px-4 py-3">
                                            {t('admin.col_unread_support')}
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            {t('admin.col_actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {pupils.data.map((pupil) => (
                                        <tr
                                            key={pupil.id}
                                            className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                                        >
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage
                                                            src={pupil.avatar}
                                                        />
                                                        <AvatarFallback>
                                                            {pupil.full_name?.substring(
                                                                0,
                                                                2,
                                                            ) || 'P'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <Link
                                                                href={`/profile/${pupil.id}`}
                                                                className="flex items-center gap-1 font-medium text-indigo-600 hover:underline"
                                                            >
                                                                {
                                                                    pupil.full_name
                                                                }
                                                                <ExternalLink className="h-3 w-3" />
                                                            </Link>
                                                            <span className="inline-flex items-center rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                                                                ID:{' '}
                                                                {pupil.id.substring(
                                                                    0,
                                                                    8,
                                                                )}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500">
                                                            {pupil.email}
                                                        </p>
                                                        <p className="font-mono text-[11px] font-semibold text-indigo-600 select-all dark:text-indigo-400">
                                                            Full ID: {pupil.id}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 text-xs text-gray-600 dark:text-gray-300">
                                                <Badge
                                                    variant="outline"
                                                    className="capitalize"
                                                >
                                                    {pupil.pupil_profile
                                                        ?.level || t('admin.not_set')}
                                                </Badge>
                                            </td>

                                            <td className="px-4 py-4 text-xs text-gray-500">
                                                {new Date(
                                                    pupil.created_at,
                                                ).toLocaleDateString()}
                                            </td>

                                             <td className="px-4 py-4">
                                                {(pupil.unread_messages_count ||
                                                    0) > 0 ? (
                                                    <Link
                                                        href={`/admin/support?user_id=${pupil.id}`}
                                                    >
                                                        <Badge
                                                            variant="destructive"
                                                            className="flex w-fit items-center gap-1"
                                                        >
                                                            <MessageSquare className="h-3 w-3" />
                                                            {pupil.unread_messages_count! > 1
                                                                ? t('admin.unread_message_plural', { count: pupil.unread_messages_count })
                                                                : t('admin.unread_message_singular', { count: pupil.unread_messages_count })}
                                                        </Badge>
                                                    </Link>
                                                ) : (
                                                    <span className="text-xs text-gray-400">
                                                        {t('admin.no_unread_messages')}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/profile/${pupil.id}`}
                                                    >
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                        >
                                                            {t('admin.btn_view_profile')}
                                                        </Button>
                                                    </Link>

                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() =>
                                                            setDeletingUser({
                                                                id: pupil.id,
                                                                name: pupil.full_name,
                                                            })
                                                        }
                                                        className="bg-red-600 font-bold text-white hover:bg-red-700"
                                                    >
                                                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                                                        {t('admin.delete_user')}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <DeleteUserModal
                isOpen={!!deletingUser}
                onClose={() => setDeletingUser(null)}
                userId={deletingUser?.id ?? null}
                userName={deletingUser?.name}
            />
        </>
    );
}

AdminPupils.layout = {
    breadcrumbs: [{ title: 'Manage Pupils', href: '/admin/pupils' }],
};
