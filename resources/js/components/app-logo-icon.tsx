import React from 'react';
import { cn } from '@/lib/utils';
import convomateLogo from '../../images/logo-nz.png';
import convomateRays from '../../images/logo-nz-rays.png';

interface AppLogoIconProps extends React.HTMLAttributes<HTMLDivElement> {}

export default function AppLogoIcon({ className, ...props }: AppLogoIconProps) {
    return (
        <div
            className={cn(
                'relative flex aspect-square shrink-0 items-center justify-center',
                className,
            )}
            {...props}
        >
            <img
                src={convomateRays}
                alt=""
                aria-hidden="true"
                className="pointer-events-none h-full w-full object-contain select-none"
            />
            <img
                src={convomateLogo}
                alt="ConvoMate Logo"
                className="absolute left-1/2 top-1/2 h-[64%] w-[64%] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-sm"
            />
        </div>
    );
}
