import { Head, usePage, Link } from '@inertiajs/react';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import {
    Mic,
    MicOff,
    PhoneOff,
    Loader2,
    ArrowLeft,
    User,
    Users,
    Check,
    X,
    PhoneCall,
    Sparkles,
    BookOpen,
    ChevronDown,
    ChevronUp,
    Star,
    Award,
    Shield,
} from 'lucide-react';

interface TopicItem {
    id: string;
    category: string;
    category_key: string;
    title_key: string;
    default_title: string;
    prompt_key: string;
    default_prompt: string;
    bullets_keys: string[];
    default_bullets: string[];
}

const DEFAULT_TOPICS: TopicItem[] = [
    {
        id: 'free_talk',
        category: 'general',
        category_key: 'topics.cat_general',
        title_key: 'topics.free_talk_title',
        default_title: 'Free Talk & Casual Conversation',
        prompt_key: 'topics.free_talk_prompt',
        default_prompt: 'Speak freely about your day, personal interests, or any topic of mutual curiosity.',
        bullets_keys: ['topics.free_talk_b1', 'topics.free_talk_b2', 'topics.free_talk_b3'],
        default_bullets: [
            'Break the ice with a warm introduction',
            'Ask open-ended follow-up questions',
            'Share a real personal story or opinion',
        ],
    },
    {
        id: 'ielts_travel',
        category: 'ielts_part2',
        category_key: 'topics.cat_ielts_part2',
        title_key: 'topics.travel_title',
        default_title: 'IELTS Part 2: A Memorable Journey',
        prompt_key: 'topics.travel_prompt',
        default_prompt: 'Describe a memorable trip you took. Explain where you went, why you went, and why it left such a strong impression.',
        bullets_keys: ['topics.travel_b1', 'topics.travel_b2', 'topics.travel_b3'],
        default_bullets: [
            'Destination & mode of transportation',
            'Who accompanied you and what you explored',
            'Unforgettable highlights or unexpected surprises',
        ],
    },
    {
        id: 'ielts_technology',
        category: 'ielts_part3',
        category_key: 'topics.cat_ielts_part3',
        title_key: 'topics.tech_title',
        default_title: 'IELTS Part 3: AI & The Future of Work',
        prompt_key: 'topics.tech_prompt',
        default_prompt: 'How will artificial intelligence and automation change careers and human communication over the next decade?',
        bullets_keys: ['topics.tech_b1', 'topics.tech_b2', 'topics.tech_b3'],
        default_bullets: [
            'Productivity gains vs. the loss of human touch',
            'Professions most impacted by intelligent tools',
            'Skills future students should cultivate today',
        ],
    },
    {
        id: 'career_challenge',
        category: 'career',
        category_key: 'topics.cat_career',
        title_key: 'topics.career_title',
        default_title: 'Career & Overcoming Challenges',
        prompt_key: 'topics.career_prompt',
        default_prompt: 'Describe a difficult professional or academic problem you faced and the steps you took to resolve it.',
        bullets_keys: ['topics.career_b1', 'topics.career_b2', 'topics.career_b3'],
        default_bullets: [
            'The initial obstacle and key stakeholders involved',
            'The concrete actions and strategy you executed',
            'The final outcome and long-term lesson learned',
        ],
    },
    {
        id: 'hobbies_lifestyle',
        category: 'general',
        category_key: 'topics.cat_general',
        title_key: 'topics.hobbies_title',
        default_title: 'Healthy Habits & Personal Passions',
        prompt_key: 'topics.hobbies_prompt',
        default_prompt: 'What hobby or daily routine has had the greatest positive impact on your physical or mental well-being?',
        bullets_keys: ['topics.hobbies_b1', 'topics.hobbies_b2', 'topics.hobbies_b3'],
        default_bullets: [
            'When and why you started this activity',
            'How you stay consistent during busy periods',
            'Advice you would give someone wanting to try it',
        ],
    },
];

const ENDORSEMENT_TAGS = [
    { key: 'great_listener', labelKey: 'speaking.tag_great_listener', defaultLabel: 'Great Listener 🎧' },
    { key: 'fluent', labelKey: 'speaking.tag_fluent', defaultLabel: 'Fluent & Natural 💬' },
    { key: 'patient', labelKey: 'speaking.tag_patient', defaultLabel: 'Patient & Encouraging 🤝' },
    { key: 'inspiring', labelKey: 'speaking.tag_inspiring', defaultLabel: 'Inspiring Ideas 💡' },
];

