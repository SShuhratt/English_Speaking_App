import React from 'react';
import { router } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ShieldCheck, Sparkles, Filter, ArrowUpDown, ArrowDown, ArrowUp, X } from 'lucide-react';

export interface FilterState {
    status?: string;
    ielts_sort?: string | null;
    price_sort?: string | null;
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

    const applyFilters = (updates: Partial<FilterState>) => {
        const nextStatus = updates.status !== undefined ? updates.status : status;
        const nextIelts = updates.ielts_sort !== undefined ? updates.ielts_sort : ieltsSort;
        const nextPrice = updates.price_sort !== undefined ? updates.price_sort : priceSort;

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

        router.get(baseUrl, params, { preserveState: true, preserveScroll: true });
    };

    const isAnyActive = status !== 'all' || Boolean(ieltsSort) || Boolean(priceSort);

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#1E2A5A]">
                <Filter className="h-4 w-4 text-indigo-600" />
                <span>{t('teachers.filter_and_sort') || 'Filter & Sort:'}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
                {/* 1. Status Filter Buttons */}
                <Button
                    size="sm"
                    variant={status === 'all' ? 'default' : 'outline'}
                    onClick={() => applyFilters({ status: 'all' })}
                    className={status === 'all' ? 'bg-[#1E2A5A] text-white font-bold' : ''}
                >
                    {t('teachers_directory.filter_all') || 'All Teachers'}
                </Button>

                <Button
                    size="sm"
                    variant={status === 'verified' ? 'default' : 'outline'}
                    onClick={() => applyFilters({ status: 'verified' })}
                    className={status === 'verified' ? 'bg-emerald-600 text-white font-bold' : ''}
                >
                    <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                    {t('teachers_directory.filter_verified') || 'Verified'}
                </Button>

                <Button
                    size="sm"
                    variant={status === 'new' ? 'default' : 'outline'}
                    onClick={() => applyFilters({ status: 'new' })}
                    className={status === 'new' ? 'bg-blue-600 text-white font-bold' : ''}
                >
                    <Sparkles className="mr-1 h-3.5 w-3.5" />
                    {t('teachers_directory.filter_new') || 'New (7 Days)'}
                </Button>

                {showUnverified && (
                    <Button
                        size="sm"
                        variant={status === 'unverified' ? 'default' : 'outline'}
                        onClick={() => applyFilters({ status: 'unverified' })}
                        className={status === 'unverified' ? 'bg-[#1E2A5A] text-white font-bold' : ''}
                    >
                        Unverified
                    </Button>
                )}

