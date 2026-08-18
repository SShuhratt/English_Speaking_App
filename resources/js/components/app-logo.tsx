import React from 'react';
import { useSidebar } from '@/components/ui/sidebar';

export default function AppLogo() {
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';

    return (
        <div
            className={`flex items-center transition-all duration-300 ${isCollapsed ? 'w-full justify-center' : ''}`}
        >
            {/* Circle logo frame using the premium brand logo */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-brand-navy/10 bg-white p-1 shadow-md shadow-brand-navy/10 transition-transform hover:scale-105">
                <img
                    src="/images/logo.png"
                    alt="ConvoMate"
                    className="h-full w-full object-contain"
                />
            </div>
            {!isCollapsed && (
                <span className="ml-2 text-base font-black tracking-tight whitespace-nowrap text-white">
                    Convo<span className="text-amber-400">Mate</span>
                </span>
            )}
        </div>
    );
}
