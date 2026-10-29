import React from 'react';
import { useOptionalSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import convomateLogo from '../../images/logo.png';

export interface AppLogoProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'auto' | 'white' | 'navy';
    animate?: boolean;
}

const sizeConfig = {
    sm: {
        text: 'text-base sm:text-lg',
        icon: 'h-5 w-5 sm:h-6 sm:w-6',
        margin: 'mx-0',
    },
    md: {
        text: 'text-xl sm:text-2xl',
        icon: 'h-7 w-7 sm:h-8 sm:w-8',
        margin: 'mx-0 sm:mx-0.5',
    },
    lg: {
        text: 'text-2xl sm:text-3xl',
        icon: 'h-8 w-8 sm:h-9 sm:w-9',
        margin: 'mx-0.5',
    },
    xl: {
        text: 'text-3xl sm:text-4xl',
        icon: 'h-10 w-10 sm:h-11 sm:w-11',
        margin: 'mx-0.5 sm:mx-1',
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
                <div className="flex h-9 w-9 items-center justify-center">
                    <img
                        src={convomateLogo}
                        alt="ConvoMate"
                        className={cn(
                            'h-8 w-8 object-contain drop-shadow-sm',
                            animate && 'animate-spin-y',
                        )}
                        style={{ imageRendering: 'high-quality' }}
                    />
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

            {/* 2nd 'O' letter replaced by the authentic high-resolution headphone chat bubble badge */}
            <span
                className={cn(
                    'inline-flex items-center justify-center [perspective:800px] shrink-0 z-10',
                    currentSize.margin,
                )}
                aria-label="O"
            >
                <img
                    src={convomateLogo}
                    alt="O"
                    className={cn(
                        'object-contain select-none pointer-events-none drop-shadow-xs',
                        currentSize.icon,
                        animate && 'animate-spin-y',
                    )}
                    style={{ imageRendering: 'high-quality' }}
                />
            </span>

            <span className="uppercase text-[#F5A623] transition-colors drop-shadow-xs">
                MATE
            </span>
        </div>
    );
}
