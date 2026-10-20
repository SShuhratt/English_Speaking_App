import { Mic, Video, PhoneOff } from 'lucide-react';
import React, { useRef, useEffect, useCallback } from 'react';

interface HeroIllustration3DProps {
    liveLessonText: string;
    teacherDialogueText: string;
    teacherLabelText: string;
    studentDialogueText: string;
    studentCalloutLabelText: string;
    studentLabelText: string;
}

export function HeroIllustration3D({
    liveLessonText,
    teacherDialogueText,
    teacherLabelText,
    studentDialogueText,
    studentCalloutLabelText,
    studentLabelText,
}: HeroIllustration3DProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const tilesRef = useRef<HTMLDivElement>(null);
    const studentAvatarRef = useRef<HTMLImageElement>(null);
    const teacherAvatarRef = useRef<HTMLImageElement>(null);
    const teacherBubbleRef = useRef<HTMLDivElement>(null);
    const studentBubbleRef = useRef<HTMLDivElement>(null);
    const callControlsRef = useRef<HTMLDivElement>(null);
    const glareRef = useRef<HTMLDivElement>(null);

    const isHoveredRef = useRef(false);
    const isTouchDeviceRef = useRef(false);
    const prefersReducedMotionRef = useRef(false);

    const currentCoords = useRef({ x: 0, y: 0, glareX: 50, glareY: 50, glareAlpha: 0 });
    const targetCoords = useRef({ x: 0, y: 0, glareX: 50, glareY: 50, glareAlpha: 0 });
    const rafId = useRef<number | null>(null);
    const updatePhysicsRef = useRef<() => void>(() => {});

    useEffect(() => {
        isTouchDeviceRef.current =
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            window.matchMedia('(pointer: coarse)').matches;

        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        prefersReducedMotionRef.current = motionQuery.matches;

        const handleMotionChange = (e: MediaQueryListEvent) => {
            prefersReducedMotionRef.current = e.matches;
        };

        motionQuery.addEventListener('change', handleMotionChange);

        return () => {
            motionQuery.removeEventListener('change', handleMotionChange);
        };
    }, []);

    // 3D Parallax & Depth physics loop
    // Text layers are animated via translate3d(x, y, 0) without rotateX/rotateY,
    // ensuring 100% native vector font clarity with ZERO blur during hover.
    const updatePhysics = useCallback(() => {
        if (!containerRef.current || prefersReducedMotionRef.current) {
            return;
        }

        const curr = currentCoords.current;
        const target = targetCoords.current;

        const ease = 0.14;
        curr.x += (target.x - curr.x) * ease;
        curr.y += (target.y - curr.y) * ease;
        curr.glareX += (target.glareX - curr.glareX) * ease;
        curr.glareY += (target.glareY - curr.glareY) * ease;
        curr.glareAlpha += (target.glareAlpha - curr.glareAlpha) * ease;

        const x = curr.x;
        const y = curr.y;

        // 1. Background Video Tiles: subtle 3D card tilt & elevation shadow (visual element, no text blur)
        if (tilesRef.current) {
            tilesRef.current.style.transform = `perspective(1000px) rotateX(${(-y * 5).toFixed(
                2
            )}deg) rotateY(${(x * 5).toFixed(2)}deg) translate3d(${(-x * 4).toFixed(
                1
            )}px, ${(-y * 4).toFixed(1)}px, 0)`;
            tilesRef.current.style.boxShadow = `0 ${(22 - y * 8).toFixed(1)}px ${(
                45 +
                Math.abs(x) * 10
            ).toFixed(1)}px rgba(30, 42, 90, 0.14)`;
        }

        // 2. Avatars: Depth parallax inside video tiles
        if (studentAvatarRef.current) {
            studentAvatarRef.current.style.transform = `translate3d(${(-x * 8).toFixed(
                1
            )}px, ${(-y * 8).toFixed(1)}px, 0)`;
        }

        if (teacherAvatarRef.current) {
            teacherAvatarRef.current.style.transform = `translate3d(${(-x * 8).toFixed(
                1
            )}px, ${(-y * 8).toFixed(1)}px, 0)`;
        }

        // 3. Dialogue Bubbles: Dynamic 3D lighting shadow ONLY.
        // Text layers NEVER receive 3D rotation or transform, guaranteeing 100% native vector font clarity matching page headings.
        if (teacherBubbleRef.current) {
            teacherBubbleRef.current.style.boxShadow = `${(-x * 10).toFixed(1)}px ${(
                18 - y * 6
            ).toFixed(1)}px 32px rgba(30, 42, 90, 0.16)`;
        }

        if (studentBubbleRef.current) {
            studentBubbleRef.current.style.boxShadow = `${(-x * 12).toFixed(1)}px ${(
                20 - y * 8
            ).toFixed(1)}px 36px rgba(30, 42, 90, 0.16)`;
        }

        // 4. Call Controls: Subtle float
        if (callControlsRef.current) {
            callControlsRef.current.style.transform = `translate3d(calc(-50% + ${(
                x * 8
            ).toFixed(1)}px), ${(y * 8).toFixed(1)}px, 0)`;
        }

        // 5. Interactive Spotlight Glare
        if (glareRef.current) {
            glareRef.current.style.background = `radial-gradient(circle 320px at ${curr.glareX.toFixed(
                1
            )}% ${curr.glareY.toFixed(1)}%, rgba(255, 255, 255, 0.35), transparent 75%)`;
            glareRef.current.style.opacity = curr.glareAlpha.toFixed(3);
        }

        const isSettled =
            Math.abs(target.x - curr.x) < 0.005 &&
            Math.abs(target.y - curr.y) < 0.005 &&
            Math.abs(target.glareAlpha - curr.glareAlpha) < 0.005;

        if (!isSettled || isHoveredRef.current) {
            rafId.current = requestAnimationFrame(() => {
                updatePhysicsRef.current();
            });
        } else {
            // Clean snap to resting state
            if (tilesRef.current) {
                tilesRef.current.style.transform = 'none';
                tilesRef.current.style.boxShadow = '';
            }

            if (studentAvatarRef.current) {
                studentAvatarRef.current.style.transform = 'none';
            }

            if (teacherAvatarRef.current) {
                teacherAvatarRef.current.style.transform = 'none';
            }

            if (teacherBubbleRef.current) {
                teacherBubbleRef.current.style.boxShadow = '';
            }

            if (studentBubbleRef.current) {
                studentBubbleRef.current.style.boxShadow = '';
            }

            if (callControlsRef.current) {
                callControlsRef.current.style.transform = 'translateX(-50%)';
            }

            if (glareRef.current) {
                glareRef.current.style.opacity = '0';
            }

            rafId.current = null;
        }
    }, []);

    useEffect(() => {
        updatePhysicsRef.current = updatePhysics;
    }, [updatePhysics]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isTouchDeviceRef.current || prefersReducedMotionRef.current || !containerRef.current) {
            return;
        }

        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        targetCoords.current.x = (mouseX / rect.width - 0.5) * 2;
        targetCoords.current.y = (mouseY / rect.height - 0.5) * 2;
        targetCoords.current.glareX = (mouseX / rect.width) * 100;
        targetCoords.current.glareY = (mouseY / rect.height) * 100;
        targetCoords.current.glareAlpha = 0.14;

        if (!rafId.current) {
            rafId.current = requestAnimationFrame(() => {
                updatePhysicsRef.current();
            });
        }
    };

    const handleMouseEnter = () => {
        if (isTouchDeviceRef.current || prefersReducedMotionRef.current) {
            return;
        }

        isHoveredRef.current = true;

        if (!rafId.current) {
            rafId.current = requestAnimationFrame(() => {
                updatePhysicsRef.current();
            });
        }
    };

    const handleMouseLeave = () => {
        isHoveredRef.current = false;
        targetCoords.current.x = 0;
        targetCoords.current.y = 0;
        targetCoords.current.glareAlpha = 0;

        if (!rafId.current) {
            rafId.current = requestAnimationFrame(() => {
                updatePhysicsRef.current();
            });
        }
    };

    useEffect(() => {
        return () => {
            if (rafId.current) {
                cancelAnimationFrame(rafId.current);
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="naqsh group relative p-3 select-none"
            data-purpose="hero-illustration-3d"
        >
            {/* Spotlight Glare Layer */}
            <div
                ref={glareRef}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-30 rounded-3xl transition-opacity duration-200"
                style={{ opacity: 0 }}
            />

            {/* Live Lesson Pill Badge: 100% native vector font, ZERO transform on hover, perfectly crisp */}
            <div className="absolute top-[-14px] left-[10px] z-[40]">
                <div className="flex items-center gap-2 rounded-full border border-white/20 bg-[#1E2A5A] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[#1E2A5A]/25">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7BD98E] opacity-75"></span>
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#7BD98E]"></span>
                    </span>{' '}
                    <span>{liveLessonText}</span>
                </div>
            </div>

            {/* Dialogue Callout 1 (Teacher - Top Right: Dynamic 3D lighting shadow with zero text transform) */}
            <div
                ref={teacherBubbleRef}
                className="absolute top-[-6px] right-[-4px] z-[40] max-w-[230px] rounded-2xl border border-[#EAE4D2] bg-white p-3.5 text-[14.5px] font-semibold text-[#1E2A5A] shadow-xl md:p-4"
            >
                {teacherDialogueText}
                <small className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#5C6480]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#D9B437]" />
                    {teacherLabelText}
                </small>
            </div>

            {/* Dialogue Callout 2 (Student - Bottom Left: Dynamic 3D lighting shadow with zero text transform) */}
            <div
                ref={studentBubbleRef}
                className="absolute bottom-[-28px] left-[-10px] z-[40] max-w-[230px] rounded-2xl border border-[#EAE4D2] bg-white p-3.5 text-[14.5px] font-semibold text-[#1E2A5A] shadow-xl md:p-4"
            >
                {studentDialogueText}
                <small className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#5C6480]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#A9C6E8]" />
                    {studentCalloutLabelText}
                </small>
            </div>

            {/* Teacher & Student Video Tiles (Subtle 3D Perspective Tilt on the cards) */}
            <div
                ref={tilesRef}
                className="grid grid-cols-2 gap-4 transition-transform duration-75"
            >
                {/* Student Tile (Left) */}
                <div className="tile relative bg-gradient-to-br from-[#A9C6E8] to-[#C9DCF2] shadow-xl shadow-[#1E2A5A]/10">
                    <div className="pointer-events-none absolute inset-x-0 bottom-11 flex justify-center">
                        <img
                            ref={studentAvatarRef}
                            alt="Student portrait"
                            className="aspect-square w-[76%] max-w-[170px] rounded-full object-cover shadow-lg select-none"
                            loading="eager"
                            decoding="async"
                            src="/hero_avatar_1.jpg"
                        />
                    </div>
                    <span className="relative z-[2] rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-[#1E2A5A] shadow-sm">
                        {studentLabelText}
                    </span>
                </div>

                {/* Teacher Tile (Right, Vertical Stagger) */}
                <div className="tile relative translate-y-[26px] bg-gradient-to-br from-[#F7DE8B] to-[#FBEDBC] shadow-xl shadow-[#1E2A5A]/10">
                    <div className="pointer-events-none absolute inset-x-0 bottom-11 flex justify-center">
                        <img
                            ref={teacherAvatarRef}
                            alt="Teacher portrait"
                            className="aspect-square w-[76%] max-w-[170px] rounded-full object-cover shadow-lg select-none"
                            loading="eager"
                            decoding="async"
                            src="/hero_avatar_2.jpg"
                        />
                    </div>
                    <span className="relative z-[2] rounded-full bg-[#1E2A5A] px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                        {teacherLabelText}
                    </span>
                </div>
            </div>

            {/* Call Control Buttons (Floating Bottom Bar with Audio Waves) */}
            <div
                ref={callControlsRef}
                className="absolute bottom-[-36px] left-1/2 z-[40] flex -translate-x-1/2 items-center gap-3.5 transition-transform duration-75"
            >
                {/* Active Mic Button with Concentric 3D Speaking Pulse Rings */}
                <div
                    className="relative flex h-[44px] w-[44px] cursor-pointer items-center justify-center rounded-full border border-[#1E2A5A]/10 bg-white text-[#1E2A5A] shadow-xl shadow-[#1E2A5A]/20 transition-all hover:scale-110"
                    title="Live Audio Stream Active"
                >
                    {/* Concentric Audio Pulse Waves */}
                    <span className="pointer-events-none absolute inset-0 -z-10 animate-[audio-wave_2.5s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full bg-[#1E2A5A]/20" />
                    <span className="pointer-events-none absolute inset-0 -z-10 animate-[audio-wave_2.5s_cubic-bezier(0,0,0.2,1)_infinite_0.8s] rounded-full bg-[#1E2A5A]/15" />
                    <Mic className="h-5 w-5 fill-[#1E2A5A]" />
                </div>

                {/* Video Control */}
                <div
                    className="flex h-[44px] w-[44px] cursor-pointer items-center justify-center rounded-full border border-[#1E2A5A]/10 bg-white text-[#1E2A5A] shadow-xl shadow-[#1E2A5A]/20 transition-all hover:scale-110"
                    title="Camera Connected"
                >
                    <Video className="h-5 w-5 fill-[#1E2A5A]" />
                </div>

                {/* End Call / Action Control */}
                <div
                    className="flex h-[46px] w-[46px] cursor-pointer items-center justify-center rounded-full bg-[#E5484D] text-white shadow-xl shadow-[#E5484D]/30 transition-all hover:scale-110"
                    title="Disconnect Call"
                >
                    <PhoneOff className="h-5 w-5 fill-white" />
                </div>
            </div>
        </div>
    );
}
