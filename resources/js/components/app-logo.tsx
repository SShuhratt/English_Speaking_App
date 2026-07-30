import React from 'react';
import { useSidebar } from '@/components/ui/sidebar';

export default function AppLogo() {
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';

    return (
        <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'justify-center w-full' : ''}`}>
            {/* Circle logo frame using the premium brand logo */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-brand-navy/10 bg-white shadow-md shadow-brand-navy/10 transition-transform hover:scale-105 p-1">
                <img
                    src="/images/logo.png"
                    alt="ConvoMate"
                    className="h-full w-full object-contain"
                />
            </div>
            {!isCollapsed && (
                <span className="ml-2 text-base font-black tracking-tight text-white whitespace-nowrap">
                    Convo<span className="text-amber-400">Mate</span>
                </span>
            )}
        </div>
    );
}