export default function Speaking() {
    const { auth } = usePage<any>().props;
    const { t } = useTranslation();
    const currentUserId = auth.user.id;

    // State machine: 'idle' | 'searching' | 'connecting' | 'connected'
    const [status, setStatus] = useState<
        'idle' | 'searching' | 'connecting' | 'connected'
    >('idle');
    const [searchTime, setSearchTime] = useState<number>(0);
    const [callTime, setCallTime] = useState<number>(0);
    const [partnerName, setPartnerName] = useState<string>('');
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [activeSessionData, setActiveSessionData] = useState<{
        room_id: string;
        partner_id: string | number;
        partner_name: string;
        topic?: string;
    } | null>(null);

    // Topics & Cue Card
    const [topics, setTopics] = useState<TopicItem[]>(DEFAULT_TOPICS);
    const [selectedTopicKey, setSelectedTopicKey] = useState<string>('free_talk');
    const [conversationTopic, setConversationTopic] = useState<string>('free_talk');
    const [showTopicPicker, setShowTopicPicker] = useState<boolean>(false);
    const [isCueCardCollapsed, setIsCueCardCollapsed] = useState<boolean>(false);

    // Endorsement Modal & Post-call Summary
    const [showEndorsementModal, setShowEndorsementModal] = useState<boolean>(false);
    const [lastCallSummary, setLastCallSummary] = useState<{
        duration: number;
        partnerId: string | number;
        partnerName: string;
        topic: string;
        talkTimeRatio?: number;
    } | null>(null);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isSubmittingEndorsement, setIsSubmittingEndorsement] = useState<boolean>(false);

    // 50/50 Talk-Time Meter Refs & State
    const remoteStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const localAnalyserRef = useRef<AnalyserNode | null>(null);
    const remoteAnalyserRef = useRef<AnalyserNode | null>(null);
    const talkMeterIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const localTalkUnitsRef = useRef<number>(0);
    const remoteTalkUnitsRef = useRef<number>(0);
    const [talkRatio, setTalkRatio] = useState<{ local: number; remote: number }>({ local: 50, remote: 50 });

    const activePartnerIdRef = useRef<string | number | null>(null);
    const activePartnerNameRef = useRef<string>('');

    const [onlinePupils, setOnlinePupils] = useState<any[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
    const [requestedUserIds, setRequestedUserIds] = useState<number[]>([]);

    const statusRef = useRef<'idle' | 'searching' | 'connecting' | 'connected'>(
        'idle',
    );

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

    // Fetch available topics catalog
    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const response = await axios.get('/matchmaking/topics');
                if (Array.isArray(response.data) && response.data.length > 0) {
                    setTopics(response.data);
                }
            } catch (err) {
                // Keep default topics catalog fallback
            }
        };

        fetchTopics();
    }, []);

    // Check for active session on mount
    useEffect(() => {
        const checkActiveSession = async () => {
            try {
                const response = await axios.get('/matchmaking/active-session');
                if (
                    response.data &&
                    response.data.active &&
                    response.data.room_id &&
                    response.data.partner_name
                ) {
                    setActiveSessionData({
                        room_id: response.data.room_id,
                        partner_id: response.data.partner_id,
                        partner_name: response.data.partner_name,
                        topic: response.data.topic || 'free_talk',
                    });
                } else {
                    setActiveSessionData(null);
                }
            } catch (err) {
                console.error('Failed to check active session:', err);
                setActiveSessionData(null);
            }
        };

        checkActiveSession();
    }, []);

    // Continuous Heartbeat & Status Polling
    useEffect(() => {
        const sendHeartbeat = async () => {
            try {
                const response = await axios.post('/matchmaking/heartbeat');

                // Update online list and incoming requests
                if (response.data.online_pupils) {
                    setOnlinePupils(response.data.online_pupils);
                }
                if (response.data.incoming_requests) {
                    setIncomingRequests(response.data.incoming_requests);
                }

                // Handle session termination if we were connected
                if (
                    statusRef.current === 'connected' &&
                    response.data.status === 'terminated'
                ) {
                    toast.error(
                        t('speaking.partner_disconnected') ||
                            'Partner left the conversation.',
                    );
                    handleCallEnded();
                }
            } catch (err) {
                console.error('Heartbeat error:', err);
            }
        };

        // Send initial heartbeat immediately
        sendHeartbeat();

        const interval = setInterval(sendHeartbeat, 5000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    // Initialize Echo match listener on mount
    useEffect(() => {
        // Listen on user's private match channel
        const channelName = `user.match.${currentUserId}`;
        matchChannelRef.current = window.Echo.private(channelName).listen(
            '.UserMatched',
            (data: any) => {
                if (
                    statusRef.current === 'searching' ||
                    statusRef.current === 'idle'
                ) {
                    handleMatchFound(data.roomId, data.partnerId, data.topic);
                }
            },
        );

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

    // 50/50 Client-Side Talk-Time Meter (Web Audio API)
    const setupTalkMeter = () => {
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;

            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                audioContextRef.current = new AudioContextClass();
            }
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
            }

            if (localStreamRef.current && localStreamRef.current.getAudioTracks().length > 0) {
                try {
                    const localSource = ctx.createMediaStreamSource(localStreamRef.current);
                    const localAnalyser = ctx.createAnalyser();
                    localAnalyser.fftSize = 256;
                    localSource.connect(localAnalyser);
                    localAnalyserRef.current = localAnalyser;
                } catch (e) {
                    console.warn('[TalkMeter] Local analyser error:', e);
                }
            }

            if (remoteStreamRef.current && remoteStreamRef.current.getAudioTracks().length > 0) {
                try {
                    const remoteSource = ctx.createMediaStreamSource(remoteStreamRef.current);
                    const remoteAnalyser = ctx.createAnalyser();
                    remoteAnalyser.fftSize = 256;
                    remoteSource.connect(remoteAnalyser);
                    remoteAnalyserRef.current = remoteAnalyser;
                } catch (e) {
                    console.warn('[TalkMeter] Remote analyser error:', e);
                }
            }

            localTalkUnitsRef.current = 0;
            remoteTalkUnitsRef.current = 0;
            setTalkRatio({ local: 50, remote: 50 });

            const localData = new Uint8Array(128);
            const remoteData = new Uint8Array(128);

            if (talkMeterIntervalRef.current) {
                clearInterval(talkMeterIntervalRef.current);
            }

            talkMeterIntervalRef.current = setInterval(() => {
                let localActive = false;
                let remoteActive = false;

                if (localAnalyserRef.current && !isMuted) {
                    localAnalyserRef.current.getByteFrequencyData(localData);
                    let sum = 0;
                    for (let i = 0; i < localData.length; i++) {
                        sum += localData[i];
                    }
                    const avg = sum / localData.length;
                    if (avg > 15) {
                        localActive = true;
                    }
                }

                if (remoteAnalyserRef.current) {
                    remoteAnalyserRef.current.getByteFrequencyData(remoteData);
                    let sum = 0;
                    for (let i = 0; i < remoteData.length; i++) {
                        sum += remoteData[i];
                    }
                    const avg = sum / remoteData.length;
                    if (avg > 15) {
                        remoteActive = true;
                    }
                }

                if (localActive) localTalkUnitsRef.current += 1;
                if (remoteActive) remoteTalkUnitsRef.current += 1;

                const total = localTalkUnitsRef.current + remoteTalkUnitsRef.current;
                if (total > 0) {
                    const localPct = Math.min(95, Math.max(5, Math.round((localTalkUnitsRef.current / total) * 100)));
                    setTalkRatio({ local: localPct, remote: 100 - localPct });
                }
            }, 400);
        } catch (err) {
            console.warn('[TalkMeter] Setup failed:', err);
        }
    };

    const cleanupTalkMeter = () => {
        if (talkMeterIntervalRef.current) {
            clearInterval(talkMeterIntervalRef.current);
            talkMeterIntervalRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            try {
                audioContextRef.current.close().catch(() => {});
            } catch (e) {
                // Ignore
            }
            audioContextRef.current = null;
        }
        localAnalyserRef.current = null;
        remoteAnalyserRef.current = null;
    };

    // Handle call timer & talk-time meter
    useEffect(() => {
        if (status === 'connected') {
            callTimerRef.current = setInterval(() => {
                setCallTime((prev) => prev + 1);
            }, 1000);
            setupTalkMeter();
        } else {
            if (callTimerRef.current) {
                clearInterval(callTimerRef.current);
            }
            cleanupTalkMeter();
            setCallTime(0);
        }

        return () => {
            if (callTimerRef.current) {
                clearInterval(callTimerRef.current);
            }
            cleanupTalkMeter();
        };
    }, [status]);

    // Match found handler
    const handleMatchFound = async (
        roomId: string,
        partnerId: string | number,
        topic?: string,
    ) => {
        console.log(
            '[WebRTC] handleMatchFound triggered. Room ID:',
            roomId,
            'Partner ID:',
            partnerId,
            'Topic:',
            topic,
        );
        activePartnerIdRef.current = partnerId;
        if (topic) {
            setConversationTopic(topic);
        }
        setStatus('connecting');

        // Subscribe to Reverb presence channel for WebRTC signaling
        const roomChannelName = `matchroom.${roomId}`;
        console.log('[WebRTC] Joining presence channel:', roomChannelName);
        matchedRoomChannelRef.current = window.Echo.join(roomChannelName);

        matchedRoomChannelRef.current
            .here((users: any[]) => {
                console.log(
                    '[WebRTC] Presence .here() triggered. Users present in channel:',
                    users,
                );
                const partner = users.find((u) => u.id === partnerId);
                if (partner) {
                    const name = partner.full_name || partner.name || 'Speaking Partner';
                    setPartnerName(name);
                    activePartnerNameRef.current = name;
                }

                if (users.length >= 2) {
                    if (!peerConnectionRef.current) {
                        const initiateCall = currentUserId < partnerId;
                        console.log(
                            '[WebRTC] 2 users present in .here(). Initiating call:',
                            initiateCall,
                        );
                        startWebRTC(initiateCall);
                    } else {
                        console.log(
                            '[WebRTC] 2 users present in .here(), but peerConnection already exists.',
                        );
                    }
                }
            })
            .joining((user: any) => {
                console.log(
                    '[WebRTC] Presence .joining() triggered. User joined:',
                    user,
                );
                if (user.id === partnerId) {
                    const name = user.full_name || user.name || 'Speaking Partner';
                    setPartnerName(name);
                    activePartnerNameRef.current = name;
                    if (peerConnectionRef.current) {
                        console.log(
                            '[WebRTC] Partner rejoined. Cleaning up stale peer and forcing renegotiation.',
                        );
                        cleanupWebRTC();
                        startWebRTC(true);
                    } else {
                        const initiateCall = currentUserId < partnerId;
                        console.log(
                            '[WebRTC] Partner joined. Starting WebRTC call. Initiating:',
                            initiateCall,
                        );
                        startWebRTC(initiateCall);
                    }
                }
            })
            .leaving((user: any) => {
                console.log(
                    '[WebRTC] Presence .leaving() triggered. User left:',
                    user,
                );
                if (user.id === partnerId) {
                    toast.info(
                        t('speaking.partner_disconnected') ||
                            'Partner left the conversation.',
                    );
                    handleCallEnded();
                }
            })
            .listenForWhisper('signal', async (data: any) => {
                console.log(
                    '[WebRTC] Whisper signal received:',
                    data.type,
                    data,
                );
                const pc = peerConnectionRef.current;
                if (!pc) {
                    console.warn(
                        '[WebRTC] Whisper signal ignored because peerConnectionRef.current is null.',
                    );
                    return;
                }

                if (data.type === 'offer') {
                    console.log(
                        '[WebRTC] Offer description received. Setting remote description...',
                    );
                    await pc.setRemoteDescription(
                        new RTCSessionDescription(data.offer),
                    );
                    console.log(
                        '[WebRTC] Remote offer set. Creating answer...',
                    );
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    console.log(
                        '[WebRTC] Local answer created and set. Whispering answer back...',
                    );

                    matchedRoomChannelRef.current.whisper('signal', {
                        type: 'answer',
                        answer: answer,
                    });
                    setStatus('connected');
                } else if (data.type === 'answer') {
                    console.log(
                        '[WebRTC] Answer description received. Setting remote description...',
                    );
                    await pc.setRemoteDescription(
                        new RTCSessionDescription(data.answer),
                    );
                    setStatus('connected');
                } else if (data.type === 'candidate') {
                    console.log(
                        '[WebRTC] ICE Candidate received. Adding candidate...',
                    );
                    await pc.addIceCandidate(
                        new RTCIceCandidate(data.candidate),
                    );
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
        console.log(
            '[WebRTC] startWebRTC called. Initiate Call parameter:',
            initiateCall,
        );
        if (peerConnectionRef.current) {
            console.log(
                '[WebRTC] startWebRTC aborted because peerConnectionRef.current already exists.',
            );
            return;
        }
        try {
            let stream = localStreamRef.current;
            if (!stream) {
                console.log(
                    '[WebRTC] localStreamRef.current is null. Requesting navigator.mediaDevices.getUserMedia...',
                );
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                });
                localStreamRef.current = stream;
            } else {
                console.log(
                    '[WebRTC] Reusing existing localStreamRef.current stream:',
                    stream,
                );
            }

            // Apply current mute state to tracks
            stream.getAudioTracks().forEach((track) => {
                track.enabled = !isMuted;
            });

            console.log(
                '[WebRTC] Creating RTCPeerConnection with Google STUN server...',
            );
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
            });
            peerConnectionRef.current = pc;

            // Monitor connection states
            pc.onconnectionstatechange = () => {
                console.log(
                    '[WebRTC] Peer Connection State changed:',
                    pc.connectionState,
                );
            };
            pc.oniceconnectionstatechange = () => {
                console.log(
                    '[WebRTC] ICE Connection State changed:',
                    pc.iceConnectionState,
                );
            };

            // Add local tracks
            console.log('[WebRTC] Adding local tracks to peer connection...');
            stream.getTracks().forEach((track) => {
                pc.addTrack(track, stream);
            });

            // Handle remote track
            pc.ontrack = (event) => {
                console.log(
                    '[WebRTC] Remote track received! Stream details:',
                    event.streams[0],
                );
                remoteStreamRef.current = event.streams[0];
                if (remoteAudioRef.current && event.streams[0]) {
                    remoteAudioRef.current.srcObject = event.streams[0];
                }
                if (audioContextRef.current && audioContextRef.current.state !== 'closed' && event.streams[0]) {
                    try {
                        const remoteSource = audioContextRef.current.createMediaStreamSource(event.streams[0]);
                        const remoteAnalyser = audioContextRef.current.createAnalyser();
                        remoteAnalyser.fftSize = 256;
                        remoteSource.connect(remoteAnalyser);
                        remoteAnalyserRef.current = remoteAnalyser;
                    } catch (e) {
                        console.warn('[TalkMeter] Remote analyser error:', e);
                    }
                }
            };

            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log(
                        '[WebRTC] Local ICE Candidate generated. Whispering candidate to partner...',
                    );
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
                console.log(
                    '[WebRTC] Initiator role. Setting timeout of 500ms before creating offer...',
                );
                setTimeout(async () => {
                    const activePc = peerConnectionRef.current;
                    if (!activePc) {
                        console.warn(
                            '[WebRTC] Offer generation aborted because peerConnection became null during timeout.',
                        );
                        return;
                    }
                    try {
                        console.log(
                            '[WebRTC] Timeout finished. Creating WebRTC offer...',
                        );
                        const offer = await activePc.createOffer();
                        console.log(
                            '[WebRTC] Local offer created. Setting local description...',
                        );
                        await activePc.setLocalDescription(offer);
                        console.log(
                            '[WebRTC] Local description set. Whispering offer to partner...',
                        );
                        matchedRoomChannelRef.current?.whisper('signal', {
                            type: 'offer',
                            offer: offer,
                        });
                    } catch (err) {
                        console.error(
                            '[WebRTC] Failed to create or send offer:',
                            err,
                        );
                    }
                }, 500);
            } else {
                console.log(
                    '[WebRTC] Receiver role. Awaiting offer whisper from partner...',
                );
            }
        } catch (error) {
            console.error('[WebRTC] WebRTC initiation failed:', error);
            toast.error(
                t('speaking.media_error') ||
                    'Microphone access denied or audio device not found.',
            );
            leaveQueue();
        }
    };

    // API actions
    const resumeSession = async () => {
        if (!activeSessionData) return;
        try {
            // Request microphone access first within user gesture context
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            localStreamRef.current = stream;
        } catch (error) {
            console.error('Microphone access check failed:', error);
            toast.error(
                t('speaking.media_error') ||
                    'Microphone access denied or audio device not found.',
            );
            return;
        }

        setPartnerName(activeSessionData.partner_name);
        handleMatchFound(
            activeSessionData.room_id,
            activeSessionData.partner_id,
            activeSessionData.topic || 'free_talk',
        );
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
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            localStreamRef.current = stream;
        } catch (error) {
            console.error('Microphone access check failed:', error);
            toast.error(
                t('speaking.media_error') ||
                    'Microphone access denied or audio device not found.',
            );
            return;
        }

        setStatus('searching');
        setConversationTopic(selectedTopicKey);
        try {
            const response = await axios.post('/matchmaking/join', {
                topic: selectedTopicKey,
            });
            if (statusRef.current === 'searching') {
                if (response.data.status === 'matched') {
                    handleMatchFound(
                        response.data.room_id,
                        response.data.partner_id,
                        response.data.topic || selectedTopicKey,
                    );
                }
            }
        } catch (error) {
            if (statusRef.current === 'searching') {
                toast.error('Failed to join speaking matchmaking queue.');
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

    const handleCallEnded = () => {
        const finalDuration = callTime;
        const finalPartnerId = activePartnerIdRef.current;
        const finalPartnerName =
            partnerName || activePartnerNameRef.current || 'Speaking Partner';
        const finalTopic = conversationTopic;
        const finalRatio = talkRatio.local;

        try {
            axios.post('/matchmaking/leave');
        } catch (e) {
            console.error(e);
        }
        cleanup();
        stopLocalStream();

        if (finalDuration >= 15 && finalPartnerId) {
            setLastCallSummary({
                duration: finalDuration,
                partnerId: finalPartnerId,
                partnerName: finalPartnerName,
                topic: finalTopic,
                talkTimeRatio: finalRatio,
            });
            setSelectedTags([]);
            setShowEndorsementModal(true);
        }
    };

    const toggleTag = (tagKey: string) => {
        setSelectedTags((prev) =>
            prev.includes(tagKey)
                ? prev.filter((k) => k !== tagKey)
                : [...prev, tagKey],
        );
    };

    const submitEndorsement = async () => {
        if (!lastCallSummary?.partnerId) {
            setShowEndorsementModal(false);
            return;
        }

        try {
            setIsSubmittingEndorsement(true);
            const response = await axios.post('/matchmaking/endorse', {
                receiver_id: lastCallSummary.partnerId,
                tags: selectedTags,
                duration_seconds: lastCallSummary.duration,
                talk_time_ratio: lastCallSummary.talkTimeRatio,
            });
            if (response.data?.balanced_bonus) {
                toast.success(
                    t('speaking.balanced_bonus_earned') ||
                        'Balanced dialogue achieved! +20 XP bonus awarded!',
                );
            } else {
                toast.success(
                    t('speaking.endorsement_submitted') ||
                        'Endorsement submitted! +2 Karma earned.',
                );
            }
        } catch (err) {
            console.error('Failed to submit endorsement:', err);
        } finally {
            setIsSubmittingEndorsement(false);
            setShowEndorsementModal(false);
            setLastCallSummary(null);
            setSelectedTags([]);
        }
    };

    const skipEndorsement = () => {
        setShowEndorsementModal(false);
        setLastCallSummary(null);
        setSelectedTags([]);
    };

    const sendDirectRequest = async (receiverId: number) => {
        try {
            await axios.post('/matchmaking/request', {
                receiver_id: receiverId,
            });
            setRequestedUserIds((prev) => [...prev, receiverId]);
            toast.success('Speaking request sent!');
        } catch (err) {
            console.error('Failed to send speaking request:', err);
            toast.error('Failed to send speaking request.');
        }
    };

    const acceptDirectRequest = async (senderId: number) => {
        try {
            // Check microphone permission first within user gesture context
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            localStreamRef.current = stream;
        } catch (error) {
            console.error('Microphone access check failed:', error);
            toast.error(
                t('speaking.media_error') ||
                    'Microphone access denied or audio device not found.',
            );
            return;
        }

        try {
            const response = await axios.post('/matchmaking/accept', {
                sender_id: senderId,
            });
            if (response.data.status === 'matched') {
                handleMatchFound(
                    response.data.room_id,
                    response.data.partner_id,
                    response.data.topic || 'free_talk',
                );
            }
        } catch (err) {
            console.error('Failed to accept speaking request:', err);
            toast.error(
                'Could not accept request. Partner may have gone offline.',
            );
        }
    };

    const declineDirectRequest = async (senderId: number) => {
        try {
            await axios.post('/matchmaking/decline', { sender_id: senderId });
            setIncomingRequests((prev) =>
                prev.filter((r: any) => r.id !== senderId),
            );
            toast.info('Request declined.');
        } catch (err) {
            console.error('Failed to decline speaking request:', err);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
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
        remoteStreamRef.current = null;
    };

    // Stop local microphone stream tracks and release resource
    const stopLocalStream = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
        }
    };

    // Disconnect and clean WebRTC state
    const cleanup = () => {
        setStatus('idle');
        setPartnerName('');
        activePartnerNameRef.current = '';
        activePartnerIdRef.current = null;
        setIsMuted(false);
        setIsCueCardCollapsed(false);

        cleanupWebRTC();
        cleanupTalkMeter();

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

    const selectedTopicObj =
        topics.find((tp) => tp.id === selectedTopicKey) ||
        topics[0] ||
        DEFAULT_TOPICS[0];

    const currentTopicObj =
        topics.find((tp) => tp.id === conversationTopic) ||
        selectedTopicObj ||
        DEFAULT_TOPICS[0];

    return (
        <>
            <Head title={t('speaking.title') || 'Start Speaking'} />

            <div className="mx-auto flex h-full max-w-6xl flex-1 flex-col gap-8 p-4 text-[#22284A] md:p-8">
                {/* Header Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-brand-navy p-8 text-white shadow-lg shadow-brand-navy/10">
                    <div className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-brand-lightblue/10 blur-xl" />
                    <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-brand-yellow/10 blur-xl" />

                    <div className="relative z-10 space-y-1.5">
                        <span className="text-[10px] font-black tracking-widest text-[#F7DE8B] uppercase">
                            SPEAKING CLUB
                        </span>
                        <h1 className="text-3xl font-black tracking-tight text-white">
                            {t('speaking.title') || 'Start Speaking'}
                        </h1>
                        <p className="text-sm font-medium text-brand-lightblue/80">
                            {t('speaking.desc') ||
                                'Practice speaking English with random students in real-time.'}
                        </p>
                    </div>
                </div>

                {status === 'connected' ? (
                    /* Main Connected Call Screen */
                    <div className="shadow-ambient flex flex-col items-center justify-center rounded-3xl border border-[#d0e4ff]/30 bg-white p-8 text-center md:p-14 dark:border-white/5 dark:bg-[#0c0c16]">
                        <div className="flex w-full max-w-xl flex-col items-center space-y-6 duration-300 animate-in fade-in">
                            <div className="flex items-center justify-center gap-2">
                                <div className="flex h-12 items-center gap-1.5">
                                    <div
                                        className="h-8 w-1.5 animate-bounce rounded-full bg-[#F7DE8B]"
                                        style={{ animationDelay: '0.1s' }}
                                    />
                                    <div
                                        className="h-12 w-1.5 animate-bounce rounded-full bg-[#F7DE8B]"
                                        style={{ animationDelay: '0.3s' }}
                                    />
                                    <div
                                        className="h-6 w-1.5 animate-bounce rounded-full bg-[#F7DE8B]"
                                        style={{ animationDelay: '0.5s' }}
                                    />
                                    <div
                                        className="h-10 w-1.5 animate-bounce rounded-full bg-[#F7DE8B]"
                                        style={{ animationDelay: '0.2s' }}
                                    />
                                    <div
                                        className="h-8 w-1.5 animate-bounce rounded-full bg-[#F7DE8B]"
                                        style={{ animationDelay: '0.4s' }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-2xl font-extrabold text-emerald-600">
                                    {t('speaking.connected') || 'Connected'}
                                </h2>
                                <p className="text-lg font-bold text-brand-navy/80 dark:text-white">
                                    {partnerName || t('speaking.partner') || 'Speaking Partner'}
                                </p>
                                <p className="font-mono text-xl font-bold text-brand-navy dark:text-white">
                                    {formatTime(callTime)}
                                </p>
                            </div>

                            {/* Live Talk-Time Balance Pill */}
                            <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-2.5 backdrop-blur-xs dark:border-white/10 dark:bg-white/5">
                                <div className="flex items-center justify-between gap-4 text-xs font-semibold text-slate-700 dark:text-slate-200 w-full max-w-[280px]">
                                    <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
                                        <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                                        {t('speaking.talk_you') || 'You'} {talkRatio.local}%
                                    </span>
                                    {talkRatio.local >= 40 && talkRatio.local <= 60 && (
                                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                                            {t('speaking.balanced_badge') || '⚖️ Balanced (+20 XP)'}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-bold">
                                        {t('speaking.talk_partner') || 'Partner'} {talkRatio.remote}%
                                        <span className="h-2 w-2 rounded-full bg-slate-400" />
                                    </span>
                                </div>
                                <div className="relative h-2 w-full max-w-[280px] overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                                    <div
                                        className={`h-full transition-all duration-500 ${
                                            talkRatio.local >= 40 && talkRatio.local <= 60
                                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                                : 'bg-indigo-500'
                                        }`}
                                        style={{ width: `${talkRatio.local}%` }}
                                    />
                                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/70 dark:bg-black/50" />
                                </div>
                            </div>

                            {/* Conversation Cue Card */}
                            <div className="w-full text-left rounded-2xl border border-[#E6E9F2] bg-[#FAFBFD] p-5 shadow-xs dark:border-white/10 dark:bg-white/5">
                                <div className="flex items-center justify-between gap-2 border-b border-[#E6E9F2] pb-3 dark:border-white/10">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-full bg-[#1E2A5A] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#F7DE8B] dark:bg-[#F7DE8B] dark:text-[#1E2A5A]">
                                            {t(currentTopicObj.category_key) || currentTopicObj.category}
                                        </span>
                                        <span className="text-xs font-bold text-[#1E2A5A] dark:text-white">
                                            {t(currentTopicObj.title_key) || currentTopicObj.default_title}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsCueCardCollapsed(!isCueCardCollapsed)}
                                        className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-[#6B7394] hover:bg-black/5 dark:text-[#A0A0B0] dark:hover:bg-white/5"
                                    >
                                        {isCueCardCollapsed ? (
                                            <>
                                                <span>{t('speaking.expand_card') || 'Show Prompt'}</span>
                                                <ChevronDown className="h-3.5 w-3.5" />
                                            </>
                                        ) : (
                                            <>
                                                <span>{t('speaking.collapse_card') || 'Hide'}</span>
                                                <ChevronUp className="h-3.5 w-3.5" />
                                            </>
                                        )}
                                    </button>
                                </div>

                                {!isCueCardCollapsed && (
                                    <div className="mt-3 space-y-3 duration-200 animate-in fade-in">
                                        <p className="text-xs font-medium leading-relaxed text-[#22284A] dark:text-slate-200">
                                            {t(currentTopicObj.prompt_key) || currentTopicObj.default_prompt}
                                        </p>
                                        <div className="space-y-1.5 pt-1">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-[#6B7394] dark:text-[#A0A0B0]">
                                                {t('speaking.talking_points') || 'Discussion Ideas'}
                                            </span>
                                            <ul className="space-y-1.5">
                                                {currentTopicObj.bullets_keys?.map((bKey, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-xs text-[#45464f] dark:text-slate-300">
                                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1E2A5A] dark:bg-[#F7DE8B]" />
                                                        <span>{t(bKey) || currentTopicObj.default_bullets?.[idx]}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-center gap-4 pt-2">
                                <button
                                    onClick={toggleMute}
                                    className={`flex cursor-pointer items-center justify-center rounded-full p-4 shadow-md transition-all ${
                                        isMuted
                                            ? 'border-0 bg-red-500 text-white hover:bg-red-600'
                                            : 'border-0 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                    }`}
                                    title={
                                        isMuted
                                            ? 'Unmute Microphone'
                                            : 'Mute Microphone'
                                    }
                                >
                                    {isMuted ? (
                                        <MicOff className="h-6 w-6" />
                                    ) : (
                                        <Mic className="h-6 w-6" />
                                    )}
                                </button>

                                <button
                                    onClick={handleCallEnded}
                                    className="flex cursor-pointer items-center gap-2 rounded-full border-0 bg-red-600 px-10 py-4 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700"
                                >
                                    <PhoneOff className="h-4 w-4" />
                                    {t('speaking.btn_end') ||
                                        'End Conversation'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* 3-Column Grid for matchmaking lobby */
                    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                        {/* Left Column: Online Pupils */}
                        <div className="space-y-4 lg:col-span-3">
                            {onlinePupils.length === 0 ? (
                                <div className="space-y-3">
                                    <h2 className="text-sm font-extrabold text-[#1E2A5A] md:text-base dark:text-[#F7DE8B]">
                                        {t('speaking.nobody_available_title') ||
                                            'Nobody is available for speaking now'}
                                    </h2>
                                    <div className="rounded-[22px] border border-[#E6E9F2] bg-white p-6 text-center shadow-xs select-none dark:border-white/10 dark:bg-[#12131e]">
                                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF4FB] text-[#1E2A5A] dark:bg-white/5 dark:text-[#F7DE8B]">
                                            <Users className="h-6 w-6 opacity-80" />
                                        </div>
                                        <p className="text-xs leading-relaxed text-[#6B7394] dark:text-[#A0A0B0]">
                                            {t('speaking.nobody_available_desc') ||
                                                'Keep this page open or start speaking to wait in the queue for a partner.'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xs font-black tracking-widest text-[#1E2A5A] uppercase dark:text-[#F7DE8B]">
                                            {t(
                                                'speaking.available_for_speaking',
                                            ) || 'Available for Speaking'}
                                        </h2>
                                        <span className="rounded-md border border-[#E6E9F2] bg-white px-2 py-0.5 text-[10px] font-black text-[#1E2A5A] dark:border-white/10 dark:bg-white/5 dark:text-white">
                                            {t('speaking.online_count', {
                                                count: onlinePupils.length,
                                            }) ||
                                                `${onlinePupils.length} Online`}
                                        </span>
                                    </div>
                                    <div className="max-h-[500px] space-y-3 overflow-y-auto pr-1">
                                        {onlinePupils.map((pupil) => {
                                            const hasRequested =
                                                requestedUserIds.includes(
                                                    pupil.id,
                                                );
                                            return (
                                                <div
                                                    key={pupil.id}
                                                    className="flex flex-col gap-3 rounded-[22px] border border-[#E6E9F2] bg-white p-4 shadow-sm transition hover:border-[#A9C6E8]"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Link
                                                            href={`/profile/${pupil.id}`}
                                                            className="shrink-0"
                                                        >
                                                            {pupil.avatar_url ? (
                                                                <img
                                                                    src={
                                                                        pupil.avatar_url
                                                                    }
                                                                    className="h-10 w-10 rounded-xl object-cover transition hover:opacity-85"
                                                                    alt="avatar"
                                                                />
                                                            ) : (
                                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#A9C6E8] to-[#EEF4FB] text-sm font-extrabold text-[#1E2A5A] transition hover:opacity-85">
                                                                    {getInitials(
                                                                        pupil.name,
                                                                    )}
                                                                </div>
                                                            )}
                                                        </Link>
                                                        <div className="min-w-0 flex-1">
                                                            <h3 className="truncate text-xs font-bold text-[#22284A]">
                                                                <Link
                                                                    href={`/profile/${pupil.id}`}
                                                                    className="hover:underline"
                                                                >
                                                                    {pupil.name}
                                                                </Link>
                                                            </h3>
                                                            {pupil.headline && (
                                                                <p className="truncate text-[10px] text-[#6B7394]">
                                                                    {
                                                                        pupil.headline
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2 border-t border-[#FAFBFD] pt-2">
                                                        <div className="flex gap-1.5">
                                                            {pupil.target_speaking_band ? (
                                                                <span className="rounded bg-[#EEF4FB] px-1.5 py-0.5 text-[9px] font-bold text-[#1E2A5A]">
                                                                    IELTS{' '}
                                                                    {
                                                                        pupil.target_speaking_band
                                                                    }
                                                                </span>
                                                            ) : (
                                                                <span />
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() =>
                                                                sendDirectRequest(
                                                                    pupil.id,
                                                                )
                                                            }
                                                            disabled={
                                                                hasRequested
                                                            }
                                                            className={`cursor-pointer rounded-full border-0 px-3 py-1.5 text-[10px] font-bold transition ${
                                                                hasRequested
                                                                    ? 'cursor-default bg-[#EEF4FB] text-[#6B7394]'
                                                                    : 'bg-[#1E2A5A] text-white hover:bg-[#1E2A5A]/90'
                                                            }`}
                                                        >
                                                            {hasRequested
                                                                ? t(
                                                                      'speaking.requested',
                                                                  ) ||
                                                                  'Requested'
                                                                : t(
                                                                      'speaking.request_btn',
                                                                  ) ||
                                                                  'Request'}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Middle Column: Matchmaking Controls */}
                        <div className="lg:col-span-6">
                            <div className="shadow-ambient flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-[#d0e4ff]/30 bg-white p-8 text-center md:p-12 dark:border-white/5 dark:bg-[#0c0c16]">
                                {status === 'idle' &&
                                    (activeSessionData ? (
                                        <div className="animate-in space-y-8 duration-300 fade-in">
                                            <div className="flex justify-center">
                                                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-500/10 text-emerald-600 shadow-inner">
                                                    <Mic className="h-8 w-8 animate-bounce" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h2 className="text-xl font-extrabold text-brand-navy dark:text-white">
                                                    {t(
                                                        'speaking.active_session_detected',
                                                    ) ||
                                                        'Active Session Detected'}
                                                </h2>
                                                <p className="mx-auto max-w-sm text-xs text-[#45464f] dark:text-[#A0A0B0]">
                                                    {t(
                                                        'speaking.active_session_desc',
                                                        {
                                                            name:
                                                                activeSessionData.partner_name ||
                                                                t('speaking.partner') ||
                                                                'Partner',
                                                        },
                                                    ) ||
                                                        `We found an active conversation with ${activeSessionData.partner_name || 'Partner'}. Would you like to resume it?`}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                                                <button
                                                    onClick={resumeSession}
                                                    className="cursor-pointer rounded-full border-0 bg-emerald-600 px-8 py-3.5 text-xs font-bold text-white shadow-lg transition-all duration-200 hover:translate-y-[-2px] hover:shadow-xl active:scale-95"
                                                >
                                                    {t(
                                                        'speaking.resume_conversation',
                                                    ) || 'Resume Conversation'}
                                                </button>
                                                <button
                                                    onClick={cancelSession}
                                                    className="cursor-pointer rounded-full border border-red-500/30 bg-transparent px-8 py-3.5 text-xs font-bold text-red-500 transition-all hover:bg-red-50/50 dark:hover:bg-red-950/20"
                                                >
                                                    {t(
                                                        'speaking.cancel_session',
                                                    ) || 'Cancel Session'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="animate-in space-y-6 duration-300 fade-in">
                                            <div className="flex justify-center">
                                                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#F7DE8B] bg-[#F7DE8B]/10 text-brand-navy shadow-inner dark:text-[#F7DE8B]">
                                                    <Mic className="h-8 w-8 animate-pulse" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h2 className="text-xl font-extrabold text-[#1E2A5A] dark:text-white">
                                                    {t(
                                                        'speaking.ready_title',
                                                    ) ||
                                                        'Match with a Speaking Partner'}
                                                </h2>
                                                <p className="mx-auto max-w-sm text-xs text-[#45464f] dark:text-[#A0A0B0]">
                                                    {t('speaking.ready_desc') ||
                                                        'Join the queue to be matched instantly with an active user for English practice.'}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-center gap-3 w-full max-w-sm">
                                                {/* Topic Selector Card */}
                                                <div className="w-full rounded-2xl border border-[#E6E9F2] bg-[#FAFBFD] p-3.5 text-left shadow-2xs dark:border-white/10 dark:bg-white/5">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[9px] font-black uppercase tracking-wider text-[#6B7394] dark:text-[#A0A0B0]">
                                                                    {t('topics.choose_topic') || 'Conversation Topic'}
                                                                </span>
                                                                <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-bold text-emerald-600 dark:text-emerald-400">
                                                                    {t(selectedTopicObj.category_key) || selectedTopicObj.category}
                                                                </span>
                                                            </div>
                                                            <p className="mt-0.5 truncate text-xs font-extrabold text-[#1E2A5A] dark:text-white">
                                                                {t(selectedTopicObj.title_key) || selectedTopicObj.default_title}
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowTopicPicker(true)}
                                                            className="shrink-0 cursor-pointer rounded-xl border border-[#1E2A5A]/15 bg-white px-3 py-1.5 text-[11px] font-bold text-[#1E2A5A] shadow-2xs transition hover:bg-[#EEF4FB] dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                                                        >
                                                            {t('topics.change_topic') || 'Change'}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/10 bg-amber-500/5 px-4 py-2 text-[10px] font-medium text-amber-600 dark:border-amber-500/10 dark:bg-amber-500/5 dark:text-amber-400">
                                                    <span className="h-1.5 w-1.5 animate-ping rounded-full bg-amber-500" />
                                                    {t(
                                                        'speaking.mic_permission_warning',
                                                    ) ||
                                                        'Please ensure microphone permission is allowed in your browser settings to connect.'}
                                                </div>
                                                <button
                                                    onClick={joinQueue}
                                                    className="cursor-pointer rounded-full border-0 bg-[#F7DE8B] px-10 py-3.5 text-xs font-bold text-[#1E2A5A] shadow-lg transition-all duration-200 hover:translate-y-[-2px] hover:shadow-xl active:scale-95"
                                                >
                                                    {t('speaking.btn_start') ||
                                                        'Start Speaking'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                {status === 'searching' && (
                                    <div className="animate-in space-y-6 duration-300 fade-in">
                                        <div className="relative flex justify-center">
                                            <div className="absolute inset-0 animate-ping rounded-full border border-[#F7DE8B]/20 bg-[#F7DE8B]/5" />
                                            <div className="z-10 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#F7DE8B] bg-[#F7DE8B]/10 text-brand-navy dark:text-[#F7DE8B]">
                                                <Loader2 className="h-8 w-8 animate-spin" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h2 className="text-xl font-extrabold text-[#1E2A5A] dark:text-white">
                                                {t(
                                                    'speaking.searching_title',
                                                ) ||
                                                    'Finding speaking partner...'}
                                            </h2>
                                            <p className="font-mono text-lg font-bold text-[#1E2A5A]/60 dark:text-[#A0A0B0]">
                                                {formatTime(searchTime)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={leaveQueue}
                                            className="cursor-pointer rounded-full border border-red-500/30 bg-transparent px-8 py-3 text-xs font-bold text-red-500 transition-all hover:bg-red-50/50 dark:hover:bg-red-950/20"
                                        >
                                            {t('dashboard.cancel_button') ||
                                                'Cancel'}
                                        </button>
                                    </div>
                                )}

                                {status === 'connecting' && (
                                    <div className="animate-in space-y-6 duration-300 fade-in">
                                        <div className="flex justify-center">
                                            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-500/10 text-emerald-600">
                                                <Loader2 className="h-8 w-8 animate-spin" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h2 className="text-xl font-extrabold text-[#1E2A5A] dark:text-white">
                                                {t(
                                                    'speaking.connecting_title',
                                                ) || 'Connecting to partner...'}
                                            </h2>
                                            {partnerName && (
                                                <p className="text-xs font-semibold text-[#45464f] dark:text-[#A0A0B0]">
                                                    {t('speaking.partner') ||
                                                        'Partner'}
                                                    : {partnerName}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={leaveQueue}
                                            className="cursor-pointer rounded-full border border-red-500/30 bg-transparent px-8 py-3 text-xs font-bold text-red-500 transition-all hover:bg-red-50/50 dark:hover:bg-red-950/20"
                                        >
                                            {t('speaking.btn_disconnect') ||
                                                'Disconnect'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Incoming Requests */}
                        <div className="space-y-4 lg:col-span-3">
                            <h2 className="text-sm font-black tracking-widest text-[#1E2A5A] uppercase dark:text-[#F7DE8B]">
                                {t('speaking.incoming_requests') ||
                                    'Incoming Requests'}
                            </h2>
                            <div className="max-h-[500px] space-y-3 overflow-y-auto pr-1">
                                {incomingRequests.length === 0 ? (
                                    <div className="rounded-[22px] border border-[#E6E9F2] bg-white p-6 text-center text-xs text-[#6B7394] select-none">
                                        {t('speaking.no_incoming_requests') ||
                                            'No incoming requests yet. Keep this page open to receive them!'}
                                    </div>
                                ) : (
                                    incomingRequests.map((req) => (
                                        <div
                                            key={req.id}
                                            className="flex flex-col gap-3 rounded-[22px] border border-[#E6E9F2] bg-white p-4 shadow-sm transition hover:border-[#A9C6E8]"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Link
                                                    href={`/profile/${req.id}`}
                                                    className="shrink-0"
                                                >
                                                    {req.avatar_url ? (
                                                        <img
                                                            src={req.avatar_url}
                                                            className="h-10 w-10 rounded-xl object-cover transition hover:opacity-85"
                                                            alt="avatar"
                                                        />
                                                    ) : (
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#A9C6E8] to-[#EEF4FB] text-sm font-extrabold text-[#1E2A5A] transition hover:opacity-85">
                                                            {getInitials(
                                                                req.name,
                                                            )}
                                                        </div>
                                                    )}
                                                </Link>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="truncate text-xs font-bold text-[#22284A]">
                                                        <Link
                                                            href={`/profile/${req.id}`}
                                                            className="hover:underline"
                                                        >
                                                            {req.name}
                                                        </Link>
                                                    </h3>
                                                    {req.headline && (
                                                        <p className="truncate text-[10px] text-[#6B7394]">
                                                            {req.headline}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between gap-2 border-t border-[#FAFBFD] pt-2">
                                                <div className="flex gap-1.5">
                                                    {req.target_speaking_band ? (
                                                        <span className="rounded bg-[#EEF4FB] px-1.5 py-0.5 text-[9px] font-bold text-[#1E2A5A]">
                                                            IELTS{' '}
                                                            {
                                                                req.target_speaking_band
                                                            }
                                                        </span>
                                                    ) : (
                                                        <span />
                                                    )}
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <button
                                                        onClick={() =>
                                                            declineDirectRequest(
                                                                req.id,
                                                            )
                                                        }
                                                        className="cursor-pointer rounded-full border-0 bg-transparent p-1.5 text-red-500 transition hover:bg-red-50"
                                                        title={
                                                            t(
                                                                'dashboard.cancel_button',
                                                            ) || 'Decline'
                                                        }
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            acceptDirectRequest(
                                                                req.id,
                                                            )
                                                        }
                                                        className="cursor-pointer rounded-full border-0 bg-transparent p-1.5 text-emerald-600 transition hover:bg-emerald-50"
                                                        title={
                                                            t(
                                                                'speaking.connected',
                                                            ) || 'Accept'
                                                        }
                                                    >
                                                        <PhoneCall className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Hidden Audio element for remote WebRTC stream */}
                <audio ref={remoteAudioRef} autoPlay />

                {/* Topic Picker Modal */}
                {showTopicPicker && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs duration-200 animate-in fade-in">
                        <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#E6E9F2] bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#12131e]">
                            <div className="flex items-center justify-between border-b border-[#E6E9F2] pb-4 dark:border-white/10">
                                <div>
                                    <h3 className="text-lg font-black text-[#1E2A5A] dark:text-white">
                                        {t('topics.choose_topic') || 'Choose Conversation Topic'}
                                    </h3>
                                    <p className="text-xs text-[#6B7394] dark:text-[#A0A0B0]">
                                        {t('topics.topic_optional') || 'Optional — Free talk selected by default'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowTopicPicker(false)}
                                    className="cursor-pointer rounded-full p-1.5 text-[#6B7394] hover:bg-[#EEF4FB] hover:text-[#1E2A5A] dark:hover:bg-white/10 dark:hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="mt-4 space-y-3">
                                {topics.map((item) => {
                                    const isSelected = item.id === selectedTopicKey;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedTopicKey(item.id);
                                                setShowTopicPicker(false);
                                            }}
                                            className={`w-full cursor-pointer rounded-2xl border p-4 text-left transition-all duration-200 ${
                                                isSelected
                                                    ? 'border-[#1E2A5A] bg-[#EEF4FB]/60 shadow-xs dark:border-[#F7DE8B] dark:bg-white/10'
                                                    : 'border-[#E6E9F2] bg-white hover:border-[#A9C6E8] dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="rounded-full bg-[#1E2A5A]/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#1E2A5A] dark:bg-[#F7DE8B]/20 dark:text-[#F7DE8B]">
                                                    {t(item.category_key) || item.category}
                                                </span>
                                                {isSelected && (
                                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1E2A5A] text-white dark:bg-[#F7DE8B] dark:text-[#1E2A5A]">
                                                        <Check className="h-3 w-3 stroke-[3]" />
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="mt-2 text-sm font-bold text-[#1E2A5A] dark:text-white">
                                                {t(item.title_key) || item.default_title}
                                            </h4>
                                            <p className="mt-1 line-clamp-2 text-xs text-[#6B7394] dark:text-[#A0A0B0]">
                                                {t(item.prompt_key) || item.default_prompt}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Post-Call Endorsement Modal */}
                {showEndorsementModal && lastCallSummary && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs duration-200 animate-in fade-in">
                        <div className="relative w-full max-w-md rounded-3xl border border-[#E6E9F2] bg-white p-6 text-center shadow-2xl dark:border-white/10 dark:bg-[#12131e]">
                            {/* Top Celebration Icon */}
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F7DE8B]/20 text-[#1E2A5A] dark:text-[#F7DE8B]">
                                <Award className="h-8 w-8" />
                            </div>

                            <h3 className="text-xl font-black text-[#1E2A5A] dark:text-white">
                                {t('speaking.great_conversation') || 'Great Conversation!'}
                            </h3>
                            <p className="mt-1 text-xs text-[#6B7394] dark:text-[#A0A0B0]">
                                {t('speaking.session_complete_desc') || 'Here is a quick summary of your speaking session.'}
                            </p>

                            {/* Metrics Chips */}
                            <div className="mt-5 grid grid-cols-2 gap-2 text-left">
                                <div className="rounded-2xl border border-[#E6E9F2] bg-[#FAFBFD] p-3 dark:border-white/10 dark:bg-white/5">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-[#6B7394] dark:text-[#A0A0B0]">
                                        {t('speaking.call_duration') || 'Call Duration'}
                                    </span>
                                    <p className="font-mono text-base font-extrabold text-[#1E2A5A] dark:text-white">
                                        {formatTime(lastCallSummary.duration)}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-[#E6E9F2] bg-[#FAFBFD] p-3 dark:border-white/10 dark:bg-white/5">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-[#6B7394] dark:text-[#A0A0B0]">
                                        {t('speaking.partner') || 'Partner'}
                                    </span>
                                    <p className="truncate text-sm font-extrabold text-[#1E2A5A] dark:text-white">
                                        {lastCallSummary.partnerName}
                                    </p>
                                </div>
                            </div>

                            {/* Rewards Banner */}
                            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                <span className="flex items-center gap-1">
                                    <Star className="h-3.5 w-3.5 fill-current" />
                                    +15 XP
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <Shield className="h-3.5 w-3.5" />
                                    {lastCallSummary.duration >= 60 ? '+2 Karma Earned' : 'Healthy Session'}
                                </span>
                                {lastCallSummary.duration >= 60 &&
                                    lastCallSummary.talkTimeRatio !== undefined &&
                                    lastCallSummary.talkTimeRatio >= 40 &&
                                    lastCallSummary.talkTimeRatio <= 60 && (
                                        <>
                                            <span>•</span>
                                            <span className="flex items-center gap-1 text-emerald-800 dark:text-emerald-300 font-extrabold">
                                                ⚖️ +20 XP Balanced
                                            </span>
                                        </>
                                    )}
                            </div>

                            {/* Dialogue Mirror (Talk-Time Balance) */}
                            {lastCallSummary.talkTimeRatio !== undefined && (
                                <div className="mt-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 text-left dark:border-white/10 dark:bg-white/5">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span className="text-[#1E2A5A] dark:text-white flex items-center gap-1.5">
                                            <span>🪞</span>
                                            <span>{t('speaking.dialogue_mirror') || 'Dialogue Mirror'}</span>
                                        </span>
                                        {lastCallSummary.talkTimeRatio >= 40 && lastCallSummary.talkTimeRatio <= 60 && (
                                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                                                {t('speaking.balanced_badge') || '⚖️ Balanced (+20 XP)'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-[#6B7394] dark:text-[#A0A0B0]">
                                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                                            {t('speaking.talk_you') || 'You'}: {lastCallSummary.talkTimeRatio}%
                                        </span>
                                        <span>
                                            {t('speaking.talk_partner') || 'Partner'}: {100 - lastCallSummary.talkTimeRatio}%
                                        </span>
                                    </div>
                                    <div className="relative mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                                        <div
                                            className={`h-full transition-all duration-500 ${
                                                lastCallSummary.talkTimeRatio >= 40 && lastCallSummary.talkTimeRatio <= 60
                                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                                    : 'bg-indigo-500'
                                            }`}
                                            style={{ width: `${lastCallSummary.talkTimeRatio}%` }}
                                        />
                                        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/70 dark:bg-black/50" />
                                    </div>
                                    <p className="mt-2 text-[11px] leading-relaxed text-[#6B7394] dark:text-[#A0A0B0]">
                                        {lastCallSummary.talkTimeRatio >= 40 && lastCallSummary.talkTimeRatio <= 60
                                            ? (t('speaking.tip_balanced') || 'Excellent 50/50 balance! You gave each other equal room to speak and listen.')
                                            : lastCallSummary.talkTimeRatio < 40
                                                ? (t('speaking.tip_listened_more') || 'You were an attentive listener! Next time, try sharing a bit more of your thoughts.')
                                                : (t('speaking.tip_talked_more') || 'You were very expressive! Try asking open-ended questions next time to give your partner room.')}
                                    </p>
                                </div>
                            )}

                            {/* Endorsement Tags */}
                            <div className="mt-5 text-left">
                                <span className="text-xs font-black uppercase tracking-wider text-[#1E2A5A] dark:text-white">
                                    {t('speaking.endorse_partner') || 'Endorse Partner'}
                                </span>
                                <p className="text-[11px] text-[#6B7394] dark:text-[#A0A0B0]">
                                    Select tags that describe your experience with {lastCallSummary.partnerName}:
                                </p>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    {ENDORSEMENT_TAGS.map((tag) => {
                                        const isSelected = selectedTags.includes(tag.key);
                                        return (
                                            <button
                                                key={tag.key}
                                                type="button"
                                                onClick={() => toggleTag(tag.key)}
                                                className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                                                    isSelected
                                                        ? 'bg-[#1E2A5A] text-white shadow-xs dark:bg-[#F7DE8B] dark:text-[#1E2A5A]'
                                                        : 'border border-[#E6E9F2] bg-white text-[#22284A] hover:bg-[#EEF4FB] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10'
                                                }`}
                                            >
                                                {t(tag.labelKey) || tag.defaultLabel}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={skipEndorsement}
                                    className="cursor-pointer rounded-full px-4 py-2.5 text-xs font-bold text-[#6B7394] hover:bg-slate-100 dark:hover:bg-white/10"
                                >
                                    {t('speaking.skip') || 'Skip'}
                                </button>
                                <button
                                    type="button"
                                    disabled={isSubmittingEndorsement}
                                    onClick={submitEndorsement}
                                    className="flex cursor-pointer items-center gap-1.5 rounded-full border-0 bg-[#1E2A5A] px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#1E2A5A]/90 dark:bg-[#F7DE8B] dark:text-[#1E2A5A]"
                                >
                                    {isSubmittingEndorsement ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Check className="h-3.5 w-3.5" />
                                    )}
                                    {t('speaking.submit_endorsement') || 'Submit & Finish'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
