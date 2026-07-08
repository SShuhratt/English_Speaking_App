import React from 'react';
import AppLayout from '@/layouts/app-layout';
import TeacherCard from '@/components/teachers/TeacherCard';
import { Head } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';
import { Sparkles } from 'lucide-react';

interface Props {
    teachers: {
        data: any[];
    };
}

export default function Teachers({ teachers }: Props) {
    const { t } = useTranslation();

    return (
        <>
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

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {teachers.data.map((teacher) => (
                        <TeacherCard key={teacher.id} teacher={teacher} />
                    ))}
                </div>

                {teachers.data.length === 0 && (
                    <div className="rounded-3xl border border-dashed bg-card py-20 text-center">
                        <p className="text-sm font-medium text-muted-foreground">
                            {t('teachers.none_available')}
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
