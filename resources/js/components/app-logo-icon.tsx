import React from 'react';
import { cn } from '@/lib/utils';
import convomateLogo from '../../images/logo-nz.png';

interface AppLogoIconProps extends React.HTMLAttributes<HTMLDivElement> {}

export default function AppLogoIcon({ className, ...props }: AppLogoIconProps) {
    return (
        <div
            className={cn(
                'flex aspect-square shrink-0 items-center justify-center',
                className,
            )}
            {...props}
        >
            <img
                src={convomateLogo}
                alt="ConvoMate Logo"
                className="h-full w-full object-contain drop-shadow-sm"
            />
        </div>
    );
}
