import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';
import { Award, BookOpen, Clock, FileCheck, ArrowLeft, Mail, User } from 'lucide-react';

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
        <AppLayout>
            <Head title={`${pupil.full_name} - Profile`} />

            <div className="mx-auto max-w-5xl p-6 md:p-8 text-[#22284A]">
                {/* Back button */}
                <button
                    onClick={() => window.history.back()}
                    className="mb-6 flex cursor-pointer items-center gap-2 rounded-xl bg-white border border-[#E6E9F2] px-4 py-2 text-xs font-bold text-[#6B7394] hover:bg-[#EEF4FB] hover:text-[#1E2A5A] transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                </button>

                {/* Profile Header Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-white border border-[#E6E9F2] p-8 shadow-sm flex flex-col md:flex-row gap-6 items-center">
                    <div className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-[#A9C6E8]/10 blur-xl" />
                    <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-[#F7DE8B]/10 blur-xl" />

                    {/* Avatar display */}
                    <div className="relative shrink-0">
                        {pupil.avatar ? (
                            <img
                                src={pupil.avatar}
                                alt={pupil.full_name}
                                className="h-24 w-24 rounded-2xl object-cover border border-[#E6E9F2] shadow-sm"
                            />
                        ) : (
                            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E2A5A] to-[#2E3D7A] text-white font-extrabold text-3xl shadow-sm">
                                {initials}
                            </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 rounded-full bg-[#FAFBFD] border border-[#E6E9F2] px-2.5 py-0.5 text-[9px] font-black text-[#1E2A5A] shadow-sm uppercase tracking-wide">
                            Pupil
                        </span>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-2 z-10">
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[#1E2A5A]">
                            {pupil.full_name}
                        </h1>
                        <p className="text-sm font-medium text-[#6B7394] max-w-xl">
                            {pupil.pupil_profile?.headline || 'English Speaking Student'}
                        </p>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-[#6B7394] pt-1">
                            <span className="flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5 text-[#1E2A5A]" />
                                {pupil.email}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-[#1E2A5A]" />
                                Joined {new Date(pupil.created_at).toLocaleDateString([], { month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Profile Grid Details */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8 items-start">
                    {/* Left details pane */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Bio Section */}
                        <div className="bg-white border border-[#E6E9F2] rounded-3xl p-6 shadow-sm">
                            <h3 className="text-base font-black uppercase tracking-wider text-[#1E2A5A] mb-4 flex items-center gap-2">
                                <User className="h-4.5 w-4.5" />
                                About Me
                            </h3>
                            <p className="text-sm leading-relaxed text-[#6B7394] whitespace-pre-wrap">
                                {pupil.pupil_profile?.bio || 'No bio information provided yet.'}
                            </p>
                        </div>

                        {/* Certificates Section */}
                        <div className="bg-white border border-[#E6E9F2] rounded-3xl p-6 shadow-sm">
                            <h3 className="text-base font-black uppercase tracking-wider text-[#1E2A5A] mb-4 flex items-center gap-2">
                                <FileCheck className="h-4.5 w-4.5" />
                                Certificates & Achievements
                            </h3>
                            {certificates.length === 0 ? (
                                <p className="text-xs text-[#6B7394]">No certificates uploaded yet.</p>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {certificates.map((cert, index) => (
                                        <div key={index} className="flex items-center justify-between border border-[#E6E9F2] bg-[#FAFBFD] rounded-2xl p-4 shadow-sm">
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-bold text-xs text-[#1E2A5A] truncate">{cert.title || cert.file_name}</h4>
                                                <p className="text-[10px] text-[#6B7394] truncate">Verified Document</p>
                                            </div>
                                            <a
                                                href={cert.file_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="ml-3 shrink-0 rounded-full bg-[#1E2A5A] hover:bg-[#1E2A5A]/90 px-3.5 py-1.5 text-[10px] font-bold text-white shadow transition-colors cursor-pointer"
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
                    <div className="lg:col-span-4 space-y-8">
                        {/* Target Band Scores */}
                        <div className="bg-white border border-[#E6E9F2] rounded-3xl p-6 shadow-sm space-y-4">
                            <h3 className="text-base font-black uppercase tracking-wider text-[#1E2A5A] flex items-center gap-2">
                                <Award className="h-4.5 w-4.5" />
                                Target IELTS Band
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#FAFBFD] border border-[#E6E9F2] rounded-2xl p-4 text-center">
                                    <span className="block text-2xl font-black text-[#1E2A5A] leading-none">
                                        {pupil.pupil_profile?.target_overall_band || '-'}
                                    </span>
                                    <span className="text-[10px] font-bold text-[#6B7394] mt-2 block">
                                        Overall Band
                                    </span>
                                </div>
                                <div className="bg-[#FAFBFD] border border-[#E6E9F2] rounded-2xl p-4 text-center">
                                    <span className="block text-2xl font-black text-[#1E2A5A] leading-none">
                                        {pupil.pupil_profile?.target_speaking_band || '-'}
                                    </span>
                                    <span className="text-[10px] font-bold text-[#6B7394] mt-2 block">
                                        Speaking Band
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Labels / Interests Section */}
                        <div className="bg-white border border-[#E6E9F2] rounded-3xl p-6 shadow-sm">
                            <h3 className="text-base font-black uppercase tracking-wider text-[#1E2A5A] mb-4 flex items-center gap-2">
                                <BookOpen className="h-4.5 w-4.5" />
                                Learning Goals
                            </h3>
                            {labels.length === 0 ? (
                                <p className="text-xs text-[#6B7394]">No goals specified.</p>
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
        </AppLayout>
    );
}
