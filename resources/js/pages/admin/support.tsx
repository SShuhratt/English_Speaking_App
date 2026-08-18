import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    MessageSquare,
    Send,
    Radio,
    ExternalLink,
    User,
    ShieldAlert,
    CheckCircle2,
} from 'lucide-react';

interface UserItem {
    id: string;
    full_name: string;
    email: string;
    role: string;
    avatar?: string;
}

interface UserConversation {
    user: UserItem;
    unread_count: number;
    last_message_at: string;
}

interface SupportMessage {
    id: string;
    user_id: string;
    admin_id?: string;
    subject?: string;
    message: string;
    is_read_by_admin: boolean;
    is_read_by_user: boolean;
    recipient_type: string;
    created_at: string;
    user?: UserItem;
    admin?: UserItem;
}

interface Props {
    userList: UserConversation[];
    activeUser: UserItem | null;
    activeMessages: SupportMessage[];
    allUsers: UserItem[];
}

export default function AdminSupport({
    userList,
    activeUser,
    activeMessages,
    allUsers,
}: Props) {
    const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

    // Form for individual reply
    const replyForm = useForm({
        user_id: activeUser?.id || '',
        subject: '',
        message: '',
    });

    // Form for broadcast messaging
    const broadcastForm = useForm({
        recipient_type: 'all', // all, teachers, pupils, selected
        user_ids: [] as string[],
        subject: '',
        message: '',
    });

    const handleSelectUser = (userId: string) => {
        router.get(
            '/admin/support',
            { user_id: userId },
            { preserveState: true },
        );
        replyForm.setData('user_id', userId);
    };

    const handleReplySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeUser) return;

        replyForm.post('/admin/support/reply', {
            onSuccess: () => {
                replyForm.reset('message');
            },
        });
    };

    const handleBroadcastSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        broadcastForm.post('/admin/support/broadcast', {
            onSuccess: () => {
                setIsBroadcastOpen(false);
                broadcastForm.reset();
            },
        });
    };

    return (
        <>
            <Head title="Admin - Support & Announcements" />

            <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
                {/* Header Banner */}
                <div className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-950 p-6 text-white shadow-xl md:flex-row md:items-center">
                    <div className="flex items-center gap-4">
                        <div className="rounded-xl border border-indigo-400/30 bg-indigo-500/20 p-3 backdrop-blur-md">
                            <MessageSquare className="h-8 w-8 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold md:text-3xl">
                                Support Center & Announcements
                            </h1>
                            <p className="mt-1 text-sm text-indigo-200">
                                Reply to user issues, view sender profiles, and
                                broadcast messages to users.
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setIsBroadcastOpen(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white shadow-lg hover:bg-indigo-500"
                    >
                        <Radio className="h-4 w-4" />
                        Broadcast Message to Users
                    </Button>
                </div>

                {/* Main 2-Column Chat Desk */}
                <div className="grid gap-6 md:grid-cols-12">
                    {/* User Conversations List */}
                    <div className="md:col-span-4">
                        <Card className="flex h-[600px] flex-col shadow-md">
                            <CardHeader className="border-b p-4">
                                <CardTitle className="flex items-center justify-between text-base">
                                    <span>Support Inquiries</span>
                                    <Badge variant="outline">
                                        {userList.length}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-1 overflow-y-auto p-2">
                                {userList.length === 0 ? (
                                    <div className="py-12 text-center text-sm text-gray-500">
                                        No support tickets submitted yet.
                                    </div>
                                ) : (
                                    userList.map((item) => {
                                        const isSelected =
                                            activeUser?.id === item.user.id;

                                        return (
                                            <div
                                                key={item.user.id}
                                                onClick={() =>
                                                    handleSelectUser(
                                                        item.user.id,
                                                    )
                                                }
                                                className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition-all ${
                                                    isSelected
                                                        ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/50'
                                                        : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <Avatar className="h-10 w-10 flex-shrink-0">
                                                        <AvatarImage
                                                            src={
                                                                item.user.avatar
                                                            }
                                                        />
                                                        <AvatarFallback>
                                                            {item.user.full_name?.substring(
                                                                0,
                                                                2,
                                                            ) || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                {
                                                                    item.user
                                                                        .full_name
                                                                }
                                                            </p>
                                                            <Badge
                                                                variant="outline"
                                                                className="px-1 py-0 text-[10px] uppercase"
                                                            >
                                                                {item.user.role}
                                                            </Badge>
                                                        </div>
                                                        <p className="truncate text-xs text-gray-500">
                                                            {item.user.email}
                                                        </p>
                                                        <p className="font-mono text-[10px] font-bold text-indigo-600 select-all dark:text-indigo-400">
                                                            ID:{' '}
                                                            {item.user.id.substring(
                                                                0,
                                                                8,
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                {item.unread_count > 0 && (
                                                    <Badge className="bg-red-600 text-xs text-white">
                                                        {item.unread_count}
                                                    </Badge>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Active Conversation & Sender Profile Card */}
                    <div className="md:col-span-8">
                        <Card className="flex h-[600px] flex-col shadow-md">
                            {activeUser ? (
                                <>
                                    {/* Active User Header with Profile Link */}
                                    <div className="flex items-center justify-between border-b bg-gray-50 p-4 dark:bg-gray-800/50">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage
                                                    src={activeUser.avatar}
                                                />
                                                <AvatarFallback>
                                                    {activeUser.full_name?.substring(
                                                        0,
                                                        2,
                                                    ) || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="flex items-center gap-2 text-base font-bold">
                                                    {activeUser.full_name}
                                                    <Badge className="bg-indigo-600 text-xs text-white capitalize">
                                                        {activeUser.role}
                                                    </Badge>
                                                </h3>
                                                <p className="text-xs text-gray-500">
                                                    {activeUser.email}
                                                </p>
                                                <p className="mt-0.5 font-mono text-xs font-bold text-indigo-600 select-all dark:text-indigo-400">
                                                    User ID:{' '}
                                                    <span className="underline">
                                                        {activeUser.id}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        <Link
                                            href={`/profile/${activeUser.id}`}
                                            target="_blank"
                                        >
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex items-center gap-1 text-xs"
                                            >
                                                <User className="h-3.5 w-3.5" />
                                                View Sender Profile
                                                <ExternalLink className="ml-1 h-3 w-3" />
                                            </Button>
                                        </Link>
                                    </div>

                                    {/* Messages Thread */}
                                    <div className="flex-1 space-y-4 overflow-y-auto p-4">
                                        {activeMessages.map((msg) => {
                                            const isAdmin = Boolean(
                                                msg.admin_id,
                                            );

                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={`max-w-xl rounded-xl border p-4 ${
                                                        isAdmin
                                                            ? 'ml-auto border-indigo-700 bg-indigo-600 text-white'
                                                            : 'mr-auto border-gray-200 bg-gray-100 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100'
                                                    }`}
                                                >
                                                    <div className="mb-2 flex items-center justify-between gap-2 border-b border-white/20 pb-1 text-xs dark:border-gray-700">
                                                        <span className="font-semibold">
                                                            {isAdmin
                                                                ? 'Admin Response'
                                                                : msg.user
                                                                      ?.full_name}
                                                        </span>
                                                        <span
                                                            className={
                                                                isAdmin
                                                                    ? 'text-indigo-200'
                                                                    : 'text-gray-500'
                                                            }
                                                        >
                                                            {new Date(
                                                                msg.created_at,
                                                            ).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    {msg.subject && (
                                                        <p className="mb-1 text-xs font-semibold opacity-90">
                                                            Subject:{' '}
                                                            {msg.subject}
                                                        </p>
                                                    )}
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                        {msg.message}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Reply Composer */}
                                    <div className="border-t bg-gray-50 p-4 dark:bg-gray-900">
                                        <form
                                            onSubmit={handleReplySubmit}
                                            className="flex gap-2"
                                        >
                                            <Textarea
                                                rows={2}
                                                placeholder="Type your response to this user..."
                                                value={replyForm.data.message}
                                                onChange={(e) =>
                                                    replyForm.setData(
                                                        'message',
                                                        e.target.value,
                                                    )
                                                }
                                                className="flex-1 resize-none text-sm"
                                                required
                                            />
                                            <Button
                                                type="submit"
                                                disabled={replyForm.processing}
                                                className="self-end bg-indigo-600 text-white hover:bg-indigo-700"
                                            >
                                                <Send className="mr-1 h-4 w-4" />
                                                Send Reply
                                            </Button>
                                        </form>
                                    </div>
                                </>
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center space-y-2 p-8 text-gray-500">
                                    <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                                    <p className="text-base font-medium">
                                        Select a support inquiry on the left
                                    </p>
                                    <p className="max-w-sm text-center text-xs text-gray-400">
                                        You will be able to review ticket
                                        history, view sender profile details,
                                        and send direct replies.
                                    </p>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>

                {/* Broadcast Message Modal */}
                <Dialog
                    open={isBroadcastOpen}
                    onOpenChange={setIsBroadcastOpen}
                >
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-indigo-600">
                                <Radio className="h-5 w-5" /> Broadcast
                                Announcement / News
                            </DialogTitle>
                            <DialogDescription>
                                Send a message to all users, specific roles, or
                                selected individuals.
                            </DialogDescription>
                        </DialogHeader>

                        <form
                            onSubmit={handleBroadcastSubmit}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Recipient Target
                                </label>
                                <Select
                                    value={broadcastForm.data.recipient_type}
                                    onValueChange={(val) =>
                                        broadcastForm.setData(
                                            'recipient_type',
                                            val,
                                        )
                                    }
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select target recipients" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Users (Teachers & Pupils)
                                        </SelectItem>
                                        <SelectItem value="teachers">
                                            All Teachers Only
                                        </SelectItem>
                                        <SelectItem value="pupils">
                                            All Pupils Only
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Subject{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Announcement Title or News Subject"
                                    value={broadcastForm.data.subject}
                                    onChange={(e) =>
                                        broadcastForm.setData(
                                            'subject',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Message Body{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <Textarea
                                    rows={5}
                                    placeholder="Write your announcement or notification text..."
                                    value={broadcastForm.data.message}
                                    onChange={(e) =>
                                        broadcastForm.setData(
                                            'message',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1"
                                    required
                                />
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsBroadcastOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={broadcastForm.processing}
                                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                                >
                                    <Send className="mr-1 h-4 w-4" /> Broadcast
                                    Now
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

AdminSupport.layout = {
    breadcrumbs: [{ title: 'Convomate Support Desk', href: '/admin/support' }],
};
