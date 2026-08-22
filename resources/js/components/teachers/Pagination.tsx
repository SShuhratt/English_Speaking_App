import React from 'react';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationProps {
    links: PaginationLink[];
    from?: number | null;
    to?: number | null;
    total?: number;
    className?: string;
}

export default function Pagination({
    links,
    from,
    to,
    total,
    className = '',
}: PaginationProps) {
    if (!links || links.length <= 3) {
        return null;
    }

    const renderLabel = (label: string) => {
        if (label.includes('Previous') || label.includes('&laquo;')) {
            return (
                <span className="flex items-center gap-1">
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous</span>
                </span>
            );
        }
        if (label.includes('Next') || label.includes('&raquo;')) {
            return (
                <span className="flex items-center gap-1">
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                </span>
            );
        }
        return label;
    };

    return (
        <div
            className={`flex flex-col items-center justify-between gap-4 border-t border-[#EAE4D2] pt-6 sm:flex-row ${className}`}
        >
            {/* Range summary */}
            {typeof from === 'number' && typeof to === 'number' && typeof total === 'number' && (
                <p className="text-xs font-semibold text-[#5C6480]">
                    Showing <span className="font-bold text-[#1E2A5A]">{from}</span> to{' '}
                    <span className="font-bold text-[#1E2A5A]">{to}</span> of{' '}
                    <span className="font-bold text-[#1E2A5A]">{total}</span> teachers
                </p>
            )}

            {/* Page Buttons */}
            <nav className="flex items-center gap-1.5" aria-label="Pagination">
                {links.map((link, idx) => {
                    const isPrevNext =
                        link.label.includes('Previous') ||
                        link.label.includes('Next') ||
                        link.label.includes('&laquo;') ||
                        link.label.includes('&raquo;');

                    if (!link.url) {
                        return (
                            <span
                                key={idx}
                                className={`inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-xs font-semibold text-muted-foreground/40 select-none ${
                                    isPrevNext ? 'border border-border/40 bg-slate-50/50' : ''
                                }`}
                            >
                                {renderLabel(link.label)}
                            </span>
                        );
                    }

                    return (
                        <Link
                            key={idx}
                            href={link.url}
                            preserveScroll
                            preserveState
                            className={`inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                link.active
                                    ? 'bg-[#1E2A5A] text-white shadow-xs'
                                    : 'border border-[#EAE4D2] bg-white text-[#1E2A5A] hover:bg-[#FDF7E4] hover:border-[#1E2A5A]/30'
                            }`}
                        >
                            {renderLabel(link.label)}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
