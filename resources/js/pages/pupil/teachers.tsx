import React from 'react';
import AppLayout from '@/layouts/app-layout';
import TeacherCard from '@/components/teachers/TeacherCard';
import { Head, router } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Sparkles, Filter } from 'lucide-react';

interface Props {
    teachers: {
        data: any[];
    };
    currentFilter?: string;
}

export default function Teachers({ teachers, currentFilter = 'all' }: Props) {
    const { t } = useTranslation();

    const handleFilter = (filter: string) => {
        router.get('/pupil/teachers', { status: filter }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'find teachers', href: '/pupil/teachers' }]}>
            <Head title={t('teachers.browse')} />
            <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
                {/* Header Section */}
                <div className="relative overflow-hidden rounded-3xl bg-brand-navy p-8 text-white shadow-lg shadow-brand-navy/10">
                    <div className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-brand-lightblue/10 blur-xl" />
                    <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-brand-yellow/10 blur-xl" />

                    <div className="relative z-10 space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-yellow">
                            FIND A TEACHER
                        </span>
                        <h1 className="text-3xl font-black tracking-tight text-white">
                            {t('teachers.meet_expert')}
                        </h1>
                        <p className="text-sm font-medium text-brand-lightblue/80">
                            {t('teachers.subtitle')}
                        </p>
                    </div>
                </div>

                {/* Status Filter Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#1E2A5A]">
                        <Filter className="h-4 w-4 text-indigo-600" />
                        <span>Filter Teachers by Status:</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            variant={currentFilter === 'all' ? 'default' : 'outline'}
                            onClick={() => handleFilter('all')}
                            className={currentFilter === 'all' ? 'bg-[#1E2A5A] text-white' : ''}
                        >
                            All Teachers
                        </Button>
                        <Button
                            size="sm"
                            variant={currentFilter === 'verified' ? 'default' : 'outline'}
                            onClick={() => handleFilter('verified')}
                            className={currentFilter === 'verified' ? 'bg-emerald-600 text-white' : ''}
                        >
                            <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                            Verified Teachers
                        </Button>
                        <Button
                            size="sm"
                            variant={currentFilter === 'new' ? 'default' : 'outline'}
                            onClick={() => handleFilter('new')}
                            className={currentFilter === 'new' ? 'bg-blue-600 text-white' : ''}
                        >
                            <Sparkles className="mr-1 h-3.5 w-3.5" />
                            New (7 Days)
                        </Button>
                        <Button
                            size="sm"
                            variant={currentFilter === 'unverified' ? 'default' : 'outline'}
                            onClick={() => handleFilter('unverified')}
                            className={currentFilter === 'unverified' ? 'bg-[#1E2A5A] text-white' : ''}
                        >
                            Unverified
                        </Button>
                    </div>
                </div>

                {/* Teachers Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {teachers.data.map((teacher) => (
                        <TeacherCard key={teacher.id} teacher={teacher} />
                    ))}
                </div>

                {teachers.data.length === 0 && (
                    <div className="rounded-3xl border border-dashed bg-card py-20 text-center">
                        <p className="text-sm font-medium text-muted-foreground">
                            No teachers match the selected filter criteria.
                        </p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
