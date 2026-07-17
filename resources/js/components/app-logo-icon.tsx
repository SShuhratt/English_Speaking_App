import React from 'react';
import { cn } from '@/lib/utils';

interface AppLogoIconProps extends React.HTMLAttributes<HTMLDivElement> {}

export default function AppLogoIcon({ className, ...props }: AppLogoIconProps) {
    return (
        <div
            className={cn(
                "flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-brand-navy/10 bg-white shadow-md shadow-brand-navy/10 aspect-square p-1",
                className
            )}
            {...props}
        >
            <img
                src="/images/logo.png"
                alt="ConvoMate Logo"
                className="h-full w-full object-contain"
            />
        </div>
    );
}
