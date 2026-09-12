import { router, usePage } from '@inertiajs/react';
import { Calendar, CheckCircle2, ExternalLink, Loader2, Unlink } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/use-translation';
import type { Auth } from '@/types';

interface Props {
    user?: any;
}

export default function GoogleCalendarSettingsCard({ user: propUser }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = propUser || auth?.user;
    const { t } = useTranslation();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);

    if (!user || user.role !== 'teacher') {
        return null;
    }

    const isConnected = Boolean(user.google_connected);

    const handleDisconnect = () => {
        setIsDisconnecting(true);
        router.post(
            '/auth/google/disconnect',
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsDisconnecting(false);
                    setIsDialogOpen(false);
                },
            },
        );
    };

    return (
        <div className="space-y-4">
            {isConnected ? (
                <div className="flex flex-col justify-between gap-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-6 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm">
                            <Calendar className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <h4 className="text-base font-bold text-gray-900">
                                    {t('profile.google_calendar_title') || 'Google Calendar'}
                                </h4>
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100/90 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>Connected</span>
                                </span>
                            </div>
                            <p className="text-xs leading-relaxed text-gray-600 max-w-xl">
                                {t('profile.google_calendar_connected_desc') ||
                                    'Google Calendar is actively connected. Google Meet links are automatically generated for your scheduled practice sessions.'}
                            </p>
                        </div>
                    </div>

                    <div className="shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDialogOpen(true)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 active:scale-95 transition-all shadow-sm"
                        >
                            <Unlink className="h-3.5 w-3.5" />
                            <span>
                                {t('profile.google_calendar_disconnect_btn') ||
                                    'Disconnect Calendar'}
                            </span>
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col justify-between gap-5 rounded-2xl border border-rose-200 bg-rose-50/80 p-6 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-sm">
                            <Calendar className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <h4 className="text-base font-bold text-rose-900">
                                    {t('profile.google_calendar_title') || 'Google Calendar'}
                                </h4>
                                <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                                    Not Connected
                                </span>
                            </div>
                            <p className="text-xs leading-relaxed text-rose-700 max-w-xl">
                                {t('profile.google_calendar_disconnected_desc') ||
                                    'Google Calendar is not connected. Connect your account to enable automatic Google Meet link creation for your sessions.'}
                            </p>
                        </div>
                    </div>

                    <div className="shrink-0">
                        <a
                            href="/auth/google?calendar=1"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-rose-700 active:scale-95 whitespace-nowrap"
                        >
                            <span>
                                {t('profile.google_calendar_connect_btn') ||
                                    'Connect Google Calendar'}
                            </span>
                            <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                    </div>
                </div>
            )}

            {/* Disconnect Confirmation Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogTitle>
                        {t('profile.disconnect_modal_title') ||
                            'Disconnect Google Calendar?'}
                    </DialogTitle>
                    <DialogDescription>
                        {t('profile.disconnect_modal_desc') ||
                            "Disconnecting your Google Calendar will revoke ConvMate's access and stop automatic Google Meet link generation for future sessions. You can reconnect at any time."}
                    </DialogDescription>

                    <DialogFooter className="mt-4 gap-2 sm:gap-0">
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={isDisconnecting}
                            >
                                {t('profile.disconnect_modal_cancel') ||
                                    'Keep Connected'}
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDisconnect}
                            disabled={isDisconnecting}
                            className="gap-2"
                        >
                            {isDisconnecting && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            <span>
                                {t('profile.disconnect_modal_confirm') ||
                                    'Disconnect Calendar'}
                            </span>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
