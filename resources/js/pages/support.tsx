import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, HelpCircle, ShieldAlert, CheckCircle2, User } from 'lucide-react';

interface AdminUser {
    id: string;
    full_name: string;
}

interface SupportMessage {
    id: string;
    subject?: string;
    message: string;
    admin_id?: string;
    admin?: AdminUser;
    is_read_by_user: boolean;
    recipient_type: string;
    created_at: string;
}

interface Props {
    messages: SupportMessage[];
}

export default function Support({ messages = [] }: Props) {
    const { data, setData, post, processing, reset, errors } = useForm({
        subject: '',
        message: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/support', {
            onSuccess: () => reset(),
        });
    };

    return (
        <>
            <Head title="Convomate Support" />

            <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-8">
                {/* Header Banner */}
                <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-white/20 p-3 backdrop-blur-md">
                            <HelpCircle className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Help & Support Desk</h1>
                            <p className="text-sm text-indigo-100">
                                Contact the Convomate platform admins, report an issue, or read announcements.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Submit Ticket Form */}
                    <div className="lg:col-span-5">
                        <Card className="border-border/50 shadow-md">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Send className="h-5 w-5 text-indigo-600" />
                                    Send Message to Admin
                                </CardTitle>
                                <CardDescription>
                                    Have a question, feedback, or payment issue? Send us a direct message.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="subject">Subject</Label>
                                        <Input
                                            id="subject"
                                            placeholder="e.g., Booking error or Payment question"
                                            value={data.subject}
                                            onChange={(e) => setData('subject', e.target.value)}
                                        />
                                        {errors.subject && (
                                            <p className="text-xs text-destructive">{errors.subject}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="message">Message</Label>
                                        <Textarea
                                            id="message"
                                            rows={5}
                                            placeholder="Describe your question or concern in detail..."
                                            value={data.message}
                                            onChange={(e) => setData('message', e.target.value)}
                                        />
                                        {errors.message && (
                                            <p className="text-xs text-destructive">{errors.message}</p>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full bg-indigo-600 font-semibold text-white hover:bg-indigo-700"
                                    >
                                        {processing ? 'Sending...' : 'Send Message'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Messages & Announcements List */}
                    <div className="lg:col-span-7">
                        <Card className="border-border/50 shadow-md">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <MessageSquare className="h-5 w-5 text-indigo-600" />
                                    Support History & Announcements
                                </CardTitle>
                                <CardDescription>
                                    View platform broadcasts and responses from the administration team.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {supportMessages.length === 0 ? (
                                    <div className="py-12 text-center text-muted-foreground">
                                        <MessageSquare className="mx-auto h-12 w-12 stroke-1 opacity-40" />
                                        <p className="mt-2 text-sm">No messages yet. Feel free to submit a ticket!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {supportMessages.map((msg) => {
                                            const isBroadcast = msg.type === 'broadcast';

                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={`rounded-xl border p-4 transition-all ${
                                                        isBroadcast
                                                            ? 'border-purple-200 bg-purple-50/50 dark:border-purple-900/40 dark:bg-purple-950/20'
                                                            : 'border-border/60 bg-card'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-2">
                                                            {isBroadcast ? (
                                                                <Badge className="bg-purple-600 hover:bg-purple-700">
                                                                    Platform Announcement
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="capitalize">
                                                                    Ticket
                                                                </Badge>
                                                            )}
                                                            <h4 className="font-semibold text-foreground">
                                                                {msg.subject || 'Support Request'}
                                                            </h4>
                                                        </div>
                                                        <span className="text-[11px] text-muted-foreground">
                                                            {new Date(msg.created_at).toLocaleDateString(undefined, {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </span>
                                                    </div>

                                                    <p className="mt-2 text-sm text-foreground/90 whitespace-pre-wrap">
                                                        {msg.message}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

SupportPage.layout = {
    breadcrumbs: [{ title: 'Convomate Support', href: '/support' }],
};
