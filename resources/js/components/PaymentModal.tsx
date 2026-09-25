import React, { useState } from 'react';
import { X, CreditCard, Copy, Check, ShieldAlert, ExternalLink, Sparkles } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { toast } from 'sonner';

export interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    itemTitle?: string;
    amount?: number | string;
    teacherName?: string;
    pupilId?: string;
    pupilName?: string;
    modalTitle?: string;
    modalDescription?: string;
}

export default function PaymentModal({
    isOpen,
    onClose,
    itemTitle,
    amount,
    teacherName,
    pupilId,
    pupilName,
    modalTitle,
    modalDescription,
}: PaymentModalProps) {
    const { t } = useTranslation();
    const [copiedCard, setCopiedCard] = useState(false);

    if (!isOpen) return null;

    const cardNumber = '9860196619404458';
    const formattedCardNumber = '9860 1966 1940 4458';
    const cardHolder = 'Zarnigor Mirsaidova';

    const handleCopyCard = () => {
        navigator.clipboard.writeText(cardNumber);
        setCopiedCard(true);
        toast.success(t('payment.copied_toast') || 'Card number copied to clipboard!');
        setTimeout(() => setCopiedCard(false), 2500);
    };

    const formattedAmount =
        typeof amount === 'number'
            ? `${amount.toLocaleString('ru-RU').replace(/,/g, ' ')} so'm`
            : amount
            ? `${amount} so'm`
            : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative flex w-full max-w-lg animate-in flex-col rounded-3xl border border-slate-200/80 bg-card p-6 shadow-2xl duration-150 zoom-in-95 dark:border-slate-800">
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Modal Header */}
                <div className="flex items-center gap-3 border-b pb-4 dark:border-slate-800">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-lightblue text-brand-brown shadow-xs">
                        <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">
                            {modalTitle || t('payment.modal_title') || 'Complete Your Payment'}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {modalDescription ||
                                t('payment.modal_desc') ||
                                'Send payment to the card below and submit your receipt to Telegram with your Name and Pupil ID.'}
                        </p>
                    </div>
                </div>

                {/* Order Summary Item (if item details provided) */}
                {(itemTitle || formattedAmount || teacherName) && (
                    <div className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-900/50">
                        <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                                {itemTitle && (
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                        <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                        <span className="truncate">{itemTitle}</span>
                                    </div>
                                )}
                                {teacherName && (
                                    <p className="text-[11px] text-muted-foreground truncate">
                                        Teacher: <span className="font-medium text-foreground">{teacherName}</span>
                                    </p>
                                )}
                            </div>
                            {formattedAmount && (
                                <div className="text-right shrink-0">
                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase block">
                                        Total Due
                                    </span>
                                    <span className="font-mono text-sm font-extrabold text-foreground">
                                        {formattedAmount}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Styled Credit Card UI */}
                <div className="relative mt-4 overflow-hidden rounded-3xl border border-brand-yellow/20 bg-gradient-to-br from-[#061445] via-[#1E2A5A] to-[#0D226B] p-6 text-white shadow-xl">
                    <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-brand-yellow/10 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-brand-lightblue/10 blur-2xl" />

                    {/* Card Top: Chip & Brand */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-10 items-center justify-center rounded-md border border-amber-200 bg-amber-300/80 shadow-inner">
                                <div className="flex h-4 w-6 items-center justify-center border-y border-amber-500/50">
                                    <div className="h-2 w-2 rounded-full border border-amber-600/50" />
                                </div>
                            </div>
                            <span className="text-[10px] font-bold tracking-widest text-brand-yellow uppercase">
                                HUMO / UZCARD
                            </span>
                        </div>
                        <span className="text-sm font-extrabold tracking-wider text-brand-yellow">
                            Convo<span className="text-white">Mate</span>
                        </span>
                    </div>

                    {/* Card Number Section with Copy Button */}
                    <div className="mt-6">
                        <span className="mb-1 block text-[10px] font-semibold tracking-wider text-brand-lightblue/70 uppercase">
                            Card Number
                        </span>
                        <div className="flex items-center justify-between rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 backdrop-blur-md">
                            <span className="font-mono text-lg font-black tracking-widest text-white">
                                {formattedCardNumber}
                            </span>
                            <button
                                type="button"
                                onClick={handleCopyCard}
                                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand-yellow px-2.5 py-1 text-xs font-bold text-brand-brown shadow transition-all hover:bg-brand-yellow-hover hover:scale-105 active:scale-95"
                            >
                                {copiedCard ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-700" />
                                ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                )}
                                <span>{copiedCard ? 'Copied' : t('payment.copy_card') || 'Copy'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Card Bottom Details */}
                    <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-2">
                        <div>
                            <span className="block text-[9px] font-semibold tracking-wider text-brand-lightblue/70 uppercase">
                                {t('payment.card_holder') || 'Card Holder'}
                            </span>
                            <span className="mt-0.5 block truncate text-xs font-bold text-white uppercase">
                                {cardHolder}
                            </span>
                        </div>
                        {pupilId && (
                            <div>
                                <span className="block text-[9px] font-semibold tracking-wider text-brand-lightblue/70 uppercase">
                                    {t('payment.pupil_id') || 'Pupil ID'}
                                </span>
                                <span className="mt-0.5 block font-mono text-xs font-black text-brand-yellow">
                                    {pupilId}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Telegram Verification Warning Box */}
                <div className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/40">
                    <div className="flex gap-3">
                        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                        <div className="space-y-1">
                            <p className="text-xs leading-snug font-extrabold text-amber-900 dark:text-amber-200">
                                {t('payment.warning_notice') ||
                                    'REQUIRED: Include your Name and Pupil ID when submitting your payment receipt to Telegram so admins can verify your booking.'}
                            </p>
                            {(pupilName || pupilId) && (
                                <p className="text-[11px] font-medium text-amber-800/80 dark:text-amber-300/80">
                                    {pupilName && (
                                        <>
                                            Name: <strong className="font-bold">{pupilName}</strong>
                                        </>
                                    )}
                                    {pupilName && pupilId && ' | '}
                                    {pupilId && (
                                        <>
                                            ID:{' '}
                                            <strong className="font-mono font-bold text-amber-950 dark:text-amber-100">
                                                {pupilId}
                                            </strong>
                                        </>
                                    )}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons: Telegram & Close */}
                <div className="mt-5 flex flex-col gap-2.5">
                    <a
                        href="https://t.me/+Z9Gr0FnDDAFhOTky"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#24A1DE] py-3 text-xs font-bold text-white shadow-md transition-all hover:scale-[1.01] hover:bg-[#1D8AC0]"
                    >
                        <ExternalLink className="h-4 w-4" />
                        {t('payment.open_telegram') || 'Send Receipt on Telegram'}
                    </a>
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted dark:border-slate-800"
                    >
                        {t('booking.cancel_btn') || 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
}
