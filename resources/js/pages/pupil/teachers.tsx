import React from 'react';
import AppLayout from '@/layouts/app-layout';
import TeacherCard from '@/components/teachers/TeacherCard';
import TeacherFilterBar, {
    FilterState,
} from '@/components/teachers/TeacherFilterBar';
import Pagination from '@/components/teachers/Pagination';
import { Head } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';
import { SearchX } from 'lucide-react';

interface Props {
    teachers: {
        data: any[];
        links?: any[];
        current_page?: number;
        last_page?: number;
        from?: number | null;
        to?: number | null;
        total?: number;
    };
    currentFilters?: FilterState;
    currentFilter?: string;
}

export default function Teachers({
    teachers,
    currentFilters,
    currentFilter = 'all',
}: Props) {
    const { t } = useTranslation();

    const activeFilters: FilterState = currentFilters || {
        status: currentFilter,
    };

    return (
        <>
            <Head title={t('teachers.browse') || 'Find Teachers'} />
            <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
                {/* Header Section */}
                <div className="relative overflow-hidden rounded-3xl bg-brand-navy p-8 text-white shadow-lg shadow-brand-navy/10">
                    <div className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-brand-lightblue/10 blur-xl" />
                    <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-brand-yellow/10 blur-xl" />

                    <div className="relative z-10 space-y-1.5">
                        <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                            {t('teachers_directory.title') ||
                                'Find Your Ideal Teacher'}
                        </h1>
                        <p className="max-w-2xl text-xs font-medium text-white/80 md:text-sm">
                            {t('teachers_directory.subtitle') ||
                                'Browse verified English tutors, filter by availability, level, and price to book your live 1-on-1 session.'}
                        </p>
                    </div>
                </div>

                {/* Filter Bar with Search Input */}
                <TeacherFilterBar
                    baseUrl="/pupil/teachers"
                    currentFilters={activeFilters}
                />

                {/* Teachers Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {teachers.data.map((teacher) => (
                        <TeacherCard key={teacher.id} teacher={teacher} />
                    ))}
                </div>

                {/* Empty Search / Filter State */}
                {teachers.data.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#EAE4D2] bg-white py-16 text-center shadow-xs">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FDF7E4] text-[#1E2A5A]">
                            <SearchX className="h-7 w-7 text-[#1E2A5A]" />
                        </div>
                        <h3 className="text-lg font-bold text-[#1E2A5A]">
                            No teachers found
                        </h3>
                        <p className="mt-1 max-w-md text-xs font-medium text-[#5C6480]">
                            {activeFilters.search
                                ? `We couldn't find any teachers matching "${activeFilters.search}". Try checking for spelling or clear search.`
                                : t('teachers_directory.no_teachers') ||
                                  'No teachers match the selected filter criteria.'}
                        </p>
                    </div>
                )}

                {/* Pagination Controls */}
                {teachers.links && (
                    <Pagination
                        links={teachers.links}
                        from={teachers.from}
                        to={teachers.to}
                        total={teachers.total}
                    />
                )}
            </div>
        </>
    );
}

Teachers.layout = {
    breadcrumbs: [{ title: 'find teachers', href: '/pupil/teachers' }],
};