                {/* 2. Single IELTS Band Filter Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            size="sm"
                            variant={ieltsSort ? 'default' : 'outline'}
                            className={`font-semibold transition-all ${
                                ieltsSort
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm'
                                    : 'border-indigo-200 text-indigo-900 hover:bg-indigo-50'
                            }`}
                        >
                            {ieltsSort === 'asc' ? (
                                <ArrowDown className="mr-1.5 h-3.5 w-3.5 stroke-[2.5]" />
                            ) : ieltsSort === 'desc' ? (
                                <ArrowUp className="mr-1.5 h-3.5 w-3.5 stroke-[2.5]" />
                            ) : (
                                <ArrowUpDown className="mr-1.5 h-3.5 w-3.5 text-amber-600" />
                            )}
                            <span>
                                {ieltsSort === 'asc'
                                    ? t('teachers_directory.filter_ielts_asc') || 'IELTS Band (Low to High)'
                                    : ieltsSort === 'desc'
                                      ? t('teachers_directory.filter_ielts_desc') || 'IELTS Band (High to Low)'
                                      : t('teachers.ielts_band') || 'IELTS Band'}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 p-1.5 bg-white rounded-xl shadow-lg border">
                        <DropdownMenuItem
                            onClick={() => applyFilters({ ielts_sort: 'asc' })}
                            className={`flex items-center gap-2 cursor-pointer font-medium rounded-lg py-2 ${
                                ieltsSort === 'asc' ? 'bg-amber-50 text-amber-900 font-bold' : ''
                            }`}
                        >
                            <ArrowDown className="h-4 w-4 text-amber-600" />
                            <span>{t('teachers_directory.filter_ielts_asc') || 'Low to High'}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => applyFilters({ ielts_sort: 'desc' })}
                            className={`flex items-center gap-2 cursor-pointer font-medium rounded-lg py-2 ${
                                ieltsSort === 'desc' ? 'bg-amber-50 text-amber-900 font-bold' : ''
                            }`}
                        >
                            <ArrowUp className="h-4 w-4 text-amber-600" />
                            <span>{t('teachers_directory.filter_ielts_desc') || 'High to Low'}</span>
                        </DropdownMenuItem>
                        {ieltsSort && (
                            <DropdownMenuItem
                                onClick={() => applyFilters({ ielts_sort: null })}
                                className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground rounded-lg py-2 border-t mt-1"
                            >
                                <X className="h-3.5 w-3.5" />
                                <span>Clear IELTS Sort</span>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* 3. Single Price Filter Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            size="sm"
                            variant={priceSort ? 'default' : 'outline'}
                            className={`font-semibold transition-all ${
                                priceSort
                                    ? 'bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-sm'
                                    : 'border-indigo-200 text-indigo-900 hover:bg-indigo-50'
                            }`}
                        >
                            {priceSort === 'asc' ? (
                                <ArrowDown className="mr-1.5 h-3.5 w-3.5 stroke-[2.5]" />
                            ) : priceSort === 'desc' ? (
                                <ArrowUp className="mr-1.5 h-3.5 w-3.5 stroke-[2.5]" />
                            ) : (
                                <ArrowUpDown className="mr-1.5 h-3.5 w-3.5 text-purple-600" />
                            )}
                            <span>
                                {priceSort === 'asc'
                                    ? t('teachers_directory.filter_price_asc') || 'Price (Low to High)'
                                    : priceSort === 'desc'
                                      ? t('teachers_directory.filter_price_desc') || 'Price (High to Low)'
                                      : t('teachers.price') || 'Price'}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 p-1.5 bg-white rounded-xl shadow-lg border">
                        <DropdownMenuItem
                            onClick={() => applyFilters({ price_sort: 'asc' })}
                            className={`flex items-center gap-2 cursor-pointer font-medium rounded-lg py-2 ${
                                priceSort === 'asc' ? 'bg-purple-50 text-purple-900 font-bold' : ''
                            }`}
                        >
                            <ArrowDown className="h-4 w-4 text-purple-600" />
                            <span>{t('teachers_directory.filter_price_asc') || 'Low to High'}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => applyFilters({ price_sort: 'desc' })}
                            className={`flex items-center gap-2 cursor-pointer font-medium rounded-lg py-2 ${
                                priceSort === 'desc' ? 'bg-purple-50 text-purple-900 font-bold' : ''
                            }`}
                        >
                            <ArrowUp className="h-4 w-4 text-purple-600" />
                            <span>{t('teachers_directory.filter_price_desc') || 'High to Low'}</span>
                        </DropdownMenuItem>
                        {priceSort && (
                            <DropdownMenuItem
                                onClick={() => applyFilters({ price_sort: null })}
                                className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground rounded-lg py-2 border-t mt-1"
                            >
                                <X className="h-3.5 w-3.5" />
                                <span>Clear Price Sort</span>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Clear All Active Filters Button */}
                {isAnyActive && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => applyFilters({ status: 'all', ielts_sort: null, price_sort: null })}
                        className="text-xs font-medium text-destructive hover:bg-destructive/10 cursor-pointer"
                    >
                        <X className="mr-1 h-3.5 w-3.5" />
                        Clear Filters
                    </Button>
                )}
            </div>
        </div>
    );
}
