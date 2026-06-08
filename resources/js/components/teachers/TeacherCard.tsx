import React from 'react';
import { Star, Clock, ChevronRight } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface TeacherProps {
    teacher: {
        id: string;
        full_name: string;
        profile?: {
            overall_level: string;
            experience_years: number;
            rating_cache: number;
        };
    };
}

export default function TeacherCard({ teacher }: TeacherProps) {
    const initials = teacher.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();

    return (
        <div className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-indigo-500/30 hover:shadow-lg">
            <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-bold text-white shadow-lg">
                    {initials}
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">{teacher.full_name}</h3>
                    <p className="text-sm text-muted-foreground">
                        {teacher.profile?.overall_level || 'Certified Teacher'}
                    </p>
                </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-border pt-5 text-sm">
                <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold">{teacher.profile?.rating_cache || '5.0'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{teacher.profile?.experience_years || 0}y experience</span>
                </div>
            </div>

            <Link
                href={`/pupil/booking?teacher_id=${teacher.id}`}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700"
            >
                Book Session <ChevronRight className="h-4 w-4" />
            </Link>
        </div>
    );
}
