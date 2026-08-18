import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';
import {
    Award,
    BookOpen,
    Clock,
    FileCheck,
    ArrowLeft,
    Mail,
    User,
} from 'lucide-react';

interface Props {
    pupil: {
        id: string;
        full_name: string;
        email: string;
        avatar?: string;
        created_at: string;
        pupil_profile?: {
            headline?: string;
            bio?: string;
            target_level?: string;
            target_overall_band?: string | number;
            target_speaking_band?: string | number;
            labels?: string[];
            certificates?: Array<{
                title: string;
                file_url: string;
                file_name: string;
            }>;
        };
    };
}

export default function PupilProfileView({ pupil }: Props) {
    const { t } = useTranslation();

    const initials = pupil.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

    const labels = pupil.pupil_profile?.labels || [];
    const certificates = pupil.pupil_profile?.certificates || [];

    return (
        <>
            <Head title={`${pupil.full_name} - Profile`} />

            <div className="mx-auto max-w-5xl p-6 text-[#22284A] md:p-8">
                {/* Back button */}
                <button
                    onClick={() => window.history.back()}
                    className="mb-6 flex cursor-pointer items-center gap-2 rounded-xl border border-[#E6E9F2] bg-white px-4 py-2 text-xs font-bold text-[#6B7394] transition-colors hover:bg-[#EEF4FB] hover:text-[#1E2A5A]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                </button>

                {/* Profile Header Banner */}
                <div className="relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl border border-[#E6E9F2] bg-white p-8 shadow-sm md:flex-row">
                    <div className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-[#A9C6E8]/10 blur-xl" />
                    <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-[#F7DE8B]/10 blur-xl" />

                    {/* Avatar display */}
                    <div className="relative shrink-0">
                        {pupil.avatar ? (
                            <img
                                src={pupil.avatar}
                                alt={pupil.full_name}
                                className="h-24 w-24 rounded-2xl border border-[#E6E9F2] object-cover shadow-sm"
                            />
                        ) : (
                            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E2A5A] to-[#2E3D7A] text-3xl font-extrabold text-white shadow-sm">
                                {initials}
                            </div>
                        )}
                        <span className="absolute -right-1 -bottom-1 rounded-full border border-[#E6E9F2] bg-[#FAFBFD] px-2.5 py-0.5 text-[9px] font-black tracking-wide text-[#1E2A5A] uppercase shadow-sm">
                            Pupil
                        </span>
                    </div>

                    <div className="z-10 flex-1 space-y-2 text-center md:text-left">
                        <h1 className="text-2xl font-black tracking-tight text-[#1E2A5A] md:text-3xl">
                            {pupil.full_name}
                        </h1>
                        <p className="max-w-xl text-sm font-medium text-[#6B7394]">
                            {pupil.pupil_profile?.headline ||
                                'English Speaking Student'}
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-4 pt-1 text-xs font-semibold text-[#6B7394] md:justify-start">
                            <span className="flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5 text-[#1E2A5A]" />
                                {pupil.email}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-[#1E2A5A]" />
                                Joined{' '}
                                {new Date(pupil.created_at).toLocaleDateString(
                                    [],
                                    { month: 'long', year: 'numeric' },
                                )}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Profile Grid Details */}
                <div className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                    {/* Left details pane */}
                    <div className="space-y-8 lg:col-span-8">
                        {/* Bio Section */}
                        <div className="rounded-3xl border border-[#E6E9F2] bg-white p-6 shadow-sm">
                            <h3 className="mb-4 flex items-center gap-2 text-base font-black tracking-wider text-[#1E2A5A] uppercase">
                                <User className="h-4.5 w-4.5" />
                                About Me
                            </h3>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap text-[#6B7394]">
                                {pupil.pupil_profile?.bio ||
                                    'No bio information provided yet.'}
                            </p>
                        </div>

                        {/* Certificates Section */}
                        <div className="rounded-3xl border border-[#E6E9F2] bg-white p-6 shadow-sm">
                            <h3 className="mb-4 flex items-center gap-2 text-base font-black tracking-wider text-[#1E2A5A] uppercase">
                                <FileCheck className="h-4.5 w-4.5" />
                                Certificates & Achievements
                            </h3>
                            {certificates.length === 0 ? (
                                <p className="text-xs text-[#6B7394]">
                                    No certificates uploaded yet.
                                </p>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {certificates.map((cert, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between rounded-2xl border border-[#E6E9F2] bg-[#FAFBFD] p-4 shadow-sm"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <h4 className="truncate text-xs font-bold text-[#1E2A5A]">
                                                    {cert.title ||
                                                        cert.file_name}
                                                </h4>
                                                <p className="truncate text-[10px] text-[#6B7394]">
                                                    Verified Document
                                                </p>
                                            </div>
                                            <a
                                                href={cert.file_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="ml-3 shrink-0 cursor-pointer rounded-full bg-[#1E2A5A] px-3.5 py-1.5 text-[10px] font-bold text-white shadow transition-colors hover:bg-[#1E2A5A]/90"
                                            >
                                                View
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right details pane */}
                    <div className="space-y-8 lg:col-span-4">
                        {/* Target Band Scores */}
                        <div className="space-y-4 rounded-3xl border border-[#E6E9F2] bg-white p-6 shadow-sm">
                            <h3 className="flex items-center gap-2 text-base font-black tracking-wider text-[#1E2A5A] uppercase">
                                <Award className="h-4.5 w-4.5" />
                                Target IELTS Band
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-2xl border border-[#E6E9F2] bg-[#FAFBFD] p-4 text-center">
                                    <span className="block text-2xl leading-none font-black text-[#1E2A5A]">
                                        {pupil.pupil_profile
                                            ?.target_overall_band || '-'}
                                    </span>
                                    <span className="mt-2 block text-[10px] font-bold text-[#6B7394]">
                                        Overall Band
                                    </span>
                                </div>
                                <div className="rounded-2xl border border-[#E6E9F2] bg-[#FAFBFD] p-4 text-center">
                                    <span className="block text-2xl leading-none font-black text-[#1E2A5A]">
                                        {pupil.pupil_profile
                                            ?.target_speaking_band || '-'}
                                    </span>
                                    <span className="mt-2 block text-[10px] font-bold text-[#6B7394]">
                                        Speaking Band
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* About & Target Level */}
                    <div className="space-y-6 rounded-3xl border border-[#E6E9F2] bg-white p-6 shadow-sm">
                        <h2 className="text-base font-black text-[#1E2A5A]">
                            Student Details
                        </h2>

                        <div className="space-y-4 text-xs font-medium">
                            <div>
                                <span className="block text-[11px] text-[#6B7394]">
                                    Target English Level
                                </span>
                                <span className="text-sm font-bold text-[#1E2A5A]">
                                    {pupil.pupil_profile?.target_level
                                        ? t(
                                              `levels.${pupil.pupil_profile.target_level}`,
                                          )
                                        : 'Not specified'}
                                </span>
                            </div>

                            <div>
                                <span className="block text-[11px] text-[#6B7394]">
                                    Bio / Intro
                                </span>
                                <p className="mt-1 text-xs text-[#22284A]">
                                    {pupil.pupil_profile?.bio ||
                                        'No bio provided yet.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Goals / Interests */}
                    <div className="space-y-6 rounded-3xl border border-[#E6E9F2] bg-white p-6 shadow-sm">
                        <h2 className="text-base font-black text-[#1E2A5A]">
                            Goals & Topics
                        </h2>

                        <div>
                            <span className="mb-2 block text-[11px] font-medium text-[#6B7394]">
                                Learning Goals
                            </span>
                            {labels.length === 0 ? (
                                <p className="text-xs text-[#6B7394]">
                                    No goals specified.
                                </p>
                            ) : (
                                <div className="flex flex-wrap gap-1.5">
                                    {labels.map((label) => (
                                        <span
                                            key={label}
                                            className="inline-flex items-center rounded-lg border border-[#E6E9F2] bg-[#EEF4FB] px-2.5 py-1 text-[10px] font-bold text-[#1E2A5A]"
                                        >
                                            {t(`labels.${label}`)}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

PupilProfileView.layout = {
    breadcrumbs: [{ title: 'profile', href: '#' }],
};
