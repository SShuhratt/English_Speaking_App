import React, { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    ShieldCheck,
    Sparkles,
    Filter,
    ArrowUpDown,
    ArrowDown,
    ArrowUp,
    Search,
    X,
} from 'lucide-react';

export interface FilterState {
    status?: string;
    ielts_sort?: string | null;
    price_sort?: string | null;
    search?: string | null;
}

interface TeacherFilterBarProps {
    baseUrl: string;
    currentFilters?: FilterState;
    showUnverified?: boolean;
}

export default function TeacherFilterBar({
    baseUrl,
    currentFilters = {},
    showUnverified = false,
}: TeacherFilterBarProps) {
    const { t } = useTranslation();

    const status = currentFilters.status || 'all';
    const ieltsSort = currentFilters.ielts_sort || null;
    const priceSort = currentFilters.price_sort || null;
    const initialSearch = currentFilters.search || '';

    const [searchValue, setSearchValue] = useState(initialSearch);
    const isFirstRender = useRef(true);

    // Sync search input with URL params if changed externally
    useEffect(() => {
        setSearchValue(currentFilters.search || '');
    }, [currentFilters.search]);

    const applyFilters = (updates: Partial<FilterState>) => {
        const nextStatus =
            updates.status !== undefined ? updates.status : status;
        const nextIelts =
            updates.ielts_sort !== undefined ? updates.ielts_sort : ieltsSort;
        const nextPrice =
            updates.price_sort !== undefined ? updates.price_sort : priceSort;
        const nextSearch =
            updates.search !== undefined
                ? updates.search
                : (searchValue.trim() || null);

        const params: Record<string, string> = {};
        if (nextStatus && nextStatus !== 'all') {
            params.status = nextStatus;
        }
        if (nextIelts) {
            params.ielts_sort = nextIelts;
        }
        if (nextPrice) {
            params.price_sort = nextPrice;
        }
        if (nextSearch) {
            params.search = nextSearch;
        }

        router.get(baseUrl, params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Debounced search on typing
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const handler = setTimeout(() => {
            const trimmed = searchValue.trim();
            const currentSearchTrimmed = (currentFilters.search || '').trim();

            if (trimmed !== currentSearchTrimmed) {
                applyFilters({ search: trimmed || null });
            }
        }, 350);

        return () => clearTimeout(handler);
    }, [searchValue]);

    const handleClearSearch = () => {
        setSearchValue('');
        applyFilters({ search: null });
    };

    const isAnyActive =
        status !== 'all' ||
        Boolean(ieltsSort) ||
        Boolean(priceSort) ||
        Boolean(searchValue.trim());

    return (
        <div className="space-y-4 border-b border-[#EAE4D2] pb-5">
            {/* Top Row: Search Bar & Summary */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Search Bar Input */}
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C6480]" />
                    <Input
                        type="text"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        placeholder="Search teacher by name..."
                        className="h-10 w-full rounded-full border-[#EAE4D2] bg-white pl-10 pr-9 text-sm text-[#1E2A5A] shadow-2xs transition-all placeholder:text-[#5C6480]/60 focus-visible:border-[#1E2A5A] focus-visible:ring-1 focus-visible:ring-[#1E2A5A]"
                    />
                    {searchValue && (
                        <button
                            type="button"
                            onClick={handleClearSearch}
                            className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
                            aria-label="Clear search"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {/* Filter Label & Clear Button */}
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#5C6480]">
                        <Filter className="h-3.5 w-3.5 text-[#1E2A5A]" />
                        <span>Filter & Sort:</span>
                    </div>

                    {isAnyActive && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                                setSearchValue('');
                                applyFilters({
                                    status: 'all',
                                    ielts_sort: null,
                                    price_sort: null,
                                    search: null,
                                });
                            }}
                            className="h-8 cursor-pointer px-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        >
                            <X className="mr-1 h-3.5 w-3.5" />
                            Clear All
                        </Button>
                    )}
                </div>
            </div>

            {/* Bottom Row: Filter Badges & Sort Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
                {/* 1. Status Filter Buttons */}
                <Button
                    size="sm"
                    variant={status === 'all' ? 'default' : 'outline'}
                    onClick={() => applyFilters({ status: 'all' })}
                    className={`h-8 rounded-full text-xs font-bold ${
                        status === 'all'
                            ? 'bg-[#1E2A5A] text-white hover:bg-[#1E2A5A]/90'
                            : 'border-[#EAE4D2] bg-white text-[#1E2A5A] hover:bg-[#FDF7E4]'
                    }`}
                >
                    All Teachers
                </Button>

                <Button
                    size="sm"
                    variant={status === 'verified' ? 'default' : 'outline'}
                    onClick={() => applyFilters({ status: 'verified' })}
                    className={`h-8 rounded-full text-xs font-bold ${
                        status === 'verified'
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'border-[#EAE4D2] bg-white text-[#1E2A5A] hover:bg-[#FDF7E4]'
                    }`}
                >
                    <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                    Verified
                </Button>

                <Button
                    size="sm"
                    variant={status === 'new' ? 'default' : 'outline'}
                    onClick={() => applyFilters({ status: 'new' })}
                    className={`h-8 rounded-full text-xs font-bold ${
                        status === 'new'
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'border-[#EAE4D2] bg-white text-[#1E2A5A] hover:bg-[#FDF7E4]'
                    }`}
                >
                    <Sparkles className="mr-1 h-3.5 w-3.5" />
                    New (7 Days)
                </Button>

                {showUnverified && (
                    <Button
                        size="sm"
                        variant={
                            status === 'unverified' ? 'default' : 'outline'
                        }
                        onClick={() => applyFilters({ status: 'unverified' })}
                        className={`h-8 rounded-full text-xs font-bold ${
                            status === 'unverified'
                                ? 'bg-[#1E2A5A] text-white'
                                : 'border-[#EAE4D2] bg-white text-[#1E2A5A] hover:bg-[#FDF7E4]'
                        }`}
                    >
                        Unverified
                    </Button>
                )}

                <div className="hidden h-5 w-px bg-[#EAE4D2] sm:block" />

                {/* 2. IELTS Band Filter Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            size="sm"
                            variant={ieltsSort ? 'default' : 'outline'}
                            className={`h-8 rounded-full text-xs font-bold transition-all ${
                                ieltsSort
                                    ? 'bg-amber-600 text-white shadow-2xs hover:bg-amber-700'
                                    : 'border-[#EAE4D2] bg-white text-[#1E2A5A] hover:bg-[#FDF7E4]'
                            }`}
                        >
                            {ieltsSort === 'asc' ? (
                                <ArrowDown className="mr-1 h-3.5 w-3.5 stroke-[2.5]" />
                            ) : ieltsSort === 'desc' ? (
                                <ArrowUp className="mr-1 h-3.5 w-3.5 stroke-[2.5]" />
                            ) : (
                                <ArrowUpDown className="mr-1 h-3.5 w-3.5 text-amber-600" />
                            )}
                            <span>
                                {ieltsSort === 'asc'
                                    ? 'IELTS: Low to High'
                                    : ieltsSort === 'desc'
                                      ? 'IELTS: High to Low'
                                      : 'IELTS Band'}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-52 rounded-2xl border border-[#EAE4D2] bg-white p-1.5 shadow-xl"
                    >
                        <DropdownMenuItem
                            onClick={() => applyFilters({ ielts_sort: 'asc' })}
                            className={`flex cursor-pointer items-center gap-2 rounded-xl py-2 text-xs font-bold ${
                                ieltsSort === 'asc'
                                    ? 'bg-amber-50 text-amber-900'
                                    : ''
                            }`}
                        >
                            <ArrowDown className="h-3.5 w-3.5 text-amber-600" />
                            <span>Band: Low to High</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => applyFilters({ ielts_sort: 'desc' })}
                            className={`flex cursor-pointer items-center gap-2 rounded-xl py-2 text-xs font-bold ${
                                ieltsSort === 'desc'
                                    ? 'bg-amber-50 text-amber-900'
                                    : ''
                            }`}
                        >
                            <ArrowUp className="h-3.5 w-3.5 text-amber-600" />
                            <span>Band: High to Low</span>
                        </DropdownMenuItem>
                        {ieltsSort && (
                            <DropdownMenuItem
                                onClick={() =>
                                    applyFilters({ ielts_sort: null })
                                }
                                className="mt-1 flex cursor-pointer items-center gap-2 rounded-xl border-t border-slate-100 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                            >
                                <X className="h-3.5 w-3.5" />
                                <span>Reset IELTS Sort</span>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* 3. Price Filter Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            size="sm"
                            variant={priceSort ? 'default' : 'outline'}
                            className={`h-8 rounded-full text-xs font-bold transition-all ${
                                priceSort
                                    ? 'bg-purple-600 text-white shadow-2xs hover:bg-purple-700'
                                    : 'border-[#EAE4D2] bg-white text-[#1E2A5A] hover:bg-[#FDF7E4]'
                            }`}
                        >
                            {priceSort === 'asc' ? (
                                <ArrowDown className="mr-1 h-3.5 w-3.5 stroke-[2.5]" />
                            ) : priceSort === 'desc' ? (
                                <ArrowUp className="mr-1 h-3.5 w-3.5 stroke-[2.5]" />
                            ) : (
                                <ArrowUpDown className="mr-1 h-3.5 w-3.5 text-purple-600" />
                            )}
                            <span>
                                {priceSort === 'asc'
                                    ? 'Price: Low to High'
                                    : priceSort === 'desc'
                                      ? 'Price: High to Low'
                                      : 'Price'}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-52 rounded-2xl border border-[#EAE4D2] bg-white p-1.5 shadow-xl"
                    >
                        <DropdownMenuItem
                            onClick={() => applyFilters({ price_sort: 'asc' })}
                            className={`flex cursor-pointer items-center gap-2 rounded-xl py-2 text-xs font-bold ${
                                priceSort === 'asc'
                                    ? 'bg-purple-50 text-purple-900'
                                    : ''
                            }`}
                        >
                            <ArrowDown className="h-3.5 w-3.5 text-purple-600" />
                            <span>Price: Low to High</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => applyFilters({ price_sort: 'desc' })}
                            className={`flex cursor-pointer items-center gap-2 rounded-xl py-2 text-xs font-bold ${
                                priceSort === 'desc'
                                    ? 'bg-purple-50 text-purple-900'
                                    : ''
                            }`}
                        >
                            <ArrowUp className="h-3.5 w-3.5 text-purple-600" />
                            <span>Price: High to Low</span>
                        </DropdownMenuItem>
                        {priceSort && (
                            <DropdownMenuItem
                                onClick={() =>
                                    applyFilters({ price_sort: null })
                                }
                                className="mt-1 flex cursor-pointer items-center gap-2 rounded-xl border-t border-slate-100 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                            >
                                <X className="h-3.5 w-3.5" />
                                <span>Reset Price Sort</span>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
