import React from 'react';
import AppLayout from '@/layouts/app-layout';
import TeacherCard from '@/components/teachers/TeacherCard';
import { Head, router } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Sparkles, Filter, Users, ArrowUpDown } from 'lucide-react';

interface Props {
    teachers: {
        data: any[];
    };
    currentFilter?: string;
}

export default function TeacherDirectory({ teachers, currentFilter = 'all' }: Props) {
    const { t } = useTranslation();

    const handleFilter = (filter: string) => {
        router.get('/teacher/teachers', { filter }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={[{ title: t('nav.teachers_directory') || 'Teachers Directory', href: '/teacher/teachers' }]}>
            <Head title={t('teachers_directory.title') || 'Teachers Directory'} />
            <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
                {/* Header Section */}
                <div className="relative overflow-hidden rounded-3xl bg-brand-navy p-8 text-white shadow-lg shadow-brand-navy/10">
                    <div className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-brand-lightblue/10 blur-xl" />
                    <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-brand-yellow/10 blur-xl" />

                    <div className="relative z-10 space-y-1.5">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-brand-yellow" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-yellow">
                                COMMUNITY DIRECTORY
                            </span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-white">
                            {t('teachers_directory.title') || 'Teachers Directory'}
                        </h1>
                        <p className="text-sm font-medium text-brand-lightblue/80">
                            {t('teachers_directory.subtitle') || 'Explore profiles, qualifications, and rates of fellow teachers on ConvoMate.'}
                        </p>
                    </div>
                </div>

                {/* Status & Sorting Filter Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#1E2A5A]">
                        <Filter className="h-4 w-4 text-indigo-600" />
                        <span>Filter & Sort Teachers:</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            variant={currentFilter === 'all' ? 'default' : 'outline'}
                            onClick={() => handleFilter('all')}
                            className={currentFilter === 'all' ? 'bg-[#1E2A5A] text-white' : ''}
                        >
                            {t('teachers_directory.filter_all') || 'All Teachers'}
                        </Button>
                        <Button
                            size="sm"
                            variant={currentFilter === 'verified' ? 'default' : 'outline'}
                            onClick={() => handleFilter('verified')}
                            className={currentFilter === 'verified' ? 'bg-emerald-600 text-white' : ''}
                        >
                            <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                            {t('teachers_directory.filter_verified') || 'Verified'}
                        </Button>
                        <Button
                            size="sm"
                            variant={currentFilter === 'new' ? 'default' : 'outline'}
                            onClick={() => handleFilter('new')}
                            className={currentFilter === 'new' ? 'bg-blue-600 text-white' : ''}
                        >
                            <Sparkles className="mr-1 h-3.5 w-3.5" />
                            {t('teachers_directory.filter_new') || 'New (7 Days)'}
                        </Button>
                        <Button
                            size="sm"
                            variant={currentFilter === 'ielts_speaking_desc' ? 'default' : 'outline'}
                            onClick={() => handleFilter('ielts_speaking_desc')}
                            className={currentFilter === 'ielts_speaking_desc' ? 'bg-amber-600 text-white' : ''}
                        >
                            <ArrowUpDown className="mr-1 h-3.5 w-3.5" />
                            {t('teachers_directory.filter_ielts_desc') || 'IELTS Band (High to Low)'}
                        </Button>
                        <Button
                            size="sm"
                            variant={currentFilter === 'ielts_speaking_asc' ? 'default' : 'outline'}
                            onClick={() => handleFilter('ielts_speaking_asc')}
                            className={currentFilter === 'ielts_speaking_asc' ? 'bg-amber-600 text-white' : ''}
                        >
                            <ArrowUpDown className="mr-1 h-3.5 w-3.5" />
                            {t('teachers_directory.filter_ielts_asc') || 'IELTS Band (Low to High)'}
                        </Button>
                        <Button
                            size="sm"
                            variant={currentFilter === 'price_desc' ? 'default' : 'outline'}
                            onClick={() => handleFilter('price_desc')}
                            className={currentFilter === 'price_desc' ? 'bg-purple-600 text-white' : ''}
                        >
                            <ArrowUpDown className="mr-1 h-3.5 w-3.5" />
                            {t('teachers_directory.filter_price_desc') || 'Price (High to Low)'}
                        </Button>
                        <Button
                            size="sm"
                            variant={currentFilter === 'price_asc' ? 'default' : 'outline'}
                            onClick={() => handleFilter('price_asc')}
                            className={currentFilter === 'price_asc' ? 'bg-purple-600 text-white' : ''}
                        >
                            <ArrowUpDown className="mr-1 h-3.5 w-3.5" />
                            {t('teachers_directory.filter_price_asc') || 'Price (Low to High)'}
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
                            {t('teachers_directory.no_teachers') || 'No teachers found for the selected filter.'}
                        </p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
