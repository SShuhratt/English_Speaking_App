import React from 'react';
import AppLayout from '@/layouts/app-layout';
import TeacherCard from '@/components/teachers/TeacherCard';
import TeacherFilterBar, { FilterState } from '@/components/teachers/TeacherFilterBar';
import { Head } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';

interface Props {
    teachers: {
        data: any[];
    };
    currentFilters?: FilterState;
    currentFilter?: string;
}

export default function Teachers({ teachers, currentFilters, currentFilter = 'all' }: Props) {
    const { t } = useTranslation();

    const activeFilters: FilterState = currentFilters || { status: currentFilter };

    return (
        <>
            <Head title={t('teachers.browse')} />
            <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
                {/* Header Section */}
                <div className="relative overflow-hidden rounded-3xl bg-brand-navy p-8 text-white shadow-lg shadow-brand-navy/10">
                    <div className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-brand-lightblue/10 blur-xl" />
                    <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-brand-yellow/10 blur-xl" />

                    <div className="relative z-10 space-y-1.5">
                        <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                            {t('teachers_directory.title') || 'Find Your Ideal Teacher'}
                        </h1>
                        <p className="max-w-2xl text-xs font-medium text-white/80 md:text-sm">
                            {t('teachers_directory.subtitle') || 'Browse verified English tutors, filter by availability, level, and price to book your live 1-on-1 session.'}
                        </p>
                    </div>
                </div>

                {/* Filter Bar */}
                <TeacherFilterBar initialFilters={activeFilters} currentFilter={currentFilter} />

                {/* Teachers Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {teachers.data.map((teacher) => (
                        <TeacherCard key={teacher.id} teacher={teacher} />
                    ))}
                </div>

                {teachers.data.length === 0 && (
                    <div className="rounded-3xl border border-dashed bg-card py-20 text-center">
                        <p className="text-sm font-medium text-muted-foreground">
                            {t('teachers_directory.no_teachers') || 'No teachers match the selected filter criteria.'}
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}

Teachers.layout = {
    breadcrumbs: [{ title: 'find teachers', href: '/pupil/teachers' }],
};
