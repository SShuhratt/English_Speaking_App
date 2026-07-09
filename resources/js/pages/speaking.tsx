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
                    setPartnerName(response.data.partner_name);
                    handleMatchFound(response.data.room_id, response.data.partner_id);
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
                handleMatchFound(data.roomId, data.partnerId);
            });

        return () => {
            // Clean up connections on unmount
            cleanup();
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
        setStatus('connecting');

        // Subscribe to Reverb presence channel for WebRTC signaling
        const roomChannelName = `matchroom.${roomId}`;
        matchedRoomChannelRef.current = window.Echo.join(roomChannelName);

        matchedRoomChannelRef.current
            .here((users: any[]) => {
                const partner = users.find(u => u.id === partnerId);
                if (partner) {
                    setPartnerName(partner.full_name || partner.name || "Speaking Partner");
                }

                // If both are present, lower ID initiates offer to prevent WebRTC collisions
                if (users.length >= 2) {
                    // cleanupWebRTC();
                    if (!peerConnectionRef.current) {
                        const initiateCall = currentUserId < partnerId;
                        startWebRTC(initiateCall);
                    }
                }
            })
            .joining((user: any) => {
                if (user.id === partnerId) {
                    setPartnerName(user.full_name || user.name || "Speaking Partner");
                    //cleanupWebRTC();
                    if (!peerConnectionRef.current) {
                        const initiateCall = currentUserId < partnerId;
                        startWebRTC(initiateCall);
                    }
                }
            })
            .leaving((user: any) => {
                if (user.id === partnerId) {
                    toast.info(t('speaking.partner_disconnected') || "Partner left the conversation.");
                    cleanup();
                }
            })
            .listenForWhisper('signal', async (data: any) => {
                const pc = peerConnectionRef.current;
                if (!pc) return;

                if (data.type === 'offer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);

                    matchedRoomChannelRef.current.whisper('signal', {
                        type: 'answer',
                        answer: answer,
                    });
                    setStatus('connected');
                } else if (data.type === 'answer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                    setStatus('connected');
                } else if (data.type === 'candidate') {
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
        try {
            let stream = localStreamRef.current;
            if (!stream) {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                localStreamRef.current = stream;
            }

            // Apply current mute state to tracks
            stream.getAudioTracks().forEach((track) => {
                track.enabled = !isMuted;
            });

            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            peerConnectionRef.current = pc;

            // Add local tracks
            stream.getTracks().forEach((track) => {
                pc.addTrack(track, stream);
            });

            // Handle remote track
            pc.ontrack = (event) => {
                if (remoteAudioRef.current && event.streams[0]) {
                    remoteAudioRef.current.srcObject = event.streams[0];
                }
            };

            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate && matchedRoomChannelRef.current) {
                    matchedRoomChannelRef.current.whisper('signal', {
                        type: 'candidate',
                        candidate: event.candidate,
                    });
                }
            };

            // Caller creates offer
            if (initiateCall) {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                matchedRoomChannelRef.current?.whisper('signal', {
                    type: 'offer',
                    offer: offer,
                });
            }
        } catch (error) {
            console.error("WebRTC initiation failed:", error);
            toast.error(t('speaking.media_error') || "Microphone access denied or audio device not found.");
            leaveQueue();
        }
    };

    // API actions
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
            if (response.data.status === 'matched') {
                handleMatchFound(response.data.room_id, response.data.partner_id);
            }
        } catch (error) {
            toast.error("Failed to join speaking matchmaking queue.");
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
                localStreamRef.current = null;
            }
            setStatus('idle');
        }
    };

    const leaveQueue = async () => {
        try {
            await axios.post('/matchmaking/leave');
        } catch (e) {
            console.error(e);
        }
        cleanup();
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

    // Disconnect and clean WebRTC state
    const cleanup = () => {
        setStatus('idle');
        setPartnerName('');
        setIsMuted(false);

        cleanupWebRTC();

        // Stop local tracks explicitly here when ending/canceling the call
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

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
                            <button
                                onClick={joinQueue}
                                className="px-12 py-4 rounded-full font-bold text-sm bg-brand-yellow text-brand-navy shadow-lg hover:shadow-xl hover:translate-y-[-2px] active:scale-95 duration-200 transition-all cursor-pointer"
                            >
                                {t('speaking.btn_start') || "Start Matchmaking"}
                            </button>
                        </div>
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
