import React, { useRef, useEffect, useCallback } from 'react';

export interface TiltCard3DProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    /** Maximum tilt angle in degrees (default: 8) */
    maxTilt?: number;
    /** 3D Perspective distance in pixels (default: 1000) */
    perspective?: number;
    /** Scale factor on hover (default: 1.02) */
    scale?: number;
    /** Whether to show a dynamic cursor spotlight / glare highlight (default: true) */
    glare?: boolean;
    /** Maximum opacity of the spotlight glare (default: 0.14) */
    glareOpacity?: number;
    /** Glare highlight color (default: 'rgba(255, 255, 255, 0.45)') */
    glareColor?: string;
    /** Enable CSS transform-style: preserve-3d so child elements can use translateZ (default: false) */
    preserve3D?: boolean;
    /** Whether to preserve 100% native vector font clarity with dynamic 3D lighting shadow and spotlight glare (default: true) */
    textSafe?: boolean;
    /** Apply a gentle 3D ambient floating oscillation for idle or mobile states (default: false) */
    ambientFloat?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

export function TiltCard3D({
    children,
    maxTilt = 8,
    perspective = 1000,
    scale = 1,
    glare = true,
    glareOpacity = 0.14,
    glareColor = 'rgba(255, 255, 255, 0.45)',
    preserve3D = false,
    textSafe = true,
    ambientFloat = false,
    className = '',
    style,
    ...rest
}: TiltCard3DProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const isHoveredRef = useRef(false);
    const isTouchDeviceRef = useRef(false);
    const prefersReducedMotionRef = useRef(false);

    // Current interpolated transformation values
    const currentTransform = useRef({
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        glareX: 50,
        glareY: 50,
        glareAlpha: 0,
    });

    // Target transformation values
    const targetTransform = useRef({
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        glareX: 50,
        glareY: 50,
        glareAlpha: 0,
    });

    const rafId = useRef<number | null>(null);
    const updatePhysicsRef = useRef<() => void>(() => {});

    // Detect touch capability and reduced motion preferences on mount
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

    // Physics animation loop using requestAnimationFrame for smooth 60-120fps interpolation
    const updatePhysics = useCallback(() => {
        if (!cardRef.current || prefersReducedMotionRef.current) {
            return;
        }

        const curr = currentTransform.current;
        const target = targetTransform.current;

        // Smooth spring lerp factor
        const ease = 0.14;

        curr.rotateX += (target.rotateX - curr.rotateX) * ease;
        curr.rotateY += (target.rotateY - curr.rotateY) * ease;
        curr.scale += (target.scale - curr.scale) * ease;
        curr.glareX += (target.glareX - curr.glareX) * ease;
        curr.glareY += (target.glareY - curr.glareY) * ease;
        curr.glareAlpha += (target.glareAlpha - curr.glareAlpha) * ease;

        const card = cardRef.current;

        if (textSafe) {
            // Zero-blur 3D lighting elevation: Dynamic reactive shadow + tactile lift
            // Text remains 100% native vector antialiased with ZERO blur
            const shadowX = (-curr.rotateY * 1.5).toFixed(1);
            const shadowY = (16 + curr.rotateX * 1.2).toFixed(1);
            const shadowBlur = (28 + curr.glareAlpha * 35).toFixed(1);
            card.style.boxShadow = `${shadowX}px ${shadowY}px ${shadowBlur}px rgba(30, 42, 90, 0.12), 0 2px 8px rgba(30, 42, 90, 0.04)`;
            card.style.transform = isHoveredRef.current ? 'translateY(-3px)' : 'none';
        } else {
            const transformStr = `perspective(${perspective}px) rotateX(${curr.rotateX.toFixed(
                2
            )}deg) rotateY(${curr.rotateY.toFixed(2)}deg) scale3d(${curr.scale.toFixed(
                3
            )}, ${curr.scale.toFixed(3)}, 1)`;
            card.style.transform = transformStr;
        }

        const glareEl = card.querySelector<HTMLDivElement>('[data-card-glare]');

        if (glareEl && glare) {
            glareEl.style.background = `radial-gradient(circle 280px at ${curr.glareX.toFixed(
                1
            )}% ${curr.glareY.toFixed(1)}%, ${glareColor}, transparent 80%)`;
            glareEl.style.opacity = curr.glareAlpha.toFixed(3);
        }

        // Check if values have settled back to resting state
        const isSettled =
            Math.abs(target.rotateX - curr.rotateX) < 0.02 &&
            Math.abs(target.rotateY - curr.rotateY) < 0.02 &&
            Math.abs(target.scale - curr.scale) < 0.002 &&
            Math.abs(target.glareAlpha - curr.glareAlpha) < 0.005;

        if (!isSettled || isHoveredRef.current) {
            if (!textSafe) {
                card.style.willChange = 'transform';
                card.style.transformStyle = preserve3D ? 'preserve-3d' : 'flat';
            }

            rafId.current = requestAnimationFrame(() => {
                updatePhysicsRef.current();
            });
        } else {
            // Clean snap to resting state and release compositor layer to keep text/images pin-sharp
            card.style.transform = 'none';
            card.style.boxShadow = '';
            card.style.transformStyle = 'flat';
            card.style.willChange = 'auto';

            if (glareEl) {
                glareEl.style.opacity = '0';
            }

            rafId.current = null;
        }
    }, [perspective, glare, glareColor, textSafe, preserve3D]);

    useEffect(() => {
        updatePhysicsRef.current = updatePhysics;
    }, [updatePhysics]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isTouchDeviceRef.current || prefersReducedMotionRef.current || !cardRef.current) {
            return;
        }

        const rect = cardRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Normalized offset from -1 to 1
        const normX = (mouseX / rect.width - 0.5) * 2;
        const normY = (mouseY / rect.height - 0.5) * 2;

        targetTransform.current.rotateX = -normY * maxTilt;
        targetTransform.current.rotateY = normX * maxTilt;
        targetTransform.current.scale = scale;
        targetTransform.current.glareX = (mouseX / rect.width) * 100;
        targetTransform.current.glareY = (mouseY / rect.height) * 100;
        targetTransform.current.glareAlpha = glareOpacity;

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
        targetTransform.current.scale = scale;

        if (!rafId.current) {
            rafId.current = requestAnimationFrame(() => {
                updatePhysicsRef.current();
            });
        }
    };

    const handleMouseLeave = () => {
        isHoveredRef.current = false;
        targetTransform.current.rotateX = 0;
        targetTransform.current.rotateY = 0;
        targetTransform.current.scale = 1;
        targetTransform.current.glareAlpha = 0;

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

    const dynamicStyle: React.CSSProperties = {
        transformStyle: 'flat',
        willChange: 'auto',
        backfaceVisibility: 'hidden',
        WebkitFontSmoothing: 'subpixel-antialiased',
        ...style,
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`relative transition-shadow duration-300 ${
                ambientFloat ? 'animate-[float-3d_6s_ease-in-out_infinite]' : ''
            } ${className}`}
            style={dynamicStyle}
            {...rest}
        >
            {/* Interactive Spotlight / Glare Layer */}
            {glare && (
                <div
                    data-card-glare
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] transition-opacity duration-200"
                    style={{
                        opacity: 0,
                    }}
                />
            )}
            {children}
        </div>
    );
}

/**
 * DepthLayer: Helper component that positions child elements along the 3D Z-axis
 * within a parent TiltCard3D or preserve-3d container.
 */
export function DepthLayer({
    children,
    className = '',
    style,
    ...rest
}: {
    /** Elevation level in pixels (legacy parameter) */
    z?: number;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
} & React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`relative ${className}`}
            style={style}
            {...rest}
        >
            {children}
        </div>
    );
}
