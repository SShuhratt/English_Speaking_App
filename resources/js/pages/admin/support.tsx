import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Send, Radio, ExternalLink, User, ShieldAlert, CheckCircle2 } from 'lucide-react';

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

export default function AdminSupport({ userList, activeUser, activeMessages, allUsers }: Props) {
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
        router.get('/admin/support', { user_id: userId }, { preserveState: true });
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
        <AppLayout breadcrumbs={[{ title: 'Convomate Support Desk', href: '/admin/support' }]}>
            <Head title="Admin - Support & Announcements" />

            <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-950 p-6 text-white shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-indigo-500/20 p-3 backdrop-blur-md border border-indigo-400/30">
                            <MessageSquare className="h-8 w-8 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold md:text-3xl">Support Center & Announcements</h1>
                            <p className="mt-1 text-sm text-indigo-200">
                                Reply to user issues, view sender profiles, and broadcast messages to users.
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setIsBroadcastOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg flex items-center gap-2"
                    >
                        <Radio className="h-4 w-4" />
                        Broadcast Message to Users
                    </Button>
                </div>

                {/* Main 2-Column Chat Desk */}
                <div className="grid gap-6 md:grid-cols-12">
                    {/* User Conversations List */}
                    <div className="md:col-span-4">
                        <Card className="shadow-md h-[600px] flex flex-col">
                            <CardHeader className="p-4 border-b">
                                <CardTitle className="text-base flex items-center justify-between">
                                    <span>Support Inquiries</span>
                                    <Badge variant="outline">{userList.length}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-2 flex-1 overflow-y-auto space-y-1">
                                {userList.length === 0 ? (
                                    <div className="py-12 text-center text-gray-500 text-sm">
                                        No support tickets submitted yet.
                                    </div>
                                ) : (
                                    userList.map((item) => {
                                        const isSelected = activeUser?.id === item.user.id;

                                        return (
                                            <div
                                                key={item.user.id}
                                                onClick={() => handleSelectUser(item.user.id)}
                                                className={`p-3 rounded-lg cursor-pointer transition-all flex items-center justify-between gap-3 border ${
                                                    isSelected
                                                        ? 'bg-indigo-50 border-indigo-300 dark:bg-indigo-950/50 dark:border-indigo-800'
                                                        : 'hover:bg-gray-50 border-transparent dark:hover:bg-gray-800/50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <Avatar className="h-10 w-10 flex-shrink-0">
                                                        <AvatarImage src={item.user.avatar} />
                                                        <AvatarFallback>{item.user.full_name?.substring(0, 2) || 'U'}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                                                                {item.user.full_name}
                                                            </p>
                                                            <Badge variant="outline" className="text-[10px] uppercase px-1 py-0">
                                                                {item.user.role}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-gray-500 truncate">{item.user.email}</p>
                                                        <p className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 select-all">
                                                            ID: {item.user.id.substring(0, 8)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {item.unread_count > 0 && (
                                                    <Badge className="bg-red-600 text-white text-xs">
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
                        <Card className="shadow-md h-[600px] flex flex-col">
                            {activeUser ? (
                                <>
                                    {/* Active User Header with Profile Link */}
                                    <div className="p-4 border-b bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={activeUser.avatar} />
                                                <AvatarFallback>{activeUser.full_name?.substring(0, 2) || 'U'}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="font-bold text-base flex items-center gap-2">
                                                    {activeUser.full_name}
                                                    <Badge className="bg-indigo-600 text-white capitalize text-xs">
                                                        {activeUser.role}
                                                    </Badge>
                                                </h3>
                                                <p className="text-xs text-gray-500">{activeUser.email}</p>
                                                <p className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 select-all">
                                                    User ID: <span className="underline">{activeUser.id}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <Link href={`/profile/${activeUser.id}`} target="_blank">
                                            <Button size="sm" variant="outline" className="flex items-center gap-1 text-xs">
                                                <User className="h-3.5 w-3.5" />
                                                View Sender Profile
                                                <ExternalLink className="h-3 w-3 ml-1" />
                                            </Button>
                                        </Link>
                                    </div>

                                    {/* Messages Thread */}
                                    <div className="p-4 flex-1 overflow-y-auto space-y-4">
                                        {activeMessages.map((msg) => {
                                            const isAdmin = Boolean(msg.admin_id);

                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={`rounded-xl p-4 border max-w-xl ${
                                                        isAdmin
                                                            ? 'ml-auto bg-indigo-600 text-white border-indigo-700'
                                                            : 'mr-auto bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between gap-2 border-b border-white/20 dark:border-gray-700 pb-1 mb-2 text-xs">
                                                        <span className="font-semibold">
                                                            {isAdmin ? 'Admin Response' : msg.user?.full_name}
                                                        </span>
                                                        <span className={isAdmin ? 'text-indigo-200' : 'text-gray-500'}>
                                                            {new Date(msg.created_at).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    {msg.subject && (
                                                        <p className="text-xs font-semibold mb-1 opacity-90">
                                                            Subject: {msg.subject}
                                                        </p>
                                                    )}
                                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                                        {msg.message}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Reply Composer */}
                                    <div className="p-4 border-t bg-gray-50 dark:bg-gray-900">
                                        <form onSubmit={handleReplySubmit} className="flex gap-2">
                                            <Textarea
                                                rows={2}
                                                placeholder="Type your response to this user..."
                                                value={replyForm.data.message}
                                                onChange={(e) => replyForm.setData('message', e.target.value)}
                                                className="flex-1 text-sm resize-none"
                                                required
                                            />
                                            <Button
                                                type="submit"
                                                disabled={replyForm.processing}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white self-end"
                                            >
                                                <Send className="h-4 w-4 mr-1" />
                                                Send Reply
                                            </Button>
                                        </form>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2 p-8">
                                    <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                                    <p className="text-base font-medium">Select a support inquiry on the left</p>
                                    <p className="text-xs text-gray-400 text-center max-w-sm">
                                        You will be able to review ticket history, view sender profile details, and send direct replies.
                                    </p>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>

                {/* Broadcast Message Modal */}
                <Dialog open={isBroadcastOpen} onOpenChange={setIsBroadcastOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-indigo-600">
                                <Radio className="h-5 w-5" /> Broadcast Announcement / News
                            </DialogTitle>
                            <DialogDescription>
                                Send a message to all users, specific roles, or selected individuals.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleBroadcastSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Recipient Target
                                </label>
                                <Select
                                    value={broadcastForm.data.recipient_type}
                                    onValueChange={(val) => broadcastForm.setData('recipient_type', val)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select target recipients" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Users (Teachers & Pupils)</SelectItem>
                                        <SelectItem value="teachers">All Teachers Only</SelectItem>
                                        <SelectItem value="pupils">All Pupils Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Subject <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Announcement Title or News Subject"
                                    value={broadcastForm.data.subject}
                                    onChange={(e) => broadcastForm.setData('subject', e.target.value)}
                                    className="mt-1"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Message Body <span className="text-red-500">*</span>
                                </label>
                                <Textarea
                                    rows={5}
                                    placeholder="Write your announcement or notification text..."
                                    value={broadcastForm.data.message}
                                    onChange={(e) => broadcastForm.setData('message', e.target.value)}
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
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    <Send className="mr-1 h-4 w-4" /> Broadcast Now
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
