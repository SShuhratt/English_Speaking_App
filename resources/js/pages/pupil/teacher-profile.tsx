import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, setLayoutProps } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';
import {
    Star,
    Clock,
    User,
    Calendar,
    Award,
    Briefcase,
    ChevronRight,
    MessageCircle,
    ExternalLink,
    FileText,
} from 'lucide-react';

interface Feedback {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    author?: {
        full_name: string;
    };
}

interface Teacher {
    id: string;
    full_name: string;
    teacher_profile?: {
        overall_level: string;
        speaking_band?: string | number;
        experience_years: number;
        workplace?: string;
        age?: number;
        certificates?: string[];
        rating_cache: number;
        labels?: string[];
    };
    feedbacks?: Feedback[];
}

interface Props {
    teacher: Teacher;
}

export default function TeacherProfile({ teacher }: Props) {
    const { t } = useTranslation();

    React.useEffect(() => {
        setLayoutProps({
            breadcrumbs: [
                { title: 'find teachers', href: '/pupil/teachers' },
                {
                    title: teacher.full_name,
                    href: `/pupil/teachers/${teacher.id}`,
                },
            ],
        });
    }, [teacher.full_name, teacher.id]);

    const initials = teacher.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();

    const experience = teacher.teacher_profile?.experience_years || 0;
    const rating = teacher.teacher_profile?.rating_cache || 5.0;

    return (
        <>
            <Head
                title={`${teacher.full_name} - ${t('teachers.profile_title')}`}
            />

            <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-8">
                {/* ── Top Header Card ── */}
                <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-350 md:p-8">
                    {/* Background decorative gradient */}
                    <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-brand-brown/10 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-brand-yellow/10 blur-3xl" />

                    <div className="relative z-10 flex flex-col items-center gap-8 md:flex-row md:items-start">
                        {/* Avatar */}
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-brand-brown text-3xl font-black text-white shadow-xl shadow-brand-brown/10 md:h-28 md:w-28">
                            {initials}
                        </div>

                        {/* Details */}
                        <div className="flex-1 space-y-4 text-center md:text-left">
                            <div>
                                <h1 className="text-3xl font-black tracking-tight text-foreground">
                                    {teacher.full_name}
                                </h1>

                                <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5 md:justify-start">
                                    <span className="inline-flex items-center rounded-lg border border-brand-brown/20 bg-brand-lightblue px-2.5 py-1 text-[11px] font-bold text-brand-brown">
                                        {teacher.teacher_profile
                                            ?.overall_level ||
                                            t('teachers.certified')}
                                    </span>
                                    {teacher.teacher_profile?.speaking_band && (
                                        <span className="inline-flex items-center rounded-lg border border-brand-orange/20 bg-brand-yellow/50 px-2.5 py-1 text-[11px] font-bold text-brand-orange">
                                            {t('teachers.speaking', {
                                                band: teacher.teacher_profile
                                                    .speaking_band,
                                            })}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-6 border-t border-dashed border-border/80 pt-4 md:justify-start">
                                <div className="flex items-center gap-2">
                                    <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                                    <span className="text-lg font-bold text-foreground">
                                        {rating.toFixed(1)}
                                    </span>
                                    <span className="text-xs font-semibold text-muted-foreground">
                                        / 5.0 rating
                                    </span>
                                </div>
                                <div className="h-4 w-px bg-border" />
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-brand-brown" />
                                    <span className="text-sm font-bold text-foreground">
                                        {t('teachers.years_experience', {
                                            count: experience,
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* CTA Book Now */}
                        <div className="w-full shrink-0 self-stretch md:w-auto md:self-center">
                             <Link
                                href={`/pupil/booking?teacher_id=${teacher.id}`}
                                className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-brand-button hover:bg-brand-button-hover px-8 py-4 text-base font-bold text-white shadow-lg shadow-brand-button/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {t('teachers.book_now')}{' '}
                                <ChevronRight className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ── Details Grid ── */}
                <div className="grid gap-8 md:grid-cols-3">
                    {/* Left Column: About & Focus */}
                    <div className="space-y-6">
                        {/* Teaching Focus Labels */}
                        {teacher.teacher_profile?.labels &&
                            teacher.teacher_profile.labels.length > 0 && (
                                <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                                    <h2 className="mb-4 flex items-center gap-2 border-b border-border/60 pb-3 text-base font-bold">
                                        <Award className="h-4.5 w-4.5 text-brand-brown" />
                                        {t('labels.title') || 'Teaching Focus'}
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        {teacher.teacher_profile.labels.map(
                                            (lbl) => (
                                                <span
                                                    key={lbl}
                                                    className="inline-flex items-center rounded-xl border border-brand-brown/10 bg-brand-lightblue px-3 py-1.5 text-xs font-semibold text-brand-brown"
                                                >
                                                    {t(`labels.${lbl}`)}
                                                </span>
                                            ),
                                        )}
                                    </div>
                                </div>
                            )}

                        {/* Profile Details */}
                        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 border-b border-border/60 pb-3 text-base font-bold">
                                <User className="h-4.5 w-4.5 text-brand-brown" />
                                {t('settings.profile')}
                            </h2>

                            <div className="space-y-4 text-sm font-semibold">
                                {teacher.teacher_profile?.workplace && (
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                            {t('teachers.workplace')}
                                        </span>
                                        <span className="mt-0.5 flex items-center gap-2 text-foreground">
                                            <Briefcase className="h-4 w-4 shrink-0 text-brand-brown/80" />
                                            {teacher.teacher_profile.workplace}
                                        </span>
                                    </div>
                                )}
                                {teacher.teacher_profile?.age && (
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                            {t('teachers.age')}
                                        </span>
                                        <span className="mt-0.5 flex items-center gap-2 text-foreground">
                                            <Calendar className="h-4 w-4 shrink-0 text-brand-brown/80" />
                                            {teacher.teacher_profile.age} years
                                            old
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Certificates */}
                        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 border-b border-border/60 pb-3 text-base font-bold">
                                <Award className="h-4.5 w-4.5 text-brand-brown" />
                                {t('teachers.certificates')}
                            </h2>

                            {teacher.teacher_profile?.certificates &&
                            teacher.teacher_profile.certificates.length > 0 ? (
                                <div className="space-y-4">
                                    {/* Text certificates */}
                                    {teacher.teacher_profile.certificates.filter(
                                        (c) =>
                                            !c.startsWith('http') &&
                                            !c.startsWith('/storage'),
                                    ).length > 0 && (
                                        <ul className="space-y-2 text-xs font-semibold">
                                            {teacher.teacher_profile.certificates
                                                .filter(
                                                    (c) =>
                                                        !c.startsWith('http') &&
                                                        !c.startsWith(
                                                            '/storage',
                                                        ),
                                                )
                                                .map((cert, index) => (
                                                    <li
                                                        key={index}
                                                        className="flex items-center gap-2.5 rounded-2xl border border-border/50 bg-muted/30 p-3 text-foreground"
                                                    >
                                                        <Award className="h-4 w-4 shrink-0 text-amber-500" />
                                                        <span className="truncate">
                                                            {cert}
                                                        </span>
                                                    </li>
                                                ))}
                                        </ul>
                                    )}

                                    {/* File certificates */}
                                    {teacher.teacher_profile.certificates.filter(
                                        (c) => {
                                            if (
                                                !c ||
                                                (!c.startsWith('http') &&
                                                    !c.startsWith('/storage'))
                                            )
                                                return false;
                                            const cleanUrl = c.split('?')[0];
                                            return !(
                                                cleanUrl.endsWith('/') ||
                                                cleanUrl.endsWith(
                                                    'edtech-media-storage-dev',
                                                )
                                            );
                                        },
                                    ).length > 0 && (
                                        <div className="space-y-2.5">
                                            <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
                                                Documents & Images
                                            </h3>
                                            <div className="grid grid-cols-1 gap-3">
                                                {teacher.teacher_profile.certificates
                                                    .filter((c) => {
                                                        if (
                                                            !c ||
                                                            (!c.startsWith(
                                                                'http',
                                                            ) &&
                                                                !c.startsWith(
                                                                    '/storage',
                                                                ))
                                                        )
                                                            return false;
                                                        const cleanUrl =
                                                            c.split('?')[0];
                                                        return !(
                                                            cleanUrl.endsWith(
                                                                '/',
                                                            ) ||
                                                            cleanUrl.endsWith(
                                                                'edtech-media-storage-dev',
                                                            )
                                                        );
                                                    })
                                                    .map((cert, index) => {
                                                        const cleanUrl =
                                                            cert.split('?')[0];
                                                        const isImg =
                                                            /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(
                                                                cleanUrl,
                                                            );
                                                        const isPdf =
                                                            /\.pdf$/i.test(
                                                                cleanUrl,
                                                            );
                                                        return (
                                                            <div
                                                                key={index}
                                                                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-muted/20 p-2 transition-all hover:shadow-sm"
                                                            >
                                                                {isImg ? (
                                                                    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-muted">
                                                                        <img
                                                                            src={
                                                                                cert
                                                                            }
                                                                            alt="Certificate"
                                                                            className="h-full w-full object-cover"
                                                                        />
                                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                                                            <a
                                                                                href={
                                                                                    cert
                                                                                }
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="flex scale-95 items-center gap-1.5 rounded-xl bg-white/95 p-2 text-xs font-bold text-slate-800 shadow-md transition-all hover:scale-100 hover:bg-white"
                                                                            >
                                                                                <ExternalLink className="h-4 w-4" />{' '}
                                                                                View
                                                                                Full
                                                                                Image
                                                                            </a>
                                                                        </div>
                                                                    </div>
                                                                ) : isPdf ? (
                                                                    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-border/40 bg-white">
                                                                        <iframe
                                                                            src={`${cert}#toolbar=0&navpanes=0`}
                                                                            className="pointer-events-none h-full w-full border-0"
                                                                        />
                                                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 p-4 text-center opacity-0 transition-opacity group-hover:opacity-100">
                                                                            <span className="mb-2 max-w-full truncate text-xs font-semibold text-white">
                                                                                {cert.substring(
                                                                                    cert.lastIndexOf(
                                                                                        '/',
                                                                                    ) +
                                                                                        1,
                                                                                )}
                                                                            </span>
                                                                            <a
                                                                                href={
                                                                                    cert
                                                                                }
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="flex scale-95 items-center gap-1.5 rounded-xl bg-white/95 p-2 text-xs font-bold text-slate-800 shadow-md transition-all hover:scale-100 hover:bg-white"
                                                                            >
                                                                                <ExternalLink className="h-4 w-4" />{' '}
                                                                                View
                                                                                Full
                                                                                PDF
                                                                            </a>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex aspect-[3/1] w-full items-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/40 p-3">
                                                                         <FileText className="h-7 w-7 shrink-0 text-brand-brown/80" />
                                                                        <div className="flex min-w-0 flex-1 flex-col">
                                                                            <span className="truncate text-[10px] font-bold text-foreground">
                                                                                {cert.substring(
                                                                                    cert.lastIndexOf(
                                                                                        '/',
                                                                                    ) +
                                                                                        1,
                                                                                )}
                                                                            </span>
                                                                            <a
                                                                                href={
                                                                                    cert
                                                                                }
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                 className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-brand-brown hover:underline"
                                                                            >
                                                                                Open
                                                                                Document{' '}
                                                                                <ExternalLink className="h-3 w-3" />
                                                                            </a>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs font-medium text-muted-foreground">
                                    {t('teachers.no_certificates')}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Feedback List */}
                    <div className="space-y-6 md:col-span-2">
                        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                            <h2 className="mb-6 flex items-center gap-2 border-b border-border/60 pb-4 text-base font-bold">
                                <MessageCircle className="h-5 w-5 text-brand-brown" />
                                {t('teachers.feedback_title')}
                            </h2>

                            {teacher.feedbacks &&
                            teacher.feedbacks.length > 0 ? (
                                <div className="space-y-4">
                                    {teacher.feedbacks.map((fb) => (
                                        <div
                                            key={fb.id}
                                            className="rounded-2xl border border-border/65 bg-card p-5 transition-shadow duration-300 hover:shadow-md"
                                        >
                                            <div className="mb-3 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-lightblue text-xs font-bold text-brand-brown">
                                                        {fb.author?.full_name
                                                            ?.substring(0, 2)
                                                            .toUpperCase() ||
                                                            'P'}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-foreground">
                                                            {fb.author
                                                                ?.full_name ||
                                                                'Pupil'}
                                                        </h4>
                                                        <p className="mt-0.5 text-[10px] font-semibold text-muted-foreground">
                                                            {new Date(
                                                                fb.created_at,
                                                            ).toLocaleDateString(
                                                                [],
                                                                {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    year: 'numeric',
                                                                },
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 rounded-lg border border-amber-500/10 bg-amber-500/5 px-2.5 py-1 text-xs font-bold text-amber-600">
                                                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />{' '}
                                                    {fb.rating}/10
                                                </div>
                                            </div>
                                            <p className="text-sm leading-relaxed font-medium text-muted-foreground italic">
                                                "{fb.comment}"
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-3xl border border-dashed bg-muted/10 py-12 text-center">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {t('teachers.no_feedback')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

TeacherProfile.layout = {
    breadcrumbs: [
        { title: 'find teachers', href: '/pupil/teachers' },
        { title: '...', href: '#' },
    ],
};
