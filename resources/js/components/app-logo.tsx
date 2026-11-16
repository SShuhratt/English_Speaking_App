import React from 'react';
import { useOptionalSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import convomateLogo from '../../images/logo-nz.png';
import convomateRays from '../../images/logo-nz-rays.png';

export interface AppLogoProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'auto' | 'white' | 'navy';
    animate?: boolean;
}

const sizeConfig = {
    sm: {
        text: 'text-base sm:text-lg',
        icon: 'h-6 w-6 sm:h-7 sm:w-7',
        margin: 'mx-1.5 sm:mx-2',
    },
    md: {
        text: 'text-xl sm:text-2xl',
        icon: 'h-8 w-8 sm:h-9 sm:w-9',
        margin: 'mx-2 sm:mx-2.5',
    },
    lg: {
        text: 'text-2xl sm:text-3xl',
        icon: 'h-9 w-9 sm:h-11 sm:w-11',
        margin: 'mx-2.5 sm:mx-3',
    },
    xl: {
        text: 'text-3xl sm:text-4xl',
        icon: 'h-11 w-11 sm:h-13 sm:w-13',
        margin: 'mx-3 sm:mx-3.5',
    },
};

export default function AppLogo({
    size = 'md',
    variant = 'auto',
    animate = true,
    className,
    ...props
}: AppLogoProps) {
    const sidebar = useOptionalSidebar();
    const isCollapsed = sidebar?.state === 'collapsed';

    // When collapsed in sidebar (icon-only mode), render only the rotating brand icon
    if (isCollapsed) {
        return (
            <div
                className={cn(
                    'flex w-full items-center justify-center [perspective:800px] py-1',
                    className,
                )}
                {...props}
            >
                <div className="relative flex h-7 w-7 items-center justify-center">
                    <img
                        src={convomateRays}
                        alt=""
                        aria-hidden="true"
                        className="pointer-events-none absolute left-1/2 top-1/2 h-[156%] w-[156%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain select-none"
                    />
                    <span className="relative inline-flex h-full w-full items-center justify-center [perspective:800px]">
                        <img
                            src={convomateLogo}
                            alt="ConvoMate"
                            className={cn(
                                'h-full w-full object-contain drop-shadow-sm',
                                animate && 'animate-spin-y',
                            )}
                        />
                    </span>
                </div>
            </div>
        );
    }

    const currentSize = sizeConfig[size] || sizeConfig.md;

    const convColor =
        variant === 'white'
            ? 'text-white'
            : variant === 'navy'
              ? 'text-[#061445]'
              : 'text-[#061445] dark:text-white';

    return (
        <div
            className={cn(
                "inline-flex items-center font-['Bricolage_Grotesque',sans-serif] font-black tracking-tight select-none leading-none",
                currentSize.text,
                className,
            )}
            {...props}
        >
            <span className={cn('uppercase transition-colors', convColor)}>
                CONV
            </span>

            {/* 2nd 'O' letter replaced by spinning bulb inside constant spreading rays */}
            <span
                className={cn(
                    'relative inline-flex items-center justify-center shrink-0 z-10',
                    currentSize.icon,
                    currentSize.margin,
                )}
                aria-label="O"
            >
                <img
                    src={convomateRays}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-1/2 h-[156%] w-[156%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain select-none"
                />
                <span className="relative inline-flex h-full w-full items-center justify-center [perspective:800px]">
                    <img
                        src={convomateLogo}
                        alt="O"
                        className={cn(
                            'h-full w-full object-contain select-none pointer-events-none drop-shadow-xs',
                            animate && 'animate-spin-y',
                        )}
                    />
                </span>
            </span>

            <span className="uppercase text-[#F5A623] transition-colors drop-shadow-xs">
                MATE
            </span>
        </div>
    );
}
