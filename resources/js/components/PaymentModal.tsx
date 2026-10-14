import React, { useState, useEffect, useRef } from 'react';
import { usePage, router } from '@inertiajs/react';
import {
    X,
    CreditCard,
    ExternalLink,
    Sparkles,
    UploadCloud,
    FileCheck2,
    FileText,
    Info,
    Loader2,
    Send,
    QrCode,
    Smartphone,
    Globe,
    Copy,
    Check,
} from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { toast } from 'sonner';
import { PaymentAppIcon } from '@/components/PaymentLogos';

export interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointmentId?: string | number;
    pupilPackageId?: string | number;
    itemTitle?: string;
    amount?: number | string;
    teacherName?: string;
    pupilId?: string;
    pupilName?: string;
    modalTitle?: string;
    modalDescription?: string;
    onSuccess?: () => void;
}

export default function PaymentModal({
    isOpen,
    onClose,
    appointmentId,
    pupilPackageId,
    itemTitle,
    amount,
    teacherName,
    pupilId,
    pupilName,
    modalTitle,
    modalDescription,
    onSuccess,
}: PaymentModalProps) {
    const { t } = useTranslation();
    const { payment, auth } = usePage<{
        payment?: {
            card_number?: string;
            card_holder?: string;
            bot_username?: string;
            qr_svg?: string | null;
        };
        auth?: {
            user?: {
                id: string | number;
                telegram_chat_id?: string | null;
            };
        };
    }>().props;

    const [activeTab, setActiveTab] = useState<'qr' | 'web' | 'mobile'>('qr');
    const [activeApp, setActiveApp] = useState<'click' | 'payme' | 'uzum'>('click');
    const [copiedCard, setCopiedCard] = useState(false);
    const [telegramStatus, setTelegramStatus] = useState<'idle' | 'sent' | 'not_connected'>('idle');
    const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);

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

    // Auto-dispatch payment details to Telegram and fetch smart QR when opened
    useEffect(() => {
        if (!isOpen) return;

        const isMobile =
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
            ) || window.innerWidth < 768;
        if (isMobile) {
            setActiveTab('mobile');
        }

        const type = appointmentId ? 'booking' : pupilPackageId ? 'package' : null;
        const targetId = appointmentId || pupilPackageId;

        if (type && targetId) {
            fetch(`/pay/${type}/${targetId}/qr`)
                .then((res) => (res.ok ? res.text() : null))
                .then((svg) => {
                    if (svg && svg.includes('<svg')) {
                        setQrCodeSvg(svg);
                    }
                })
                .catch(() => {});
        }

        const dispatchUrl = appointmentId
            ? `/pupil/bookings/${appointmentId}/send-telegram-link`
            : pupilPackageId
            ? `/pupil/packages/${pupilPackageId}/send-telegram-link`
            : null;

        if (dispatchUrl) {
            fetch(dispatchUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN':
                        (
                            document.querySelector(
                                'meta[name="csrf-token"]'
                            ) as HTMLMetaElement
                        )?.content || '',
                },
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data?.sent) {
                        setTelegramStatus('sent');
                    } else if (data?.reason === 'not_connected') {
                        setTelegramStatus('not_connected');
                    }
                    if (data?.qr_svg) {
                        setQrCodeSvg(data.qr_svg);
                    }
                })
                .catch(() => {});
        }
    }, [isOpen, appointmentId, pupilPackageId]);

    if (!isOpen) return null;

    const appLinks = {
        click: {
            name: 'Click',
            color: 'bg-blue-600 hover:bg-blue-700 text-white',
            webUrl: 'https://my.click.uz',
        },
        payme: {
            name: 'Payme',
            color: 'bg-[#00CCCC] hover:bg-[#00b4b4] text-teal-950',
            webUrl: 'https://payme.uz',
        },
        uzum: {
            name: 'Uzum Bank',
            color: 'bg-[#7000FF] hover:bg-[#5e00db] text-white',
            webUrl: 'https://bank.uzum.uz',
        },
    };

    const getAppDeepLink = (appKey: 'click' | 'payme' | 'uzum') => {
        if (appKey === 'uzum') {
            return 'uzumbank://';
        }
        return '';
    };

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

    const handleCopyAndOpen = async (appKey: 'click' | 'payme' | 'uzum') => {
        if (!rawCardNumber) return;
        await copyToClipboard(rawCardNumber);
        setCopiedCard(true);
        setTimeout(() => setCopiedCard(false), 2500);

        if (appKey === 'uzum') {
            toast.success(
                t('payment.copied_opening_app', { app: appLinks[appKey].name }) ||
                    `Card number copied! Opening ${appLinks[appKey].name}...`
            );
        } else {
            toast.success(
                t('payment.copied_switch_to_app', { app: appLinks[appKey].name }) ||
                    `Card number copied! Switch to ${appLinks[appKey].name} to complete payment.`
            );
        }
    };

    const handleCopyCard = async () => {
        if (!rawCardNumber) return;
        await copyToClipboard(rawCardNumber);
        setCopiedCard(true);
        toast.success(t('payment.copied_toast') || 'Card number copied to clipboard!');
        setTimeout(() => setCopiedCard(false), 2500);
    };

    const currencySuffix = t('payment.currency') || 'UZS';
    const formattedAmount =
        typeof amount === 'number'
            ? `${amount.toLocaleString('ru-RU').replace(/,/g, ' ')} ${currencySuffix}`
            : amount
            ? `${amount} ${currencySuffix}`
            : null;

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

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files[0]) {
            handleFileSelect(files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files[0]) {
            handleFileSelect(files[0]);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleUploadCheck = () => {
        if (!selectedFile) {
            toast.error(t('payment.select_file_first') || 'Please select a receipt file first.');
            return;
        }

        let uploadUrl = '';
        if (appointmentId) {
            uploadUrl = `/pupil/bookings/${appointmentId}/receipt`;
        } else if (pupilPackageId) {
            uploadUrl = `/pupil/packages/${pupilPackageId}/receipt`;
        } else {
            toast.error(
                t('payment.no_target_error') ||
                    'Unable to identify booking for receipt upload.'
            );
            return;
        }

        const formData = new FormData();
        formData.append('receipt', selectedFile);

        setIsUploading(true);
        router.post(uploadUrl, formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    t('payment.upload_success') || 'Receipt submitted successfully!'
                );
                handleRemoveFile();
                if (onSuccess) onSuccess();
                onClose();
            },
            onError: (errors: any) => {
                const message =
                    errors?.receipt ||
                    errors?.message ||
                    Object.values(errors || {})[0] ||
                    'Failed to verify receipt. Please try again.';
                toast.error(String(message));
            },
            onFinish: () => {
                setIsUploading(false);
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative flex w-full max-w-lg max-h-[92vh] overflow-y-auto animate-in flex-col rounded-3xl border border-slate-200/80 bg-card p-6 shadow-2xl duration-150 zoom-in-95 dark:border-slate-800">
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isUploading}
                    className="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Modal Header */}
                <div className="flex items-center gap-3 border-b pb-4 dark:border-slate-800">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-lightblue text-brand-brown shadow-xs dark:bg-brand-lightblue/20 dark:text-brand-yellow">
                        <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">
                            {modalTitle || t('payment.modal_title') || 'Complete Your Payment'}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {modalDescription ||
                                t('payment.modal_desc') ||
                                'Choose your payment app to transfer the fee, then upload your receipt below for instant automatic verification.'}
                        </p>
                    </div>
                </div>

                {/* Telegram Automatic Dispatch Notice */}
                {telegramStatus === 'sent' && (
                    <div className="mt-3.5 flex items-center gap-2 rounded-xl border border-sky-200/80 bg-sky-50/80 px-3 py-2 text-xs font-semibold text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-200">
                        <Send className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                        <span>
                            {t('payment.telegram_link_sent') ||
                                'Payment link and instructions have been sent to your Telegram bot!'}
                        </span>
                    </div>
                )}

                {/* Order Summary Item */}
                {(itemTitle || formattedAmount || teacherName) && (
                    <div className="mt-3.5 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-900/50">
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
                                        {t('payment.teacher_label') || 'Teacher:'}{' '}
                                        <span className="font-medium text-foreground">{teacherName}</span>
                                    </p>
                                )}
                            </div>
                            {formattedAmount && (
                                <div className="text-right shrink-0">
                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase block">
                                        {t('payment.total_due') || 'Total Due'}
                                    </span>
                                    <span className="font-mono text-sm font-extrabold text-foreground">
                                        {formattedAmount}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Payment Mode Selector Tabs (QR Code / Desktop Web / Mobile App) */}
                <div className="mt-4 flex rounded-xl border border-slate-200 bg-muted/50 p-1 text-xs dark:border-slate-800">
                    <button
                        type="button"
                        onClick={() => setActiveTab('qr')}
                        className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-1.5 font-bold transition-all ${
                            activeTab === 'qr'
                                ? 'bg-card text-foreground shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <QrCode className="h-3.5 w-3.5" />
                        <span>{t('payment.tab_qr') || 'QR Code'}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('web')}
                        className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-1.5 font-bold transition-all ${
                            activeTab === 'web'
                                ? 'bg-card text-foreground shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Globe className="h-3.5 w-3.5" />
                        <span>{t('payment.tab_web') || 'Web Browser'}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('mobile')}
                        className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-1.5 font-bold transition-all ${
                            activeTab === 'mobile'
                                ? 'bg-card text-foreground shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Smartphone className="h-3.5 w-3.5" />
                        <span>{t('payment.tab_mobile') || 'Mobile App'}</span>
                    </button>
                </div>

                {/* TAB 1: QR CODE SCANNING */}
                {activeTab === 'qr' && (
                    <div className="mt-3.5 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-900/50">
                        <p className="text-xs font-bold text-foreground">
                            {t('payment.qr_scan_title') || 'Scan with your phone camera:'}
                        </p>
                        <div className="mx-auto my-2.5 flex h-40 w-40 items-center justify-center rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-700">
                            {qrCodeSvg || payment?.qr_svg ? (
                                <div
                                    className="h-full w-full [&_svg]:h-full [&_svg]:w-full"
                                    dangerouslySetInnerHTML={{ __html: qrCodeSvg || payment?.qr_svg }}
                                />
                            ) : (
                                <QrCode className="h-20 w-20 text-slate-400" />
                            )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            {t('payment.qr_scan_smart_hint') ||
                                'Scan with your phone camera to open payment on your smartphone.'}
                        </p>

                        {/* 1-Tap Copy Card under QR block */}
                        <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800/80">
                            <span className="font-mono text-xs font-bold tracking-wider text-foreground">
                                {formattedCardNumber}
                            </span>
                            <button
                                type="button"
                                onClick={handleCopyCard}
                                className="flex cursor-pointer items-center gap-1 rounded-lg bg-brand-button px-2.5 py-1 text-[11px] font-bold text-brand-brown shadow-xs transition-all hover:bg-brand-button-hover active:scale-95 dark:bg-brand-yellow dark:text-[#061445]"
                            >
                                {copiedCard ? (
                                    <Check className="h-3 w-3 text-emerald-700" />
                                ) : (
                                    <Copy className="h-3 w-3" />
                                )}
                                <span>
                                    {copiedCard
                                        ? t('payment.copied_btn') || 'Copied'
                                        : t('payment.copy_btn') || 'Copy Card'}
                                </span>
                            </button>
                        </div>
                    </div>
                )}

                {/* TAB 2: DESKTOP WEB BANKING */}
                {activeTab === 'web' && (
                    <div className="mt-3.5 space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">
                                {t('payment.desktop_web_title') || 'Pay via desktop browser'}
                            </span>
                            <span className="rounded-lg bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                Click Web
                            </span>
                        </div>

                        <p className="text-[11px] text-muted-foreground">
                            {t('payment.click_web_desc') || 'Go to Click website and transfer to the card:'}
                        </p>

                        {/* Direct Click Web button */}
                        <a
                            href="https://my.click.uz"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-slate-300 bg-background py-2.5 text-xs font-bold text-foreground shadow-xs transition-all hover:bg-muted dark:border-slate-700"
                        >
                            <Globe className="h-3.5 w-3.5 text-blue-600" />
                            <span>
                                {t('payment.open_web_in_new_tab', { app: 'Click' }) ||
                                    'Open Click website in new tab'}
                            </span>
                            <ExternalLink className="h-3 w-3" />
                        </a>

                        {/* Copy Card for Web Banking */}
                        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-background px-3 py-2 dark:border-slate-800">
                            <span className="font-mono text-xs font-bold tracking-wider text-foreground">
                                {formattedCardNumber}
                            </span>
                            <button
                                type="button"
                                onClick={handleCopyCard}
                                className="flex cursor-pointer items-center gap-1 rounded-lg bg-brand-button px-2.5 py-1 text-[11px] font-bold text-brand-brown shadow-xs transition-all hover:bg-brand-button-hover active:scale-95 dark:bg-brand-yellow dark:text-[#061445]"
                            >
                                {copiedCard ? (
                                    <Check className="h-3 w-3 text-emerald-700" />
                                ) : (
                                    <Copy className="h-3 w-3" />
                                )}
                                <span>
                                    {copiedCard
                                        ? t('payment.copied_btn') || 'Copied'
                                        : t('payment.copy_btn') || 'Copy Card'}
                                </span>
                            </button>
                        </div>

                        {/* Note about Payme & Uzum mobile requirement */}
                        <p className="text-[11px] text-muted-foreground">
                            {t('payment.payme_uzum_mobile_hint') ||
                                'Payme and Uzum Bank require mobile app — please scan the QR code with your phone.'}
                        </p>
                    </div>
                )}

                {/* TAB 3: MOBILE APPS DIRECT LAUNCH */}
                {activeTab === 'mobile' && (
                    <div className="mt-3.5 space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                            {(['click', 'payme', 'uzum'] as const).map((appKey) => {
                                const isDirectApp = appKey === 'uzum';
                                const commonClasses = `flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3 text-center shadow-xs transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${appLinks[appKey].color}`;

                                return isDirectApp ? (
                                    <a
                                        key={appKey}
                                        href={getAppDeepLink(appKey)}
                                        onClick={() => handleCopyAndOpen(appKey)}
                                        className={commonClasses}
                                    >
                                        <PaymentAppIcon app={appKey} className="h-7 w-auto max-w-[85px] object-contain rounded-md shadow-xs" />
                                        <span className="text-xs font-black uppercase">
                                            {appLinks[appKey].name}
                                        </span>
                                        <span className="text-[10px] opacity-90 flex items-center gap-0.5">
                                            {t('payment.open_in_app') || 'Open in app'}
                                            <ExternalLink className="h-2.5 w-2.5" />
                                        </span>
                                    </a>
                                ) : (
                                    <button
                                        key={appKey}
                                        type="button"
                                        onClick={() => handleCopyAndOpen(appKey)}
                                        className={commonClasses}
                                    >
                                        <PaymentAppIcon app={appKey} className="h-7 w-auto max-w-[85px] object-contain rounded-md shadow-xs" />
                                        <span className="text-xs font-black uppercase">
                                            {appLinks[appKey].name}
                                        </span>
                                        <span className="text-[10px] opacity-90 flex items-center gap-0.5">
                                            {copiedCard
                                                ? (t('payment.copied_btn') || 'Copied')
                                                : (t('payment.copy_btn') || 'Copy Card')}
                                            {copiedCard ? (
                                                <Check className="h-2.5 w-2.5" />
                                            ) : (
                                                <Copy className="h-2.5 w-2.5" />
                                            )}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* P2P Step-by-Step Guidance Box */}
                        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                                <h4 className="text-xs font-bold text-foreground">
                                    {t('payment.p2p_instructions_title') || 'How to complete your payment:'}
                                </h4>
                            </div>
                            <ol className="space-y-1.5 text-xs text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-lightblue/50 text-[10px] font-bold text-brand-brown dark:bg-brand-lightblue/20 dark:text-brand-yellow">
                                        1
                                    </span>
                                    <span>
                                        {t('payment.p2p_step_1') || 'Tap any app above to copy the card number.'}
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-lightblue/50 text-[10px] font-bold text-brand-brown dark:bg-brand-lightblue/20 dark:text-brand-yellow">
                                        2
                                    </span>
                                    <span>
                                        {t('payment.p2p_step_2', { app: 'Click / Payme / Uzum' }) || 'Switch to your banking app and paste into Card Transfers.'}
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-lightblue/50 text-[10px] font-bold text-brand-brown dark:bg-brand-lightblue/20 dark:text-brand-yellow">
                                        3
                                    </span>
                                    <span>
                                        {t('payment.p2p_step_3') || 'Transfer the exact amount, then upload your receipt below.'}
                                    </span>
                                </li>
                            </ol>
                        </div>

                        {/* 1-Tap Copy Card for Mobile fallback */}
                        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-background px-3 py-2 dark:border-slate-800">
                            <span className="font-mono text-xs font-bold tracking-wider text-foreground">
                                {formattedCardNumber}
                            </span>
                            <button
                                type="button"
                                onClick={handleCopyCard}
                                className="flex cursor-pointer items-center gap-1 rounded-lg bg-brand-button px-2.5 py-1 text-[11px] font-bold text-brand-brown shadow-xs transition-all hover:bg-brand-button-hover active:scale-95 dark:bg-brand-yellow dark:text-[#061445]"
                            >
                                {copiedCard ? (
                                    <Check className="h-3 w-3 text-emerald-700" />
                                ) : (
                                    <Copy className="h-3 w-3" />
                                )}
                                <span>
                                    {copiedCard
                                        ? t('payment.copied_btn') || 'Copied'
                                        : t('payment.copy_btn') || 'Copy Card'}
                                </span>
                            </button>
                        </div>

                        {/* Universal Mobile Helper & Web/Store Fallback */}
                        <div className="rounded-xl border border-slate-200/60 bg-muted/30 p-2.5 text-center dark:border-slate-800">
                            <div className="flex items-center justify-center gap-2 text-[11px]">
                                <span className="text-muted-foreground">
                                    {t('payment.dont_have_app') || "Don't have the app?"}
                                </span>
                                <a
                                    href="https://my.click.uz"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-blue-600 hover:underline dark:text-blue-400 inline-flex items-center gap-0.5"
                                >
                                    <span>Click Web</span>
                                    <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {/* Important Verification Tip Banner */}
                <div className="mt-4 rounded-2xl border border-blue-200/80 bg-blue-50/80 p-3.5 text-xs text-blue-950 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200">
                    <div className="flex items-start gap-2.5">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                        <p className="leading-relaxed font-medium">
                            {t('payment.upload_tip') ||
                                'Uploaded checks are verified automatically as long as there is no issue with your payment. So make sure you have paid correctly and the exact amount. Allowed formats: JPG, PNG, WEBP, PDF (screenshots are supported).'}
                        </p>
                    </div>
                </div>

                {/* Telegram Direct Upload Callout Badge */}
                <div className="mt-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 rounded-2xl border border-sky-200/80 bg-sky-50/70 p-3 text-xs text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200">
                    <div className="flex items-start gap-2 min-w-0">
                        <Send className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#24A1DE]" />
                        <div className="min-w-0">
                            <p className="font-semibold leading-relaxed text-[11.5px]">
                                {t('payment.telegram_dropzone_banner', { bot: botUsername }) ||
                                    `Prefer Telegram? You can also send your check directly to our Telegram bot (@${botUsername}) for automatic verification.`}
                            </p>
                        </div>
                    </div>
                    <a
                        href={`https://t.me/${botUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 flex items-center gap-1 rounded-xl bg-[#24A1DE] hover:bg-[#2092ca] text-white px-2.5 py-1 text-[11px] font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                        <span>{t('payment.open_telegram_bot') || 'Send check via Telegram'}</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                </div>

                {/* Receipt Upload Dropzone */}
                <div className="mt-3.5">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={handleFileInputChange}
                        className="hidden"
                    />

                    {!selectedFile ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragLeave={(e) => {
                                e.preventDefault();
                                setIsDragging(false);
                            }}
                            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 text-center transition-all ${
                                isDragging
                                    ? 'border-brand-button bg-brand-lightblue/20'
                                    : 'border-slate-300 hover:border-brand-button hover:bg-slate-50/50 dark:border-slate-700 dark:hover:bg-slate-900/40'
                            }`}
                        >
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                <UploadCloud className="h-4.5 w-4.5" />
                            </div>
                            <p className="mt-2 text-xs font-semibold text-foreground">
                                {t('payment.drop_or_browse') || 'Click or drag check file or screenshot'}
                            </p>
                            <p className="mt-0.5 text-[10.5px] text-muted-foreground">
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
                                        className="h-10 w-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                                    />
                                ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
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
                                onClick={handleRemoveFile}
                                disabled={isUploading}
                                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Primary Action Button: "Upload the check" */}
                <div className="mt-4 flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={handleUploadCheck}
                        disabled={!selectedFile || isUploading}
                        className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-button px-4 py-3 text-xs font-bold text-brand-brown shadow-md shadow-brand-button/20 transition-all hover:bg-brand-button-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-yellow dark:text-[#061445]"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t('payment.verifying_receipt') || 'Verifying receipt...'}
                            </>
                        ) : (
                            <>
                                <FileCheck2 className="h-4 w-4" />
                                {t('payment.upload_check') || 'Upload the check'}
                            </>
                        )}
                    </button>

                    {/* Secondary Option: Direct to Telegram Bot */}
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
        </div>
    );
}
