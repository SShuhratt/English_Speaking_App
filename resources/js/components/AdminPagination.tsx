import React from 'react';
import { Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface AdminPaginationProps {
    links?: PaginationLink[];
    from?: number | null;
    to?: number | null;
    total: number;
    perPage: string | number;
    currentFilter?: string;
    filterParamName?: string;
    itemLabel?: string;
    className?: string;
}

export default function AdminPagination({
    links = [],
    from,
    to,
    total,
    perPage,
    currentFilter,
    filterParamName = 'status',
    itemLabel,
    className = '',
}: AdminPaginationProps) {
    const { t } = useTranslation();

    const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const nextPerPage = e.target.value;
        const currentParams = new URLSearchParams(window.location.search);
        
        currentParams.set('per_page', nextPerPage);
        currentParams.set('page', '1'); // always reset to page 1 on size change

        if (currentFilter) {
            currentParams.set(filterParamName, currentFilter);
        }

        router.get(
            `${window.location.pathname}?${currentParams.toString()}`,
            {},
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const renderLabel = (label: string) => {
        if (label.includes('Previous') || label.includes('&laquo;')) {
            return (
                <span className="flex items-center gap-1">
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">
                        {t('admin.pagination_previous')}
                    </span>
                </span>
            );
        }
        if (label.includes('Next') || label.includes('&raquo;')) {
            return (
                <span className="flex items-center gap-1">
                    <span className="hidden sm:inline">
                        {t('admin.pagination_next')}
                    </span>
                    <ChevronRight className="h-4 w-4" />
                </span>
            );
        }
        return label;
    };

    const hasMultiplePages = Boolean(links && links.length > 3);

    return (
        <div
            className={`flex flex-col items-center justify-between gap-4 border-t border-gray-200 px-4 py-4 text-xs sm:flex-row dark:border-gray-800 ${className}`}
        >
            {/* Range Summary */}
            <div className="flex flex-wrap items-center gap-2 text-gray-600 dark:text-gray-400">
                <span>
                    {t('admin.pagination_showing', {
                        from: String(from ?? (total > 0 ? 1 : 0)),
                        to: String(to ?? total),
                        total: String(total),
                    })}
                </span>
                {itemLabel && <span className="font-medium">{itemLabel}</span>}
            </div>

            {/* Per-Page & Page Controls */}
            <div className="flex flex-wrap items-center gap-4">
                {/* Per-Page Selector */}
                <div className="flex items-center gap-2">
                    <label
                        htmlFor="admin-per-page-select"
                        className="text-gray-500 dark:text-gray-400"
                    >
                        {t('admin.pagination_per_page')}:
                    </label>
                    <select
                        id="admin-per-page-select"
                        value={String(perPage)}
                        onChange={handlePerPageChange}
                        className="h-8 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 shadow-xs focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    >
                        <option value="15">15</option>
                        <option value="30">30</option>
                        <option value="50">50</option>
                        <option value="all">{t('admin.pagination_all')}</option>
                    </select>
                </div>

                {/* Page Navigation Links */}
                {hasMultiplePages && (
                    <nav
                        className="flex items-center gap-1"
                        aria-label="Pagination"
                    >
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
                                        className={`inline-flex h-8 items-center justify-center rounded-lg px-2.5 font-semibold text-gray-400 select-none dark:text-gray-600 ${
                                            isPrevNext
                                                ? 'border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900'
                                                : ''
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
                                    className={`inline-flex h-8 items-center justify-center rounded-lg px-2.5 font-bold transition-all ${
                                        link.active
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'border border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {renderLabel(link.label)}
                                </Link>
                            );
                        })}
                    </nav>
                )}
            </div>
        </div>
    );
}
