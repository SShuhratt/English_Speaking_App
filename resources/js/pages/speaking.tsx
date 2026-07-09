import { Head, usePage, Link } from '@inertiajs/react';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { Mic, MicOff, PhoneOff, Loader2, ArrowLeft } from 'lucide-react';

export default function Speaking() {
    const { auth } = usePage<any>().props;
    const { t } = useTranslation();
    const currentUserId = auth.user.id;

    // State machine: 'idle' | 'searching' | 'connecting' | 'connected'
    const [status, setStatus] = useState<'idle' | 'searching' | 'connecting' | 'connected'>('idle');
    const [searchTime, setSearchTime] = useState<number>(0);
    const [callTime, setCallTime] = useState<number>(0);
    const [partnerName, setPartnerName] = useState<string>('');
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [activeSessionData, setActiveSessionData] = useState<{
        room_id: string;
        partner_id: number;
        partner_name: string;
    } | null>(null);

    const statusRef = useRef<'idle' | 'searching' | 'connecting' | 'connected'>('idle');

    // Keep statusRef synced with state
    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    // WebRTC & WebSocket Refs
    const localStreamRef = useRef<MediaStream | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const matchChannelRef = useRef<any>(null);
    const matchedRoomChannelRef = useRef<any>(null);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

    // Timers
    const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
    const callTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Check for active session on mount
    useEffect(() => {
        const checkActiveSession = async () => {
            try {
                const response = await axios.get('/matchmaking/active-session');
                if (response.data) {
                    setActiveSessionData(response.data);
                }
            } catch (err) {
                console.error("Failed to check active session:", err);
            }
        };

        checkActiveSession();
    }, []);

    // Heartbeat timer
    useEffect(() => {
        let heartbeatInterval: NodeJS.Timeout | null = null;

        if (status === 'connected') {
            // Send initial heartbeat
            axios.post('/matchmaking/heartbeat');

            heartbeatInterval = setInterval(async () => {
                try {
                    const response = await axios.post('/matchmaking/heartbeat');
                    if (response.data.status === 'terminated') {
                        toast.error(t('speaking.partner_disconnected') || "Partner left the conversation.");
                        cleanup();
                    }
                } catch (err) {
                    console.error("Heartbeat error:", err);
                }
            }, 5000);
        }

        return () => {
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
            }
        };
    }, [status]);

    // Initialize Echo match listener on mount
    useEffect(() => {
        // Listen on user's private match channel
        const channelName = `user.match.${currentUserId}`;
        matchChannelRef.current = window.Echo.private(channelName)
            .listen('.UserMatched', (data: any) => {
                if (statusRef.current === 'searching') {
                    handleMatchFound(data.roomId, data.partnerId);
                }
            });

        return () => {
            // Clean up connections on unmount
            cleanup();
            stopLocalStream();
            if (matchChannelRef.current) {
                window.Echo.leave(`user.match.${currentUserId}`);
            }
        };
    }, [currentUserId]);

    // Handle search timer
    useEffect(() => {
        if (status === 'searching') {
            searchTimerRef.current = setInterval(() => {
                setSearchTime((prev) => prev + 1);
            }, 1000);
        } else {
            if (searchTimerRef.current) {
                clearInterval(searchTimerRef.current);
            }
            setSearchTime(0);
        }

        return () => {
            if (searchTimerRef.current) {
                clearInterval(searchTimerRef.current);
            }
        };
    }, [status]);

    // Handle call timer
    useEffect(() => {
        if (status === 'connected') {
            callTimerRef.current = setInterval(() => {
                setCallTime((prev) => prev + 1);
            }, 1000);
        } else {
            if (callTimerRef.current) {
                clearInterval(callTimerRef.current);
            }
            setCallTime(0);
        }

        return () => {
            if (callTimerRef.current) {
                clearInterval(callTimerRef.current);
            }
        };
    }, [status]);

    // Match found handler
    const handleMatchFound = async (roomId: string, partnerId: number) => {
        console.log("[WebRTC] handleMatchFound triggered. Room ID:", roomId, "Partner ID:", partnerId);
        setStatus('connecting');

        // Subscribe to Reverb presence channel for WebRTC signaling
        const roomChannelName = `matchroom.${roomId}`;
        console.log("[WebRTC] Joining presence channel:", roomChannelName);
        matchedRoomChannelRef.current = window.Echo.join(roomChannelName);

        matchedRoomChannelRef.current
            .here((users: any[]) => {
                console.log("[WebRTC] Presence .here() triggered. Users present in channel:", users);
                const partner = users.find(u => u.id === partnerId);
                if (partner) {
                    setPartnerName(partner.full_name || partner.name || "Speaking Partner");
                }

                if (users.length >= 2) {
                    if (!peerConnectionRef.current) {
                        const initiateCall = currentUserId < partnerId;
                        console.log("[WebRTC] 2 users present in .here(). Initiating call:", initiateCall);
                        startWebRTC(initiateCall);
                    } else {
                        console.log("[WebRTC] 2 users present in .here(), but peerConnection already exists.");
                    }
                }
            })
            .joining((user: any) => {
                console.log("[WebRTC] Presence .joining() triggered. User joined:", user);
                if (user.id === partnerId) {
                    setPartnerName(user.full_name || user.name || "Speaking Partner");
                    if (peerConnectionRef.current) {
                        console.log("[WebRTC] Partner rejoined. Cleaning up stale peer and forcing renegotiation.");
                        cleanupWebRTC();
                        startWebRTC(true);
                    } else {
                        const initiateCall = currentUserId < partnerId;
                        console.log("[WebRTC] Partner joined. Starting WebRTC call. Initiating:", initiateCall);
                        startWebRTC(initiateCall);
                    }
                }
            })
            .leaving((user: any) => {
                console.log("[WebRTC] Presence .leaving() triggered. User left:", user);
                if (user.id === partnerId) {
                    toast.info(t('speaking.partner_disconnected') || "Partner left the conversation.");
                    cleanup();
                }
            })
            .listenForWhisper('signal', async (data: any) => {
                console.log("[WebRTC] Whisper signal received:", data.type, data);
                const pc = peerConnectionRef.current;
                if (!pc) {
                    console.warn("[WebRTC] Whisper signal ignored because peerConnectionRef.current is null.");
                    return;
                }

                if (data.type === 'offer') {
                    console.log("[WebRTC] Offer description received. Setting remote description...");
                    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                    console.log("[WebRTC] Remote offer set. Creating answer...");
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    console.log("[WebRTC] Local answer created and set. Whispering answer back...");

                    matchedRoomChannelRef.current.whisper('signal', {
                        type: 'answer',
                        answer: answer,
                    });
                    setStatus('connected');
                } else if (data.type === 'answer') {
                    console.log("[WebRTC] Answer description received. Setting remote description...");
                    await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                    setStatus('connected');
                } else if (data.type === 'candidate') {
                    console.log("[WebRTC] ICE Candidate received. Adding candidate...");
                    await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                }
            });
    };

    // Toggle mute state
    const toggleMute = () => {
        const nextMuted = !isMuted;
        setIsMuted(nextMuted);
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach((track) => {
                track.enabled = !nextMuted;
            });
        }
    };

    // Start WebRTC Connection
    const startWebRTC = async (initiateCall: boolean) => {
        console.log("[WebRTC] startWebRTC called. Initiate Call parameter:", initiateCall);
        if (peerConnectionRef.current) {
            console.log("[WebRTC] startWebRTC aborted because peerConnectionRef.current already exists.");
            return;
        }
        try {
            let stream = localStreamRef.current;
            if (!stream) {
                console.log("[WebRTC] localStreamRef.current is null. Requesting navigator.mediaDevices.getUserMedia...");
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                localStreamRef.current = stream;
            } else {
                console.log("[WebRTC] Reusing existing localStreamRef.current stream:", stream);
            }

            // Apply current mute state to tracks
            stream.getAudioTracks().forEach((track) => {
                track.enabled = !isMuted;
            });

            console.log("[WebRTC] Creating RTCPeerConnection with Google STUN server...");
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            peerConnectionRef.current = pc;

            // Monitor connection states
            pc.onconnectionstatechange = () => {
                console.log("[WebRTC] Peer Connection State changed:", pc.connectionState);
            };
            pc.oniceconnectionstatechange = () => {
                console.log("[WebRTC] ICE Connection State changed:", pc.iceConnectionState);
            };

            // Add local tracks
            console.log("[WebRTC] Adding local tracks to peer connection...");
            stream.getTracks().forEach((track) => {
                pc.addTrack(track, stream);
            });

            // Handle remote track
            pc.ontrack = (event) => {
                console.log("[WebRTC] Remote track received! Stream details:", event.streams[0]);
                if (remoteAudioRef.current && event.streams[0]) {
                    remoteAudioRef.current.srcObject = event.streams[0];
                }
            };

            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log("[WebRTC] Local ICE Candidate generated. Whispering candidate to partner...");
                    if (matchedRoomChannelRef.current) {
                        matchedRoomChannelRef.current.whisper('signal', {
                            type: 'candidate',
                            candidate: event.candidate,
                        });
                    }
                }
            };

            // Caller creates offer with a tiny delay to ensure peer presence subscription is fully ready on the server
            if (initiateCall) {
                console.log("[WebRTC] Initiator role. Setting timeout of 500ms before creating offer...");
                setTimeout(async () => {
                    const activePc = peerConnectionRef.current;
                    if (!activePc) {
                        console.warn("[WebRTC] Offer generation aborted because peerConnection became null during timeout.");
                        return;
                    }
                    try {
                        console.log("[WebRTC] Timeout finished. Creating WebRTC offer...");
                        const offer = await activePc.createOffer();
                        console.log("[WebRTC] Local offer created. Setting local description...");
                        await activePc.setLocalDescription(offer);
                        console.log("[WebRTC] Local description set. Whispering offer to partner...");
                        matchedRoomChannelRef.current?.whisper('signal', {
                            type: 'offer',
                            offer: offer,
                        });
                    } catch (err) {
                        console.error("[WebRTC] Failed to create or send offer:", err);
                    }
                }, 500);
            } else {
                console.log("[WebRTC] Receiver role. Awaiting offer whisper from partner...");
            }
        } catch (error) {
            console.error("[WebRTC] WebRTC initiation failed:", error);
            toast.error(t('speaking.media_error') || "Microphone access denied or audio device not found.");
            leaveQueue();
        }
    };

    // API actions
    const resumeSession = async () => {
        if (!activeSessionData) return;
        try {
            // Request microphone access first within user gesture context
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream;
        } catch (error) {
            console.error("Microphone access check failed:", error);
            toast.error(t('speaking.media_error') || "Microphone access denied or audio device not found.");
            return;
        }

        setPartnerName(activeSessionData.partner_name);
        handleMatchFound(activeSessionData.room_id, activeSessionData.partner_id);
        setActiveSessionData(null);
    };

    const cancelSession = async () => {
        try {
            await axios.post('/matchmaking/leave');
        } catch (e) {
            console.error(e);
        }
        cleanup();
        stopLocalStream();
        setActiveSessionData(null);
    };

    const joinQueue = async () => {
        try {
            // Request microphone access first within the user interaction context
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream;
        } catch (error) {
            console.error("Microphone access check failed:", error);
            toast.error(t('speaking.media_error') || "Microphone access denied or audio device not found.");
            return;
        }

        setStatus('searching');
        try {
            const response = await axios.post('/matchmaking/join');
            if (statusRef.current === 'searching') {
                if (response.data.status === 'matched') {
                    handleMatchFound(response.data.room_id, response.data.partner_id);
                }
            }
        } catch (error) {
            if (statusRef.current === 'searching') {
                toast.error("Failed to join speaking matchmaking queue.");
                stopLocalStream();
                setStatus('idle');
            }
        }
    };

    const leaveQueue = async () => {
        try {
            await axios.post('/matchmaking/leave');
        } catch (e) {
            console.error(e);
        }
        cleanup();
        stopLocalStream();
    };

    // Disconnect and clean WebRTC state only (keeping status, presence channel, and local stream)
    const cleanupWebRTC = () => {
        // Close peer connection
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
        }
    };

    // Stop local microphone stream tracks and release resource
    const stopLocalStream = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
    };

    // Disconnect and clean WebRTC state
    const cleanup = () => {
        setStatus('idle');
        setPartnerName('');
        setIsMuted(false);

        cleanupWebRTC();

        // Leave presence channel
        if (matchedRoomChannelRef.current) {
            const name = matchedRoomChannelRef.current.name;
            window.Echo.leave(name);
            matchedRoomChannelRef.current = null;
        }
    };

    // Format timer counters (e.g. 00:05)
    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    return (
        <>
            <Head title={t('speaking.title') || "Start Speaking"} />

            <div className="flex h-full flex-1 flex-col gap-8 p-4 md:p-8 max-w-4xl mx-auto">

                {/* Header Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-brand-navy p-8 text-white shadow-lg shadow-brand-navy/10">
                    <div className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-brand-lightblue/10 blur-xl" />
                    <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-brand-yellow/10 blur-xl" />

                    <div className="relative z-10 space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-yellow">
                            SPEAKING CLUB
                        </span>
                        <h1 className="text-3xl font-black tracking-tight text-white">
                            {t('speaking.title') || "Start Speaking"}
                        </h1>
                        <p className="text-sm font-medium text-brand-lightblue/80">
                            {t('speaking.desc') || "Practice speaking English with random students in real-time."}
                        </p>
                    </div>
                </div>

                {/* Main Card View */}
                <div className="flex flex-col items-center justify-center bg-white border border-[#d0e4ff]/30 shadow-ambient rounded-3xl p-12 md:p-20 text-center dark:bg-[#0c0c16] dark:border-white/5">
                    {status === 'idle' && (
                        activeSessionData ? (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                <div className="flex justify-center">
                                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 border-2 border-emerald-500 text-emerald-600 shadow-inner">
                                        <Mic className="h-10 w-10 animate-bounce" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h2 className="text-2xl font-extrabold text-brand-navy dark:text-white">
                                        Active Session Detected
                                    </h2>
                                    <p className="text-sm text-[#45464f] max-w-sm mx-auto dark:text-[#A0A0B0]">
                                        We found an active conversation with <strong>{activeSessionData.partner_name}</strong>. Would you like to resume it?
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                    <button
                                        onClick={resumeSession}
                                        className="px-10 py-4 rounded-full font-bold text-sm bg-emerald-600 text-white shadow-lg hover:shadow-xl hover:translate-y-[-2px] active:scale-95 duration-200 transition-all cursor-pointer"
                                    >
                                        Resume Conversation
                                    </button>
                                    <button
                                        onClick={cancelSession}
                                        className="px-10 py-4 rounded-full font-bold text-sm border border-red-500/30 text-red-500 hover:bg-red-50/50 transition-all cursor-pointer dark:hover:bg-red-950/20"
                                    >
                                        Cancel Session
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                <div className="flex justify-center">
                                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-yellow/10 border-2 border-brand-yellow text-brand-navy shadow-inner dark:text-brand-yellow">
                                        <Mic className="h-10 w-10 animate-pulse" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h2 className="text-2xl font-extrabold text-brand-navy dark:text-white">
                                        {t('speaking.ready_title') || "Match with a Speaking Partner"}
                                    </h2>
                                    <p className="text-sm text-[#45464f] max-w-sm mx-auto dark:text-[#A0A0B0]">
                                        {t('speaking.ready_desc') || "Join the queue to be matched instantly with an active user for English practice."}
                                    </p>
                                </div>
                                <div className="flex flex-col items-center gap-4">
                                    <div className="text-[11px] text-amber-600 bg-amber-500/5 px-4 py-2 rounded-xl inline-flex items-center gap-1.5 border border-amber-500/10 font-medium dark:text-amber-400 dark:bg-amber-500/5 dark:border-amber-500/10">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                        Please ensure microphone permission is allowed in your browser settings to connect.
                                    </div>
                                    <button
                                        onClick={joinQueue}
                                        className="px-12 py-4 rounded-full font-bold text-sm bg-brand-yellow text-brand-navy shadow-lg hover:shadow-xl hover:translate-y-[-2px] active:scale-95 duration-200 transition-all cursor-pointer"
                                    >
                                        {t('speaking.btn_start') || "Start Matchmaking"}
                                    </button>
                                </div>
                            </div>
                        )
                    )}

                    {status === 'searching' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <div className="flex justify-center relative">
                                {/* Pulsing circular animation rings */}
                                <div className="absolute inset-0 rounded-full bg-brand-yellow/5 border border-brand-yellow/20 animate-ping" />
                                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-yellow/10 border-2 border-brand-yellow text-brand-navy z-10 dark:text-brand-yellow">
                                    <Loader2 className="h-10 w-10 animate-spin" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h2 className="text-2xl font-extrabold text-brand-navy dark:text-white">
                                    {t('speaking.searching_title') || "Finding speaking partner..."}
                                </h2>
                                <p className="text-xl font-mono font-bold text-brand-navy/60 dark:text-[#A0A0B0]">
                                    {formatTime(searchTime)}
                                </p>
                            </div>
                            <button
                                onClick={leaveQueue}
                                className="px-10 py-3 rounded-full font-bold text-sm border border-red-500/30 text-red-500 hover:bg-red-50/50 transition-all cursor-pointer dark:hover:bg-red-950/20"
                            >
                                {t('dashboard.cancel_button') || "Cancel"}
                            </button>
                        </div>
                    )}

                    {status === 'connecting' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <div className="flex justify-center">
                                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 border-2 border-emerald-500 text-emerald-600">
                                    <Loader2 className="h-10 w-10 animate-spin" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h2 className="text-2xl font-extrabold text-brand-navy dark:text-white">
                                    {t('speaking.connecting_title') || "Connecting to partner..."}
                                </h2>
                                {partnerName && (
                                    <p className="text-sm font-semibold text-[#45464f] dark:text-[#A0A0B0]">
                                        {t('speaking.partner') || "Partner"}: {partnerName}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={leaveQueue}
                                className="px-10 py-3 rounded-full font-bold text-sm border border-red-500/30 text-red-500 hover:bg-red-50/50 transition-all cursor-pointer dark:hover:bg-red-950/20"
                            >
                                {t('speaking.btn_disconnect') || "Disconnect"}
                            </button>
                        </div>
                    )}

                    {status === 'connected' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <div className="flex justify-center items-center gap-2">
                                {/* Stylized Audio Waves */}
                                <div className="flex items-center gap-1.5 h-12">
                                    <div className="w-1.5 bg-brand-yellow rounded-full animate-bounce h-8" style={{ animationDelay: '0.1s' }} />
                                    <div className="w-1.5 bg-brand-yellow rounded-full animate-bounce h-12" style={{ animationDelay: '0.3s' }} />
                                    <div className="w-1.5 bg-brand-yellow rounded-full animate-bounce h-6" style={{ animationDelay: '0.5s' }} />
                                    <div className="w-1.5 bg-brand-yellow rounded-full animate-bounce h-10" style={{ animationDelay: '0.2s' }} />
                                    <div className="w-1.5 bg-brand-yellow rounded-full animate-bounce h-8" style={{ animationDelay: '0.4s' }} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h2 className="text-2xl font-extrabold text-emerald-600">
                                    {t('speaking.connected') || "Connected"}
                                </h2>
                                <p className="text-lg font-bold text-brand-navy/60 dark:text-white">
                                    {partnerName || "Speaking Partner"}
                                </p>
                                <p className="text-xl font-mono font-bold text-brand-navy dark:text-white">
                                    {formatTime(callTime)}
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-4">
                                <button
                                    onClick={toggleMute}
                                    className={`flex items-center justify-center p-4 rounded-full shadow-md transition-all cursor-pointer ${isMuted
                                        ? 'bg-red-500 text-white hover:bg-red-600'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                        }`}
                                    title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                                >
                                    {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                                </button>

                                <button
                                    onClick={leaveQueue}
                                    className="flex items-center gap-2 px-10 py-4 rounded-full font-bold text-sm bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all cursor-pointer"
                                >
                                    <PhoneOff className="h-4 w-4" />
                                    {t('speaking.btn_end') || "End Conversation"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Hidden Audio element for remote WebRTC stream */}
                <audio ref={remoteAudioRef} autoPlay />
            </div>
        </>
    );
}
