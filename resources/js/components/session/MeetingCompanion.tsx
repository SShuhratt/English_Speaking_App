import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
    Paperclip,
    FileText,
    Image as ImageIcon,
    Link2,
    Send,
    UploadCloud,
    X,
    ExternalLink,
    Maximize2,
    Minimize2,
    FileSpreadsheet,
    MessageCircle,
    ChevronDown,
    ChevronUp,
    Video,
} from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

interface MaterialItem {
    id: string;
    appointment_id: string;
    sender_id: string;
    sender_name: string;
    sender_avatar?: string;
    type: 'document' | 'image' | 'link';
    title: string;
    url?: string;
    file_size?: number;
    formatted_size?: string;
    mime_type?: string;
    telegram_delivery_status: string;
    created_at: string;
}

export async function requestCompanionPiPWindow(
    onUnsupported?: () => void,
): Promise<Window | null> {
    if (typeof window !== 'undefined' && 'documentPictureInPicture' in window) {
        try {
            const availWidth = window.screen.availWidth || window.innerWidth;
            const isDesktop = availWidth >= 768;
            // Comfortable companion floating dimensions for Windows and macOS
            const targetWidth = isDesktop ? 360 : 340;
            const targetHeight = isDesktop ? 560 : 500;

            return await (window as any).documentPictureInPicture.requestWindow({
                width: targetWidth,
                height: targetHeight,
            });
        } catch (err) {
            console.warn('Document Picture-in-Picture window request failed or was dismissed:', err);
            return null;
        }
    }

    if (onUnsupported) {
        onUnsupported();
    }
    return null;
}

export function openGoogleMeetSession(meetLink: string): Window | null {
    if (typeof window === 'undefined' || !meetLink) return null;

    // Launch Google Meet in a clean standard browser tab (no detached window popups).
    // On Windows and macOS, the Document PiP window natively floats above this tab automatically.
    try {
        const meetWin = window.open(meetLink, '_blank');
        if (meetWin) {
            meetWin.focus();
        }
        return meetWin;
    } catch (e) {
        window.location.href = meetLink;
        return null;
    }
}

export function setupPipDocument(win: Window, onHide?: () => void) {
    try {
        win.document.title = 'ConvoMate Companion';
        Array.from(document.styleSheets).forEach((styleSheet) => {
            try {
                const cssRules = Array.from(styleSheet.cssRules)
                    .map((rule) => rule.cssText)
                    .join('');
                const style = document.createElement('style');
                style.textContent = cssRules;
                win.document.head.appendChild(style);
            } catch (e) {
                if (styleSheet.href) {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.type = styleSheet.type || 'text/css';
                    link.media = styleSheet.media?.mediaText || 'all';
                    link.href = styleSheet.href;
                    win.document.head.appendChild(link);
                }
            }
        });

        document.head.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => {
            if (!win.document.head.contains(el)) {
                win.document.head.appendChild(el.cloneNode(true));
            }
        });

        win.document.body.className = 'bg-slate-900 text-slate-100 font-sans p-0 m-0';
        if (onHide) {
            win.addEventListener('pagehide', onHide);
        }
    } catch (err) {
        console.error('Error setting up PiP document styles:', err);
    }
}

interface CompanionProps {
    appointmentId: string;
    isOpen: boolean;
    onClose: () => void;
    autoOpenPiP?: boolean;
    externalPipWindow?: Window | null;
    initialMeetLink?: string | null;
    initialMeetWindow?: Window | null;
}

