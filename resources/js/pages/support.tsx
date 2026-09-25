import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    MessageSquare,
    Send,
    HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';

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
    type?: string;
    created_at: string;
}

interface Props {
    messages: SupportMessage[];
}

export default function Support({ messages = [] }: Props) {
    const { t } = useTranslation();
    const { data, setData, post, processing, reset, errors } = useForm({
        subject: '',
        message: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/support', {
            onSuccess: () => {
                reset();
                toast.success(t('support.message_sent_success'));
            },
        });
    };

    return (
        <>
            <Head title={t('support.title')} />

            <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-8">
                {/* Header Banner */}
                <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-white/20 p-3 backdrop-blur-md">
                            <HelpCircle className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">
                                {t('support.help_desk')}
                            </h1>
                            <p className="text-sm text-indigo-100">
                                {t('support.help_desk_desc')}
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
                                    {t('support.send_message_title')}
                                </CardTitle>
                                <CardDescription>
                                    {t('support.send_message_desc')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form
                                    onSubmit={handleSubmit}
                                    className="space-y-4"
                                >
                                    <div className="space-y-1.5">
                                        <Label htmlFor="subject">{t('support.subject')}</Label>
                                        <Input
                                            id="subject"
                                            placeholder={t('support.subject_placeholder')}
                                            value={data.subject}
                                            onChange={(e) =>
                                                setData(
                                                    'subject',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {errors.subject && (
                                            <p className="text-xs text-destructive">
                                                {errors.subject}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="message">{t('support.message')}</Label>
                                        <Textarea
                                            id="message"
                                            rows={5}
                                            placeholder={t('support.message_placeholder')}
                                            value={data.message}
                                            onChange={(e) =>
                                                setData(
                                                    'message',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {errors.message && (
                                            <p className="text-xs text-destructive">
                                                {errors.message}
                                            </p>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full bg-indigo-600 font-semibold text-white hover:bg-indigo-700"
                                    >
                                        {processing
                                            ? t('support.sending_button')
                                            : t('support.send_button')}
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
                                    {t('support.history_title')}
                                </CardTitle>
                                <CardDescription>
                                    {t('support.history_desc')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {messages.length === 0 ? (
                                    <div className="py-12 text-center text-muted-foreground">
                                        <MessageSquare className="mx-auto h-12 w-12 stroke-1 opacity-40" />
                                        <h4 className="mt-3 text-base font-semibold text-gray-800 dark:text-gray-200">
                                            {t('support.no_messages')}
                                        </h4>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {t('support.no_messages_desc')}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {messages.map((msg) => {
                                            const isBroadcast =
                                                msg.type === 'broadcast';

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
                                                                    {t('support.badge_broadcast')}
                                                                </Badge>
                                                            ) : (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="capitalize"
                                                                >
                                                                    {t('support.badge_ticket')}
                                                                </Badge>
                                                            )}
                                                            <h4 className="font-semibold text-foreground">
                                                                {msg.subject ||
                                                                    t('support.default_subject')}
                                                            </h4>
                                                        </div>
                                                        <span className="text-[11px] text-muted-foreground">
                                                            {new Date(
                                                                msg.created_at,
                                                            ).toLocaleDateString(
                                                                undefined,
                                                                {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                },
                                                            )}
                                                        </span>
                                                    </div>

                                                    <p className="mt-2 text-sm whitespace-pre-wrap text-foreground/90">
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

Support.layout = {
    breadcrumbs: [{ title: 'convomate support', href: '/support' }],
};
