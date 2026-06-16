import React from 'react';
import AppLayout from '@/layouts/app-layout';
import TeacherCard from '@/components/teachers/TeacherCard';
import { Head } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';

interface Props {
    teachers: {
        data: any[];
    };
}

export default function Teachers({ teachers }: Props) {
    const { t } = useTranslation();

    return (
        <AppLayout>
            <Head title={t('teachers.browse')} />
            <div className="p-6 md:p-8 max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('teachers.meet_expert')}</h1>
                    <p className="text-muted-foreground mt-2">{t('teachers.subtitle')}</p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {teachers.data.map((teacher) => (
                        <TeacherCard key={teacher.id} teacher={teacher} />
                    ))}
                </div>

                {teachers.data.length === 0 && (
                    <div className="text-center py-20 border rounded-2xl bg-muted/20 border-dashed">
                        <p className="text-muted-foreground">{t('teachers.none_available')}</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
