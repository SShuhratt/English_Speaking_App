import React, { useState, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    CreditCard,
    CheckCircle2,
    Copy,
    Check,
    ExternalLink,
    UploadCloud,
    FileCheck2,
    FileText,
    Info,
    Loader2,
    Send,
    QrCode,
    X,
    Sparkles,
} from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { toast } from 'sonner';

interface SmartPaymentProps {
    item: {
        type: 'booking' | 'package';
        id: string | number;
        title: string;
        teacher_name?: string;
        pupil_name?: string;
        pupil_id?: string;
        amount: number | string;
        start_at?: string;
        end_at?: string;
        state: 'pending_payment' | 'already_paid' | 'cancelled';
        upload_url: string;
    };
    selected_app?: 'click' | 'payme' | 'uzum';
    payment: {
        card_number?: string;
        card_holder?: string;
        bot_username?: string;
        qr_svg?: string | null;
    };
}

export default function SmartPayment({
    item,
    payment,
}: SmartPaymentProps) {
    const { t } = useTranslation();
    const [copiedCard, setCopiedCard] = useState(false);

    // Receipt upload state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const rawCardNumber = (payment?.card_number || '').replace(/\s+/g, '');
    const formattedCardNumber = rawCardNumber
        ? rawCardNumber.replace(/(\d{4})/g, '$1 ').trim()
        : '';
    const botUsername = payment?.bot_username || 'ConvomateAdminBot';

    const currencySuffix = t('payment.currency') || 'UZS';
    const formattedAmount =
        typeof item.amount === 'number'
            ? `${item.amount.toLocaleString('ru-RU').replace(/,/g, ' ')} ${currencySuffix}`
            : `${item.amount} ${currencySuffix}`;

    const copyToClipboard = async (text: string): Promise<boolean> => {
        if (!text) return false;
        if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch {
                // Fallback below
            }
        }
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            textArea.remove();
            return successful;
        } catch {
            return false;
        }
    };

    const handleCopyCard = async () => {
        if (!rawCardNumber) return;
        await copyToClipboard(rawCardNumber);
        setCopiedCard(true);
        toast.success(t('payment.copied_toast') || 'Card number copied to clipboard!');
        setTimeout(() => setCopiedCard(false), 2500);
    };

    // File selection handlers
    const handleFileSelect = (file: File) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            toast.error(
                t('payment.invalid_file_type') ||
                    'Please select a valid image (JPG, PNG, WEBP) or PDF file.'
            );
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error(
                t('payment.file_too_large') ||
                    'File is too large. Maximum allowed size is 10MB.'
            );
            return;
        }

        setSelectedFile(file);
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setFilePreview(e.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setFilePreview(null);
        }
    };

    const handleUploadCheck = () => {
        if (!selectedFile) {
            toast.error(t('payment.select_file_first') || 'Please select a receipt file first.');
            return;
        }

        const formData = new FormData();
        formData.append('receipt', selectedFile);

        setIsUploading(true);
        router.post(item.upload_url, formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    t('payment.upload_success') || 'Receipt submitted successfully!'
                );
                setSelectedFile(null);
                setFilePreview(null);
            },
            onError: (errors: any) => {
                const message =
                    errors?.receipt ||
                    errors?.message ||
                    Object.values(errors || {})[0] ||
                    'Failed to verify receipt.';
                toast.error(String(message));
            },
            onFinish: () => {
                setIsUploading(false);
            },
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 text-foreground transition-colors dark:bg-slate-950 flex flex-col items-center justify-center p-4 py-12">
            <Head title={`${t('payment.modal_title') || 'Payment'} - ConvoMate`} />

            <div className="w-full max-w-lg">
                {/* Brand Header */}
                <div className="mb-6 text-center">
                    <span className="font-mono text-xs tracking-widest uppercase font-bold text-brand-brown dark:text-brand-yellow">
                        ConvoMate Secure Payment
                    </span>
                    <h1 className="text-2xl font-black text-foreground mt-1 tracking-tight">
                        {t('payment.modal_title') || 'Complete Your Payment'}
                    </h1>
                </div>

                {/* State: Already Paid Card */}
                {item.state === 'already_paid' ? (
                    <div className="rounded-3xl border border-emerald-200 bg-emerald-50/90 p-8 text-center dark:border-emerald-900/60 dark:bg-emerald-950/40 shadow-xl">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                            <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <h2 className="mt-4 text-lg font-black text-emerald-950 dark:text-emerald-100">
                            {t('payment.already_paid_title') || 'Payment Already Completed!'}
                        </h2>
                        <p className="mt-1.5 text-xs text-emerald-800 dark:text-emerald-300">
                            {t('payment.already_paid_desc') ||
                                'Payment for this lesson or package has already been confirmed. Your session is scheduled.'}
                        </p>
                        <button
                            type="button"
                            onClick={() => router.visit('/dashboard')}
                            className="mt-6 inline-flex cursor-pointer items-center justify-center rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow transition-all hover:bg-emerald-700"
                        >
                            {t('payment.go_to_dashboard') || 'Go to Dashboard'}
                        </button>
                    </div>
                ) : (
                    /* Main Payment Card */
                    <div className="rounded-3xl border border-slate-200/80 bg-card p-6 shadow-2xl dark:border-slate-800">
                        {/* Order Summary Box */}
                        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                        <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                        <span className="truncate">{item.title}</span>
                                    </div>
                                    {item.teacher_name && (
                                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                            {t('payment.teacher_label') || 'Teacher:'}{' '}
                                            <span className="font-medium text-foreground">
                                                {item.teacher_name}
                                            </span>
                                        </p>
                                    )}
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase block">
                                        {t('payment.total_due') || 'Total Due'}
                                    </span>
                                    <span className="font-mono text-base font-extrabold text-foreground">
                                        {formattedAmount}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* QR Code & Direct Payment Section */}
                        <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50 p-5 text-center dark:border-slate-800 dark:bg-slate-900/60">
                            <div className="mx-auto my-2 flex h-48 w-48 items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700">
                                {payment?.qr_svg ? (
                                    <div
                                        className="h-full w-full [&_svg]:h-full [&_svg]:w-full"
                                        dangerouslySetInnerHTML={{ __html: payment.qr_svg }}
                                    />
                                ) : (
                                    <QrCode className="h-24 w-24 text-slate-400" />
                                )}
                            </div>

                            <p className="mt-3 text-xs leading-relaxed text-foreground/90 font-medium px-2">
                                {t('payment.qr_simplified_desc', { bot: botUsername }) ||
                                    `Copy the card number and pay with any payment app and send the check file/screenshot to @${botUsername} or the upload field below. You can scan this qr in order to open this payment section on your phone.`}
                            </p>

                            {/* 1-Click Copy Card Number directly below the reminder */}
                            <div className="mt-3.5 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                                <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-foreground">
                                    {formattedCardNumber}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleCopyCard}
                                    className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand-button px-3 py-1.5 text-xs font-bold text-brand-brown shadow-xs transition-all hover:bg-brand-button-hover active:scale-95 dark:bg-brand-yellow dark:text-[#061445]"
                                >
                                    {copiedCard ? (
                                        <Check className="h-3.5 w-3.5 text-emerald-700" />
                                    ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                    )}
                                    <span>
                                        {copiedCard
                                            ? t('payment.copied_btn') || 'Copied'
                                            : t('payment.copy_btn') || 'Copy Card'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Verification Tip Banner */}
                        <div className="mt-5 rounded-2xl border border-blue-200/80 bg-blue-50/80 p-3.5 text-xs text-blue-950 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200">
                            <div className="flex items-start gap-2.5">
                                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                                <p className="leading-relaxed font-medium">
                                    {t('payment.upload_tip') ||
                                        'Uploaded checks are verified automatically as long as there is no issue with your payment. So make sure you have paid correctly and the exact amount. Allowed formats: JPG, PNG, WEBP, PDF (screenshots are supported).'}
                                </p>
                            </div>
                        </div>

                        {/* Telegram Direct Upload Callout Badge */}
                        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-sky-200/80 bg-sky-50/70 p-3.5 text-xs text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200">
                            <div className="flex items-start gap-2.5 min-w-0">
                                <Send className="mt-0.5 h-4 w-4 shrink-0 text-[#24A1DE]" />
                                <div className="min-w-0">
                                    <p className="font-semibold leading-relaxed">
                                        {t('payment.telegram_dropzone_banner', { bot: botUsername }) ||
                                            `Prefer Telegram? You can also send your check directly to our Telegram bot (@${botUsername}) for automatic verification.`}
                                    </p>
                                </div>
                            </div>
                            <a
                                href={`https://t.me/${botUsername}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 flex items-center gap-1.5 rounded-xl bg-[#24A1DE] hover:bg-[#2092ca] text-white px-3 py-1.5 text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                            >
                                <span>{t('payment.open_telegram_bot') || 'Send check via Telegram'}</span>
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>

                        {/* Receipt Upload Dropzone */}
                        <div className="mt-4">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                                }}
                                className="hidden"
                            />

                            {!selectedFile ? (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setIsDragging(false);
                                        if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
                                    }}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDragging(true);
                                    }}
                                    onDragLeave={(e) => {
                                        e.preventDefault();
                                        setIsDragging(false);
                                    }}
                                    className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center transition-all ${
                                        isDragging
                                            ? 'border-brand-button bg-brand-lightblue/20'
                                            : 'border-slate-300 hover:border-brand-button hover:bg-slate-50/50 dark:border-slate-700 dark:hover:bg-slate-900/40'
                                    }`}
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                        <UploadCloud className="h-5 w-5" />
                                    </div>
                                    <p className="mt-2 text-xs font-semibold text-foreground">
                                        {t('payment.drop_or_browse') || 'Click or drag check file or screenshot'}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                        {t('payment.drop_hint') || 'JPG, PNG, WEBP or PDF up to 10MB'}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {filePreview ? (
                                            <img
                                                src={filePreview}
                                                alt="Receipt Preview"
                                                className="h-11 w-11 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                                            />
                                        ) : (
                                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-bold text-foreground">
                                                {selectedFile.name}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {(selectedFile.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedFile(null);
                                            setFilePreview(null);
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                        disabled={isUploading}
                                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Primary Button: Upload the check */}
                        <div className="mt-4 flex flex-col gap-2.5">
                            <button
                                type="button"
                                onClick={handleUploadCheck}
                                disabled={!selectedFile || isUploading}
                                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-button px-4 py-3 text-xs font-bold text-brand-brown shadow-md shadow-brand-button/20 transition-all hover:bg-brand-button-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-yellow dark:text-[#061445]"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>{t('payment.verifying_receipt') || 'Verifying receipt...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <FileCheck2 className="h-4 w-4" />
                                        <span>{t('payment.upload_check') || 'Upload the check'}</span>
                                    </>
                                )}
                            </button>

                            {/* Direct Notice & Fallback to Send check to Bot */}
                            <a
                                href={`https://t.me/${botUsername}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:border-slate-800"
                            >
                                <Send className="h-3.5 w-3.5 text-[#24A1DE]" />
                                <span>
                                    {t('payment.send_receipt_to_telegram', { bot: botUsername }) ||
                                        `Send receipt to Telegram bot (@${botUsername})`}
                                </span>
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
