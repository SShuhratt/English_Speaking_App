import { router, usePage } from '@inertiajs/react';
import {
    Check,
    CheckCircle2,
    Copy,
    ExternalLink,
    KeyRound,
    Loader2,
    Send,
    Unlink,
} from 'lucide-react';
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
import type { Auth } from '@/types';

interface Props {
    user?: any;
}

export default function TelegramSettingsCard({ user: propUser }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = propUser || auth?.user;

    const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false);
    const [isPairingDialogOpen, setIsPairingDialogOpen] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [isGeneratingDeepLink, setIsGeneratingDeepLink] = useState(false);
    const [isGeneratingCode, setIsGeneratingCode] = useState(false);
    const [pairingCode, setPairingCode] = useState<string | null>(null);
    const [hasCopied, setHasCopied] = useState(false);

    if (!user) {
        return null;
    }

    const isConnected = Boolean(user.telegram_chat_id);

    const handleConnectDeepLink = async () => {
        setIsGeneratingDeepLink(true);
        try {
            const response = await fetch('/settings/telegram/deep-link', {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            const data = await response.json();
            if (data.deep_link) {
                window.open(data.deep_link, '_blank');
            }
        } catch (error) {
            console.error('Failed to get Telegram deep link:', error);
        } finally {
            setIsGeneratingDeepLink(false);
        }
    };

    const handleOpenPairingModal = async () => {
        setIsPairingDialogOpen(true);
        if (!pairingCode) {
            await fetchPairingCode();
        }
    };

    const fetchPairingCode = async () => {
        setIsGeneratingCode(true);
        try {
            const csrfToken =
                document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute('content') || '';

            const response = await fetch('/settings/telegram/pairing-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken,
                },
            });
            const data = await response.json();
            if (data.code) {
                setPairingCode(data.code);
            }
        } catch (error) {
            console.error('Failed to generate Telegram pairing code:', error);
        } finally {
            setIsGeneratingCode(false);
        }
    };

    const handleCopyCode = () => {
        if (!pairingCode) return;
        navigator.clipboard.writeText(pairingCode);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    };

    const handleDisconnect = () => {
        setIsDisconnecting(true);
        router.post(
            '/settings/telegram/unlink',
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsDisconnecting(false);
                    setIsDisconnectDialogOpen(false);
                },
            },
        );
    };

    return (
        <div className="space-y-4">
            {isConnected ? (
                <div className="flex flex-col justify-between gap-5 rounded-2xl border border-sky-200/80 bg-sky-50/40 p-6 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-sm shadow-sky-200">
                            <Send className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <h4 className="text-base font-bold text-gray-900">
                                    Telegram Notifications
                                </h4>
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-100/90 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
                                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>
                                        {user.telegram_username
                                            ? `@${user.telegram_username}`
                                            : 'Connected'}
                                    </span>
                                </span>
                            </div>
                            <p className="max-w-xl text-xs leading-relaxed text-gray-600">
                                You are receiving instant alerts for booking requests, confirmations, meeting links, and 5-minute pre-session reminders on Telegram.
                            </p>
                        </div>
                    </div>

                    <div className="shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDisconnectDialogOpen(true)}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-bold text-rose-600 shadow-sm transition-all hover:bg-rose-50 hover:text-rose-700 active:scale-95 sm:w-auto"
                        >
                            <Unlink className="h-3.5 w-3.5" />
                            <span>Disconnect Telegram</span>
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col justify-between gap-5 rounded-2xl border border-brand-pale-blue/40 bg-[#F8FAFC] p-6 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E0E7FF] text-[#4F46E5] shadow-sm">
                            <Send className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <h4 className="text-base font-bold text-gray-900">
                                    Telegram Notifications
                                </h4>
                                <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                                    Not connected
                                </span>
                            </div>
                            <p className="max-w-xl text-xs leading-relaxed text-gray-600">
                                Connect our official Telegram bot to receive instant lesson alerts, Google Meet room links, and 5-minute pre-session notifications directly on your phone.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Button
                            type="button"
                            onClick={handleConnectDeepLink}
                            disabled={isGeneratingDeepLink}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2AABEE] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#229ED9] active:scale-95 disabled:opacity-50"
                        >
                            {isGeneratingDeepLink ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Send className="h-3.5 w-3.5" />
                            )}
                            <span>Connect Bot</span>
                            <ExternalLink className="h-3 w-3 opacity-80" />
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleOpenPairingModal}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-95"
                        >
                            <KeyRound className="h-3.5 w-3.5 text-gray-500" />
                            <span>Pairing Code</span>
                        </Button>
                    </div>
                </div>
            )}

            {/* Modal: 6-Digit Pairing Code */}
            <Dialog open={isPairingDialogOpen} onOpenChange={setIsPairingDialogOpen}>
                <DialogContent className="max-w-md rounded-3xl p-6 sm:p-8">
                    <DialogTitle className="flex items-center gap-3 text-lg font-bold text-gray-900">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                            <KeyRound className="h-5 w-5" />
                        </div>
                        <span>Connect via 6-Digit Code</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs leading-relaxed text-gray-600">
                        Follow these simple steps to link your Telegram account manually:
                    </DialogDescription>

                    <div className="my-2 space-y-4">
                        <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4 text-center">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-600">
                                Your Temporary Pairing Code
                            </span>
                            {isGeneratingCode ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
                                </div>
                            ) : (
                                <div className="my-2 flex items-center justify-center gap-2">
                                    <span className="font-mono text-3xl font-extrabold tracking-[0.25em] text-gray-900">
                                        {pairingCode || '------'}
                                    </span>
                                    {pairingCode && (
                                        <button
                                            type="button"
                                            onClick={handleCopyCode}
                                            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-sky-100 hover:text-sky-700"
                                            title="Copy Code"
                                        >
                                            {hasCopied ? (
                                                <Check className="h-4 w-4 text-emerald-600" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}
                            <p className="text-[11px] text-gray-500">
                                Valid for 15 minutes. Send this code to our bot.
                            </p>
                        </div>

                        <div className="space-y-2 rounded-xl bg-gray-50 p-4 text-xs text-gray-600">
                            <p className="font-semibold text-gray-800">Instructions:</p>
                            <ol className="list-decimal space-y-1.5 pl-4">
                                <li>
                                    Open our bot in Telegram or search for{' '}
                                    <span className="font-semibold text-gray-800">
                                        our official bot
                                    </span>
                                    .
                                </li>
                                <li>Tap <strong>Start</strong> or send a message.</li>
                                <li>
                                    Reply directly with the <strong>6-digit code</strong> above.
                                </li>
                                <li>Your account will be paired immediately!</li>
                            </ol>
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-xl border-gray-200"
                            >
                                Close
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            onClick={fetchPairingCode}
                            disabled={isGeneratingCode}
                            className="rounded-xl bg-sky-600 text-white hover:bg-sky-700"
                        >
                            {isGeneratingCode ? 'Refreshing...' : 'Generate New Code'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal: Confirm Disconnect */}
            <Dialog
                open={isDisconnectDialogOpen}
                onOpenChange={setIsDisconnectDialogOpen}
            >
                <DialogContent className="max-w-md rounded-3xl p-6 sm:p-8">
                    <DialogTitle className="flex items-center gap-3 text-lg font-bold text-gray-900">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                            <Unlink className="h-5 w-5" />
                        </div>
                        <span>Disconnect Telegram Notifications?</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs leading-relaxed text-gray-600">
                        Are you sure you want to unlink Telegram? You will stop receiving instant notifications and reminders on your phone through Telegram.
                    </DialogDescription>
                    <DialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={isDisconnecting}
                                className="rounded-xl border-gray-200"
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            onClick={handleDisconnect}
                            disabled={isDisconnecting}
                            className="rounded-xl bg-rose-600 text-white shadow-sm hover:bg-rose-700"
                        >
                            {isDisconnecting ? 'Disconnecting...' : 'Yes, Disconnect'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
