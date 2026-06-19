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
            <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50/40 via-purple-50/20 to-transparent dark:border-indigo-950/20 dark:from-indigo-950/5 dark:via-purple-950/20">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
                            {t('teachers.meet_expert')}
                        </h1>
                        <p className="text-muted-foreground font-medium text-sm">{t('teachers.subtitle')}</p>
                    </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {teachers.data.map((teacher) => (
                        <TeacherCard key={teacher.id} teacher={teacher} />
                    ))}
                </div>

                {teachers.data.length === 0 && (
                    <div className="text-center py-20 border border-dashed rounded-3xl bg-card">
                        <p className="text-muted-foreground text-sm font-medium">{t('teachers.none_available')}</p>
                    </div>
                )}
            </div>
        </>
    );
}

Teachers.layout = {
    breadcrumbs: [{ title: 'find teachers', href: '/pupil/teachers' }]
};