export default function MeetingCompanion({
    appointmentId,
    isOpen,
    onClose,
    autoOpenPiP = false,
    externalPipWindow,
    initialMeetLink,
    initialMeetWindow,
}: CompanionProps) {
    const { t } = useTranslation();
    const [materials, setMaterials] = useState<MaterialItem[]>([]);
    const [sessionData, setSessionData] = useState<any>(null);
    const [partner, setPartner] = useState<any>(null);
    const [userTelegramConnected, setUserTelegramConnected] = useState(false);
    const [botUsername, setBotUsername] = useState('EnglishSpeakingBot');
    const [activeTab, setActiveTab] = useState<'file' | 'link'>('file');
    const [meetLink, setMeetLink] = useState<string | null>(initialMeetLink || null);

    // Meet window reference & live presence tracking
    const meetWindowRef = useRef<Window | null>(initialMeetWindow || null);
    const [isMeetingActive, setIsMeetingActive] = useState<boolean>(() => {
        return Boolean(initialMeetWindow && !initialMeetWindow.closed);
    });

    // Session-persistent tracking of whether user has joined this lesson at least once
    const [hasJoinedSession, setHasJoinedSession] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return sessionStorage.getItem(`meet_joined_${appointmentId}`) === 'true';
    });

    useEffect(() => {
        if (initialMeetWindow && !initialMeetWindow.closed) {
            meetWindowRef.current = initialMeetWindow;
            setIsMeetingActive(true);
            setHasJoinedSession(true);
            if (typeof window !== 'undefined') {
                sessionStorage.setItem(`meet_joined_${appointmentId}`, 'true');
            }
        }
    }, [initialMeetWindow, appointmentId]);

    // Periodically verify if Google Meet window is active or closed
    useEffect(() => {
        const interval = setInterval(() => {
            const win = meetWindowRef.current;
            if (win) {
                if (win.closed) {
                    setIsMeetingActive(false);
                } else {
                    setIsMeetingActive(true);
                }
            } else {
                setIsMeetingActive(false);
            }
        }, 1500);

        return () => clearInterval(interval);
    }, []);

    const handleMeetAction = () => {
        if (!meetLink) return;

        const win = meetWindowRef.current;
        if (win && !win.closed) {
            win.focus();
            toast.info(t('companion.meeting_live', 'Live in Meeting'));
        } else {
            const newWin = openGoogleMeetSession(meetLink);
            meetWindowRef.current = newWin;
            setIsMeetingActive(true);
            setHasJoinedSession(true);
            if (typeof window !== 'undefined') {
                sessionStorage.setItem(`meet_joined_${appointmentId}`, 'true');
            }
        }
    };

    // Upload state
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragOver, setDragOver] = useState(false);

    // Link state
    const [linkUrl, setLinkUrl] = useState('');
    const [linkTitle, setLinkTitle] = useState('');
    const [submittingLink, setSubmittingLink] = useState(false);

    // PiP state
    const [pipWindow, setPipWindow] = useState<Window | null>(externalPipWindow || null);
    const [isPiPSupported, setIsPiPSupported] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    const [isLinuxTipDismissed, setIsLinuxTipDismissed] = useState(() => {
        if (typeof window === 'undefined') return false;
        try {
            return sessionStorage.getItem(`pip_linux_tip_dismissed_${appointmentId}`) === 'true';
        } catch (e) {
            return false;
        }
    });

    const isLinuxDesktop = typeof navigator !== 'undefined'
        && /Linux/i.test(navigator.userAgent || navigator.platform || '')
        && !/Android/i.test(navigator.userAgent || '');

    const isMobileDevice = typeof window !== 'undefined'
        && (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '') || window.innerWidth < 768);

    const dismissLinuxTip = () => {
        setIsLinuxTipDismissed(true);
        try {
            sessionStorage.setItem(`pip_linux_tip_dismissed_${appointmentId}`, 'true');
        } catch (e) {}
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setIsPiPSupported(
            typeof window !== 'undefined' && 'documentPictureInPicture' in window,
        );
    }, []);

    // If external PiP window is provided, attach to it
    useEffect(() => {
        if (externalPipWindow) {
            setupPipDocument(externalPipWindow, () => {
                setPipWindow(null);
                onClose();
            });
            setPipWindow(externalPipWindow);
        }
    }, [externalPipWindow]);

    useEffect(() => {
        if (initialMeetLink) {
            setMeetLink(initialMeetLink);
        }
    }, [initialMeetLink]);

    // Load materials and metadata
    const fetchMaterials = async () => {
        try {
            const res = await axios.get(
                `/appointments/${appointmentId}/materials`,
            );
            setMaterials(res.data.materials || []);
            setSessionData(res.data.session || null);
            if (res.data.session?.google_meet_link) {
                setMeetLink((prev) => prev || res.data.session.google_meet_link);
            }
            setPartner(res.data.partner || null);
            setUserTelegramConnected(!!res.data.user?.telegram_connected);
            if (res.data.bot_username) {
                setBotUsername(res.data.bot_username);
            }
        } catch (err: any) {
            console.error('Failed to load session materials:', err);
        }
    };

    useEffect(() => {
        if (!isOpen || !appointmentId) return;

        fetchMaterials();

        // Listen for live updates via Laravel Echo
        const channelName = `appointment.${appointmentId}`;
        const echoInstance = (window as any).Echo;

        if (echoInstance) {
            const channel = echoInstance.private(channelName);
            channel.listen('.material.shared', (newMaterial: MaterialItem) => {
                setMaterials((prev) => {
                    if (prev.some((m) => m.id === newMaterial.id)) return prev;
                    return [newMaterial, ...prev];
                });
                toast.success(`New material received: ${newMaterial.title}`);
            });

            return () => {
                echoInstance.leave(channelName);
            };
        }
    }, [isOpen, appointmentId]);

    const toggleMinimize = () => {
        const nextMin = !isMinimized;
        setIsMinimized(nextMin);
        if (pipWindow) {
            try {
                if (nextMin) {
                    pipWindow.resizeTo(260, 68);
                } else {
                    pipWindow.resizeTo(380, 560);
                }
            } catch (e) {
                // Ignore window resize constraints on some OSes
            }
        }
    };

    // Handle Document Picture-in-Picture
    const enterPiP = async (silent: boolean = false) => {
        if (!('documentPictureInPicture' in window)) {
            if (!silent) {
                toast.error(
                    'Always-on-top window is not supported by your current browser. Using the floating companion instead.',
                );
            }
            return;
        }

        try {
            if (pipWindow) {
                pipWindow.close();
            }

            const win = await (
                window as any
            ).documentPictureInPicture.requestWindow({
                width: isMinimized ? 260 : 380,
                height: isMinimized ? 68 : 560,
            });

            setupPipDocument(win, () => {
                setPipWindow(null);
            });

            setPipWindow(win);
        } catch (err: any) {
            console.warn('Failed to open Picture-in-Picture window:', err);
            if (!silent) {
                toast.error('Could not open always-on-top window.');
            }
        }
    };

    // Auto-open PiP if requested and not yet opened
    useEffect(() => {
        if (isOpen && autoOpenPiP && isPiPSupported && !pipWindow) {
            enterPiP(true);
        }
    }, [isOpen, autoOpenPiP, isPiPSupported]);

    // File validation and upload
    const handleFileUpload = async (file: File) => {
        if (file.type.startsWith('video/')) {
            toast.error(
                'Video uploads are not allowed. Please share documents, images, or links.',
            );
            return;
        }

        if (file.size > 25 * 1024 * 1024) {
            toast.error('Maximum file size is 25 MB.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        setUploadProgress(0);

        try {
            const res = await axios.post(
                `/appointments/${appointmentId}/materials`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                        const total = progressEvent.total || file.size;
                        const current = Math.round(
                            (progressEvent.loaded * 100) / total,
                        );
                        setUploadProgress(current);
                    },
                },
            );

            const newMat = res.data.material;
            setMaterials((prev) => {
                if (prev.some((m) => m.id === newMat.id)) return prev;
                return [newMat, ...prev];
            });

            if (res.data.delivery_status === 'delivered_both') {
                toast.success('Document sent to both Telegram chats!');
            } else if (res.data.delivery_status === 'delivered_partial') {
                toast.success('Document delivered via Telegram!');
            } else if (res.data.delivery_status === 'pending_telegram_link') {
                toast.info(
                    'Document shared! Connect Telegram to get materials directly in your chat.',
                );
            }
        } catch (err: any) {
            const msg =
                err.response?.data?.message ||
                err.response?.data?.errors?.file?.[0] ||
                'Failed to upload material.';
            toast.error(msg);
        } finally {
            setUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleLinkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!linkUrl.trim()) return;

        setSubmittingLink(true);
        try {
            const res = await axios.post(
                `/appointments/${appointmentId}/materials`,
                {
                    type: 'link',
                    url: linkUrl.trim(),
                    title: linkTitle.trim() || undefined,
                },
            );

            const newMat = res.data.material;
            setMaterials((prev) => {
                if (prev.some((m) => m.id === newMat.id)) return prev;
                return [newMat, ...prev];
            });

            toast.success('Link shared successfully!');
            setLinkUrl('');
            setLinkTitle('');
        } catch (err: any) {
            const msg =
                err.response?.data?.message ||
                err.response?.data?.errors?.url?.[0] ||
                'Failed to share link.';
            toast.error(msg);
        } finally {
            setSubmittingLink(false);
        }
    };

    if (!isOpen) return null;

    const shortId = appointmentId ? appointmentId.replace(/-/g, '').slice(0, 8) : '';
    const sessionTag = `Lesson_${shortId}`;

    const renderMaterialIcon = (type: string, mime?: string) => {
        if (type === 'link') {
            return <Link2 className="w-5 h-5 text-amber-400" />;
        }
        if (type === 'image' || (mime && mime.startsWith('image/'))) {
            return <ImageIcon className="w-5 h-5 text-purple-400" />;
        }
        if (
            mime &&
            (mime.includes('excel') ||
                mime.includes('spreadsheet') ||
                mime.includes('csv'))
        ) {
            return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
        }
        return <FileText className="w-5 h-5 text-rose-400" />;
    };

    // The companion UI content
    const companionContent = (
        <div className="flex flex-col h-full bg-slate-900 text-slate-100 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800/90 border-b border-slate-700/80 backdrop-blur-md">
                <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-semibold text-xs">
                        {partner?.name ? partner.name.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div>
                        <div className="font-semibold text-slate-100 leading-tight">
                            {partner?.name || 'Conversation Partner'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                            {partner?.role === 'teacher' ? 'Teacher' : 'Student'} · #{sessionTag}
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-1.5">
                    {/* Always on top PiP button */}
                    {isPiPSupported && !pipWindow && (
                        <button
                            type="button"
                            onClick={() => enterPiP(false)}
                            title="Open always-on-top floating window"
                            className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-700/60 rounded-lg transition"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={toggleMinimize}
                        title="Minimize for video visibility"
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 rounded-lg transition"
                    >
                        <Minimize2 className="w-4 h-4" />
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            if (pipWindow) {
                                pipWindow.close();
                            }
                            onClose();
                        }}
                        title="Close companion"
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 rounded-lg transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Google Meet Connection / Action Bar */}
            <div className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border-b border-slate-800 flex items-center justify-between gap-2 select-none">
                <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                        <Video className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-100 truncate">
                            {t('companion.google_meet', 'Google Meet')}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                            {meetLink ? (
                                isMeetingActive ? (
                                    <span className="text-emerald-400 flex items-center gap-1 font-medium">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                                        {t('companion.meeting_live', 'Live in Meeting')}
                                    </span>
                                ) : (
                                    <span className="text-slate-300 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                                        {t('companion.room_ready', 'Video room ready')}
                                    </span>
                                )
                            ) : (
                                <span className="text-amber-300/90 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block"></span>
                                    {t('companion.connecting', 'Connecting to session...')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {meetLink ? (
                    isMeetingActive ? (
                        <button
                            type="button"
                            onClick={handleMeetAction}
                            className="px-3 py-1.5 text-xs font-semibold bg-emerald-600/25 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/40 rounded-lg shadow-sm transition flex items-center space-x-1.5 shrink-0 group active:scale-95"
                            title={t('companion.focus_meet', 'Focus Call')}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                            <span>{t('companion.focus_meet', 'Focus Call')}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition" />
                        </button>
                    ) : hasJoinedSession ? (
                        <button
                            type="button"
                            onClick={handleMeetAction}
                            className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg shadow-md hover:shadow-emerald-500/20 transition flex items-center space-x-1.5 shrink-0"
                            title={t('companion.rejoin_meet', 'Rejoin Google Meet')}
                        >
                            <span>{t('companion.rejoin_meet', 'Rejoin Google Meet')}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleMeetAction}
                            className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg shadow-md hover:shadow-emerald-500/20 transition flex items-center space-x-1.5 shrink-0"
                            title={t('companion.join_meet', 'Join Google Meet')}
                        >
                            <span>{t('companion.join_meet', 'Join Google Meet')}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                    )
                ) : (
                    <div className="flex items-center space-x-1.5 text-xs text-slate-400 px-2 py-1">
                        <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* Linux Desktop Always-on-Top PiP Hint */}
            {pipWindow && isLinuxDesktop && !isLinuxTipDismissed && (
                <div className="bg-indigo-950/95 border-b border-indigo-700/60 px-3.5 py-1.5 flex items-center justify-between gap-2 text-[11px] text-indigo-200 select-none animate-in fade-in duration-200">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-amber-300 shrink-0">📌</span>
                        <span className="truncate">
                            {t(
                                'companion.linux_pip_tip',
                                "To keep above your call on Linux: Press Alt+Space → 'Always on Top'",
                            )}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={dismissLinuxTip}
                        className="p-0.5 text-indigo-300 hover:text-white rounded shrink-0 transition"
                        title="Dismiss notice"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Mobile Picture-in-Picture / Telegram Hint */}
            {!pipWindow && isMobileDevice && (
                <div className="bg-slate-800/80 border-b border-slate-700/60 px-3.5 py-1.5 flex items-center gap-2 text-[11px] text-slate-300 select-none">
                    <span className="text-sm shrink-0">📱</span>
                    <span className="leading-snug">
                        {t(
                            'companion.mobile_pip_tip',
                            'Tip: Keep Google Meet in Picture-in-Picture while viewing lesson materials here or in Telegram.',
                        )}
                    </span>
                </div>
            )}

            {/* Tabs */}
            <div className="flex items-center border-b border-slate-800 px-3 pt-2 bg-slate-900">
                        <button
                            type="button"
                            onClick={() => setActiveTab('file')}
                            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition ${
                                activeTab === 'file'
                                    ? 'border-indigo-500 text-indigo-400'
                                    : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>Share File</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('link')}
                            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition ${
                                activeTab === 'link'
                                    ? 'border-indigo-500 text-indigo-400'
                                    : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Link2 className="w-3.5 h-3.5" />
                            <span>Share Link</span>
                        </button>
                    </div>

                    {/* Action Area */}
                    <div className="p-3 bg-slate-900 border-b border-slate-800">
                        {activeTab === 'file' ? (
                            <div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(file);
                                    }}
                                />

                                <div
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setDragOver(true);
                                    }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setDragOver(false);
                                        const file = e.dataTransfer.files?.[0];
                                        if (file) handleFileUpload(file);
                                    }}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition ${
                                        dragOver
                                            ? 'border-indigo-400 bg-indigo-500/10'
                                            : 'border-slate-700 hover:border-slate-500 bg-slate-800/40 hover:bg-slate-800/70'
                                    }`}
                                >
                                    <UploadCloud className="w-6 h-6 mx-auto mb-1 text-indigo-400" />
                                    <div className="text-xs font-medium text-slate-200">
                                        Drop document or click to browse
                                    </div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">
                                        PDF, Word, Excel, Images (Max 25 MB)
                                    </div>
                                </div>

                                {uploading && (
                                    <div className="mt-2.5">
                                        <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                                            <span>Sending to Telegram...</span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-200"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <form onSubmit={handleLinkSubmit} className="space-y-2">
                                <input
                                    type="url"
                                    required
                                    placeholder="https://example.com/materials"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    className="w-full px-2.5 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Optional title (e.g. Vocabulary Bank)"
                                        value={linkTitle}
                                        onChange={(e) => setLinkTitle(e.target.value)}
                                        className="flex-1 px-2.5 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                    />
                                    <button
                                        type="submit"
                                        disabled={submittingLink || !linkUrl.trim()}
                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center space-x-1 transition"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        <span>Send</span>
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Shared Items Feed */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                            <span>Shared During Lesson ({materials.length})</span>
                            <a
                                href={`https://t.me/${botUsername}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 font-medium"
                            >
                                <MessageCircle className="w-3 h-3" />
                                <span>Open Telegram</span>
                            </a>
                        </div>

                        {materials.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 text-xs">
                                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                No materials shared in this session yet.
                            </div>
                        ) : (
                            materials.map((mat) => (
                                <div
                                    key={mat.id}
                                    className="p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition flex items-start space-x-2.5"
                                >
                                    <div className="p-2 bg-slate-900 rounded-lg shrink-0">
                                        {renderMaterialIcon(mat.type, mat.mime_type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-1">
                                            <div className="font-medium text-xs text-slate-200 truncate" title={mat.title}>
                                                {mat.title}
                                            </div>
                                            {mat.type === 'link' && mat.url && (
                                                <a
                                                    href={mat.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-indigo-400 hover:text-indigo-300 shrink-0"
                                                    title="Open link"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            )}
                                        </div>

                                        <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-1">
                                            <span>{mat.sender_name}</span>
                                            {mat.formatted_size && (
                                                <>
                                                    <span>·</span>
                                                    <span>{mat.formatted_size}</span>
                                                </>
                                            )}
                                            <span>·</span>
                                            <span className="text-emerald-400 font-mono text-[10px]">
                                                #{sessionTag}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer Info */}
                    <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 text-center">
                        All materials are saved in Telegram under{' '}
                        <span className="text-indigo-300 font-mono">#{sessionTag}</span>
                    </div>
        </div>
    );

    const miniContent = (
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/95 border border-slate-700/90 rounded-2xl shadow-2xl backdrop-blur-md text-slate-100 select-none">
            <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-indigo-600/40 border border-indigo-500/50 flex items-center justify-center text-indigo-300 font-semibold text-xs shrink-0">
                    {partner?.name ? partner.name.charAt(0).toUpperCase() : 'M'}
                </div>
                <div className="min-w-0">
                    <div className="font-semibold text-xs text-slate-100 truncate">
                        {partner?.name || 'Companion'}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                        <span className="text-indigo-300 font-medium">Materials: {materials.length}</span>
                        {partner?.telegram_connected && (
                            <span className="text-emerald-400 font-medium">· Telegram ✓</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-1 shrink-0 ml-2">
                {meetLink && (
                    <button
                        type="button"
                        onClick={handleMeetAction}
                        title={
                            isMeetingActive
                                ? t('companion.focus_meet', 'Focus Call')
                                : hasJoinedSession
                                  ? t('companion.rejoin_meet', 'Rejoin Google Meet')
                                  : t('companion.join_meet', 'Join Google Meet')
                        }
                        className={`p-1.5 rounded-lg transition ${
                            isMeetingActive
                                ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/60'
                                : 'text-amber-300 hover:text-amber-200 hover:bg-amber-950/60'
                        }`}
                    >
                        <Video className="w-4 h-4" />
                    </button>
                )}
                <button
                    type="button"
                    onClick={toggleMinimize}
                    title="Expand materials panel"
                    className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
                >
                    <Maximize2 className="w-4 h-4 text-indigo-400" />
                </button>
                <button
                    type="button"
                    onClick={() => {
                        if (pipWindow) {
                            pipWindow.close();
                        }
                        onClose();
                    }}
                    title="Close companion"
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );

    // If PiP window is active, render via Portal into pipWindow.document.body
    if (pipWindow) {
        return createPortal(
            isMinimized ? miniContent : companionContent,
            pipWindow.document.body,
        );
    }

    // Otherwise render as a fixed floating companion in the bottom-right corner (responsive for mobile)
    if (isMinimized) {
        return (
            <div className="fixed inset-x-2 bottom-2 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-72 max-w-full z-50">
                {miniContent}
            </div>
        );
    }

    return (
        <div className="fixed inset-x-2 bottom-2 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-96 max-w-full h-[540px] max-h-[calc(100dvh-4rem)] z-50">
            {companionContent}
        </div>
    );
}
