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
        <AppLayout breadcrumbs={[{ title: 'Convomate Support', href: '/support' }]}>
            <Head title="Convomate Support" />

            <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-8">
                {/* Header Banner */}
                <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-white/20 p-3 backdrop-blur-md">
                            <HelpCircle className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold md:text-3xl">Convomate Support</h1>
                            <p className="mt-1 text-sm text-indigo-100 md:text-base">
                                Have an issue, question, or problem? Contact our team directly and we'll assist you immediately.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-8 md:grid-cols-12">
                    {/* Submit Ticket Form */}
                    <div className="md:col-span-5">
                        <Card className="shadow-md border-indigo-100 dark:border-indigo-950">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <MessageSquare className="h-5 w-5 text-indigo-600" />
                                    Contact Support
                                </CardTitle>
                                <CardDescription>
                                    Submit your inquiry or problem details below.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Subject
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="Brief title of your inquiry"
                                            value={data.subject}
                                            onChange={(e) => setData('subject', e.target.value)}
                                            className="mt-1"
                                        />
                                        {errors.subject && (
                                            <p className="mt-1 text-xs text-red-500">{errors.subject}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Message Details <span className="text-red-500">*</span>
                                        </label>
                                        <Textarea
                                            rows={5}
                                            placeholder="Describe your issue or feedback in detail..."
                                            value={data.message}
                                            onChange={(e) => setData('message', e.target.value)}
                                            className="mt-1"
                                            required
                                        />
                                        {errors.message && (
                                            <p className="mt-1 text-xs text-red-500">{errors.message}</p>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
                                    >
                                        <Send className="mr-2 h-4 w-4" />
                                        Send Message
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Messages History */}
                    <div className="md:col-span-7">
                        <Card className="shadow-md border-gray-100 dark:border-gray-800">
                            <CardHeader>
                                <CardTitle className="text-lg">Message History</CardTitle>
                                <CardDescription>Your ongoing conversation with Support.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {messages.length === 0 ? (
                                    <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                                        <HelpCircle className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                                        <p className="mt-2 text-sm">No support messages yet.</p>
                                        <p className="text-xs text-gray-400">Submit a ticket on the left to start.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                        {messages.map((msg) => {
                                            const isAdmin = Boolean(msg.admin_id);

                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={`rounded-xl p-4 border transition-all ${
                                                        isAdmin
                                                            ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-100 ml-4'
                                                            : 'bg-gray-50 border-gray-200 text-gray-900 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100 mr-4'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between gap-2 border-b border-black/5 dark:border-white/5 pb-2 mb-2">
                                                        <div className="flex items-center gap-2">
                                                            {isAdmin ? (
                                                                <Badge className="bg-indigo-600 text-white">
                                                                    Convomate Support
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="bg-white dark:bg-gray-800">
                                                                    You
                                                                </Badge>
                                                            )}
                                                            {msg.subject && (
                                                                <span className="font-semibold text-sm">
                                                                    {msg.subject}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {new Date(msg.created_at).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
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
        </AppLayout>
    );
}
