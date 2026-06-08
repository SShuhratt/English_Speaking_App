import React from 'react';
import AppLayout from '@/layouts/app-layout';
import TeacherCard from '@/components/teachers/TeacherCard';
import { Head } from '@inertiajs/react';

interface Props {
    teachers: {
        data: any[];
    };
}

export default function Teachers({ teachers }: Props) {
    return (
        <AppLayout>
            <Head title="Browse Teachers" />
            <div className="p-6 md:p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Meet Our Expert Teachers</h1>
                    <p className="text-muted-foreground mt-2">Book a 1-on-1 session with a certified professional.</p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {teachers.data.map((teacher) => (
                        <TeacherCard key={teacher.id} teacher={teacher} />
                    ))}
                </div>

                {teachers.data.length === 0 && (
                    <div className="text-center py-20 border rounded-2xl bg-muted/20">
                        <p className="text-muted-foreground">No teachers available at the moment.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
