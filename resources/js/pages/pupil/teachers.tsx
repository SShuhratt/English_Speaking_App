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
                <div className="flex flex-col justify-between gap-4 rounded-3xl border border-brand-brown/10 bg-gradient-to-r from-brand-yellow/30 to-transparent p-6 md:flex-row md:items-center">
                    <div className="space-y-1">
                        <h1 className="text-brand-brown text-3xl font-black tracking-tight">
                            {t('teachers.meet_expert')}
                        </h1>
                        <p className="text-sm font-medium text-muted-foreground">
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
