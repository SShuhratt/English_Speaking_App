import React from 'react';
import { Form, Head, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { Trash2, FileText, ExternalLink, Award, Plus, Lock, Upload, Play } from 'lucide-react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';
import { useTranslation } from '@/hooks/use-translation';

type PageProps = {
    auth: Auth & {
        user: {
            role: 'teacher' | 'pupil';
            avatar?: string;
            teacher_profile?: {
                age?: number;
                phone_number?: string;
                experience_years?: string;
                workplace?: string;
                overall_level?: string;
                speaking_band?: number;
                certificates?: Array<{ title: string; file_url: string; file_name?: string; status?: string }> | string[];
                labels?: string[];
                headline?: string;
                bio?: string;
                intro_video_url?: string;
                price?: number;
            };
            pupil_profile?: {
                age?: number;
                phone_number?: string;
                level?: string;
                certificates?: string[];
            };
            availabilities?: Array<{ day_of_week: string; start_time: string; end_time: string }>;
        };
    };
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;
    const { t } = useTranslation();

    const isImageFile = (url: string) => {
        const cleanUrl = url.split('?')[0];
        return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(cleanUrl);
    };

    const isPdfFile = (url: string) => {
        const cleanUrl = url.split('?')[0];
        return /\.pdf$/i.test(cleanUrl);
    };

    // --- Pupil specific logic ---
    const initialPupilCerts = React.useMemo(() => {
        const rawCerts = auth.user.pupil_profile?.certificates ?? [];
        return rawCerts.filter((c) => {
            if (!c || (!c.startsWith('http') && !c.startsWith('/storage')))
                return false;
            const cleanUrl = c.split('?')[0];
            return !(
                cleanUrl.endsWith('/') ||
                cleanUrl.endsWith('edtech-media-storage-dev')
            );
        });
    }, [auth.user]);

    const [pupilCerts, setPupilCerts] = React.useState<string[]>(initialPupilCerts);

    // --- Teacher specific logic ---
    const initialTeacherCerts = React.useMemo(() => {
        const rawCerts = auth.user.teacher_profile?.certificates ?? [];
        return rawCerts.map((c: any, index: number) => {
            if (typeof c === 'string') {
                const isUrl = c.startsWith('http') || c.startsWith('/storage');
                return {
                    id: index,
                    title: isUrl ? '' : c,
                    file_url: isUrl ? c : null,
                    file_name: isUrl ? c.substring(c.lastIndexOf('/') + 1) : '',
                    status: 'verified',
                };
            }
            return {
                id: index,
                title: c.title ?? '',
                file_url: c.file_url ?? null,
                file_name: c.file_name ?? '',
                status: c.status ?? 'pending',
            };
        });
    }, [auth.user]);

    const [certs, setCerts] = React.useState(initialTeacherCerts);

    const addCertificate = () => {
        setCerts((prev) => [
            ...prev,
            {
                id: Date.now(),
                title: '',
                file_url: null,
                file_name: '',
                status: 'pending',
            },
        ]);
    };

    const updateCertTitle = (index: number, title: string) => {
        setCerts((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], title };
            return next;
        });
    };

    const handleCertFileSelect = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCerts((prev) => {
                const next = [...prev];
                next[index] = {
                    ...next[index],
                    file_name: file.name,
                    file_url: URL.createObjectURL(file), // Temp preview
                    status: 'pending',
                };
                return next;
            });
        }
    };

    const removeCertificate = (index: number) => {
        setCerts((prev) => prev.filter((_, i) => i !== index));
    };

    // Avatar preview
    const [avatarPreview, setAvatarPreview] = React.useState(auth.user.avatar || '');

    const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    // Headline & Bio with char counts
    const [headline, setHeadline] = React.useState(auth.user.teacher_profile?.headline ?? '');
    const [bio, setBio] = React.useState(auth.user.teacher_profile?.bio ?? '');

    // Video Upload Preview
    const [videoPreview, setVideoPreview] = React.useState(auth.user.teacher_profile?.intro_video_url || '');
    const [videoFileName, setVideoFileName] = React.useState('');

    const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVideoFileName(file.name);
            setVideoPreview(URL.createObjectURL(file));
        }
    };

    // Focus / Labels
    const [labels, setLabels] = React.useState<string[]>(auth.user.teacher_profile?.labels ?? []);

    const toggleLabel = (val: string) => {
        setLabels((prev) =>
            prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
        );
    };

    // Hourly Rate
    const [price, setPrice] = React.useState(() => {
        const p = auth.user.teacher_profile?.price ?? 0;
        return p ? String(p).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '';
    });

    const formatPrice = (val: string) => {
        const clean = val.replace(/\D/g, '');
        return clean ? clean.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '';
    };

    // Weekly Availability
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const initialAvails = React.useMemo(() => {
        const map: Record<string, { is_active: boolean; start_time: string; end_time: string }> = {};
        daysOfWeek.forEach((d) => {
            const found = auth.user.availabilities?.find((a: any) => a.day_of_week === d);
            map[d] = {
                is_active: !!found,
                start_time: found ? found.start_time.substring(0, 5) : '10:00',
                end_time: found ? found.end_time.substring(0, 5) : '20:00',
            };
        });
        return map;
    }, [auth.user]);

    const [avails, setAvails] = React.useState(initialAvails);

    const toggleDay = (day: string) => {
        setAvails((prev) => ({
            ...prev,
            [day]: { ...prev[day], is_active: !prev[day].is_active },
        }));
    };

    const updateDayTime = (day: string, field: 'start_time' | 'end_time', val: string) => {
        setAvails((prev) => ({
            ...prev,
            [day]: { ...prev[day], [field]: val },
        }));
    };

    const timeOptions = Array.from({ length: 24 }, (_, i) => {
        const h = String(i).padStart(2, '0');
        return `${h}:00`;
    });

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <>
            <Head title={t('profile.title')} />

            {/* Load Mockup fonts dynamically */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
                href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Schibsted+Grotesk:wght@400;500;600;700&display=swap"
                rel="stylesheet"
            />

            <h1 className="sr-only">{t('profile.title')}</h1>

            <div className="teacher-settings-container text-[#22284A] bg-[#FAFBFD] font-sans antialiased">
                {/* Embed mockup style definitions cleanly */}
                <style dangerouslySetInnerHTML={{ __html: `
                    .teacher-settings-container {
                        --butter: #F7DE8B;
                        --butter-deep: #F0CE5F;
                        --blue: #A9C6E8;
                        --blue-tint: #EEF4FB;
                        --navy: #1E2A5A;
                        --ink: #22284A;
                        --muted: #6B7394;
                        --line: #E6E9F2;
                        --white: #fff;
                        --radius: 22px;
                    }
                    .teacher-settings-container h1, 
                    .teacher-settings-container h2, 
                    .teacher-settings-container h3,
                    .teacher-settings-container .bricolage-font {
                        font-family: 'Bricolage Grotesque', sans-serif !important;
                    }
                    .teacher-settings-container p,
                    .teacher-settings-container label,
                    .teacher-settings-container input,
                    .teacher-settings-container textarea,
                    .teacher-settings-container select,
                    .teacher-settings-container span,
                    .teacher-settings-container button {
                        font-family: 'Schibsted Grotesk', sans-serif !important;
                    }
                ` }} />

                <Form
                    {...ProfileController.update.form()}
                    method="post"
                    options={{
                        preserveScroll: true,
                    }}
                    className="max-w-[760px] mx-auto px-4 py-8 space-y-12"
                >
                    {({ processing, errors }) => (
                        <>
                            <input type="hidden" name="_method" value="PATCH" />

                            {/* Redesigned Teacher settings or default pupil view */}
                            {auth.user.role === 'teacher' ? (
                                <>
                                    {/* 1. Basics */}
                                    <div className="space-y-4">
                                        <div>
                                            <h2 className="text-xl font-bold text-[#1E2A5A] tracking-tight">The basics</h2>
                                            <p className="text-[13.5px] text-[#6B7394]">Your name, face, and one line that makes a student pick you.</p>
                                        </div>
                                        <div className="bg-white border border-[#E6E9F2] rounded-[22px] p-6 space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-[#22284A]">Profile photo</label>
                                                <div className="flex gap-5 items-center">
                                                    {avatarPreview ? (
                                                        <img
                                                            src={avatarPreview}
                                                            alt="Avatar"
                                                            className="w-[92px] height-[92px] h-[92px] rounded-[24px] object-cover flex-shrink-0 border border-[#E6E9F2]"
                                                        />
                                                    ) : (
                                                        <div className="w-[92px] h-[92px] rounded-[24px] flex-shrink-0 bg-gradient-to-br from-[#A9C6E8] to-[#EEF4FB] flex items-center justify-center font-bold text-3xl text-[#1E2A5A] bricolage-font">
                                                            {getInitials(auth.user.name || '')}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <label
                                                            className="inline-flex items-center gap-2 cursor-pointer border border-[#E6E9F2] rounded-full px-[18px] py-2.5 text-[13.5px] font-bold text-[#1E2A5A] bg-white transition hover:border-[#1E2A5A]"
                                                            htmlFor="photo-file"
                                                        >
                                                            <Upload className="w-3.5 h-3.5" />
                                                            Upload photo
                                                        </label>
                                                        <input
                                                            type="file"
                                                            name="avatar"
                                                            id="photo-file"
                                                            accept="image/*"
                                                            hidden
                                                            onChange={handleAvatarSelect}
                                                        />
                                                        <div className="text-[12.5px] text-[#6B7394] mt-2">
                                                            A clear, friendly photo of your face. No logos, no filters — students book people.
                                                        </div>
                                                        <InputError message={errors.avatar} className="mt-1" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-sm font-bold text-[#22284A]">
                                                    Display name <span className="font-normal text-[#6B7394] text-[12.5px] ml-1.5">shown as first name + initial</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    defaultValue={auth.user.name || auth.user.full_name || ''}
                                                    className="w-full border border-[#E6E9F2] rounded-[14px] px-4 py-3.5 text-base text-[#22284A] bg-white focus:outline-none focus:border-[#1E2A5A] focus:ring-3 focus:ring-[#A9C6E8]/35 transition-all"
                                                    required
                                                />
                                                <InputError message={errors.name} />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-sm font-bold text-[#22284A]">
                                                    Headline <span className="font-normal text-[#6B7394] text-[12.5px] ml-1.5">one sentence, shown under your name</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="headline"
                                                    value={headline}
                                                    onChange={(e) => setHeadline(e.target.value.substring(0, 90))}
                                                    placeholder="e.g. Helps shy speakers stop translating in their head — and just talk."
                                                    className="w-full border border-[#E6E9F2] rounded-[14px] px-4 py-3.5 text-base text-[#22284A] bg-white focus:outline-none focus:border-[#1E2A5A] focus:ring-3 focus:ring-[#A9C6E8]/35 transition-all"
                                                />
                                                <div className="text-[12px] text-[#6B7394] text-right mt-1">
                                                    {headline.length} / 90
                                                </div>
                                                <InputError message={errors.headline} />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-sm font-bold text-[#22284A]">About you</label>
                                                <textarea
                                                    name="bio"
                                                    value={bio}
                                                    onChange={(e) => setBio(e.target.value.substring(0, 600))}
                                                    placeholder="Why do you teach speaking? What are your sessions actually like? Write how you talk — students can tell."
                                                    className="w-full min-h-[110px] resize-y border border-[#E6E9F2] rounded-[14px] px-4 py-3.5 text-base text-[#22284A] bg-white focus:outline-none focus:border-[#1E2A5A] focus:ring-3 focus:ring-[#A9C6E8]/35 transition-all"
                                                />
                                                <div className="text-[12px] text-[#6B7394] text-right mt-1">
                                                    {bio.length} / 600
                                                </div>
                                                <InputError message={errors.bio} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Contact details (private) */}
                                    <div className="space-y-4 pt-4">
                                        <div>
                                            <h2 className="text-xl font-bold text-[#1E2A5A] tracking-tight">Contact details</h2>
                                            <p className="text-[13.5px] text-[#6B7394]">Never shown to students. Used only for your account and verification.</p>
                                        </div>
                                        <div className="bg-white border border-[#E6E9F2] rounded-[22px] p-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-bold text-[#22284A] flex items-center gap-2">
                                                        Email address
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6B7394] bg-[#F1F3F8] rounded-full px-2 py-0.5">
                                                            <Lock className="w-2.5 h-2.5" /> Private
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        defaultValue={auth.user.email}
                                                        className="w-full border border-[#E6E9F2] rounded-[14px] px-4 py-3.5 text-base text-[#22284A] bg-white focus:outline-none focus:border-[#1E2A5A] focus:ring-3 focus:ring-[#A9C6E8]/35 transition-all"
                                                        required
                                                    />
                                                    <InputError message={errors.email} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-bold text-[#22284A] flex items-center gap-2">
                                                        Phone number
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6B7394] bg-[#F1F3F8] rounded-full px-2 py-0.5">
                                                            <Lock className="w-2.5 h-2.5" /> Private
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        name="phone_number"
                                                        defaultValue={auth.user.teacher_profile?.phone_number || ''}
                                                        className="w-full border border-[#E6E9F2] rounded-[14px] px-4 py-3.5 text-base text-[#22284A] bg-white focus:outline-none focus:border-[#1E2A5A] focus:ring-3 focus:ring-[#A9C6E8]/35 transition-all"
                                                    />
                                                    <InputError message={errors.phone_number} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. Credentials */}
                                    <div className="space-y-4 pt-4">
                                        <div>
                                            <h2 className="text-xl font-bold text-[#1E2A5A] tracking-tight flex items-center gap-2">
                                                Credentials
                                                <span className="inline-block text-[11px] font-bold text-[#1E2A5A] bg-[#F7DE8B] rounded-full px-2.5 py-0.5">Verified by ConvoMate</span>
                                            </h2>
                                            <p className="text-[13.5px] text-[#6B7394]">Scores and certificates we check before showing your profile to students.</p>
                                        </div>
                                        <div className="bg-white border border-[#E6E9F2] rounded-[22px] p-6 space-y-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-bold text-[#22284A]">Overall IELTS band</label>
                                                    <input
                                                        type="text"
                                                        name="overall_level"
                                                        defaultValue={auth.user.teacher_profile?.overall_level || ''}
                                                        className="w-full border border-[#E6E9F2] rounded-[14px] px-4 py-3.5 text-base text-[#22284A] bg-white focus:outline-none focus:border-[#1E2A5A] focus:ring-3 focus:ring-[#A9C6E8]/35 transition-all"
                                                    />
                                                    <InputError message={errors.overall_level} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-bold text-[#22284A]">
                                                        Speaking band <span className="font-normal text-[#6B7394] text-[12.5px] ml-1">shown first</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="speaking_band"
                                                        defaultValue={auth.user.teacher_profile?.speaking_band || ''}
                                                        inputMode="decimal"
                                                        className="w-full border border-[#E6E9F2] rounded-[14px] px-4 py-3.5 text-base text-[#22284A] bg-white focus:outline-none focus:border-[#1E2A5A] focus:ring-3 focus:ring-[#A9C6E8]/35 transition-all"
                                                    />
                                                    <InputError message={errors.speaking_band} />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-bold text-[#22284A]">Teaching experience</label>
                                                    <input
                                                        type="text"
                                                        name="experience_years"
                                                        placeholder="e.g. 3 years"
                                                        defaultValue={auth.user.teacher_profile?.experience_years || ''}
                                                        className="w-full border border-[#E6E9F2] rounded-[14px] px-4 py-3.5 text-base text-[#22284A] bg-white focus:outline-none focus:border-[#1E2A5A] focus:ring-3 focus:ring-[#A9C6E8]/35 transition-all"
                                                    />
                                                    <InputError message={errors.experience_years} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-bold text-[#22284A]">
                                                        Current workplace <span className="font-normal text-[#6B7394] text-[12.5px] ml-1">optional</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="workplace"
                                                        placeholder="e.g. British Council"
                                                        defaultValue={auth.user.teacher_profile?.workplace || ''}
                                                        className="w-full border border-[#E6E9F2] rounded-[14px] px-4 py-3.5 text-base text-[#22284A] bg-white focus:outline-none focus:border-[#1E2A5A] focus:ring-3 focus:ring-[#A9C6E8]/35 transition-all"
                                                    />
                                                    <InputError message={errors.workplace} />
                                                </div>
                                            </div>

                                            {/* Rich Certificates Section */}
                                            <div className="space-y-3">
                                                <label className="text-sm font-bold text-[#22284A]">Certificates</label>
                                                <div className="space-y-3">
                                                    {certs.map((c, index) => (
                                                        <div
                                                            key={c.id}
                                                            className="flex flex-col sm:grid sm:grid-cols-[1fr_auto_auto] gap-3 items-stretch sm:items-center border border-[#E6E9F2] rounded-2xl p-3 bg-white"
                                                        >
                                                            <input
                                                                type="text"
                                                                name={`certificates[${index}][title]`}
                                                                value={c.title}
                                                                onChange={(e) => updateCertTitle(index, e.target.value)}
                                                                placeholder="e.g. IELTS Academic — British Council, 2025"
                                                                className="border-0 focus:ring-0 focus:outline-none p-1.5 font-bold text-sm text-[#22284A] bg-transparent"
                                                            />
                                                            <div className="flex gap-2 items-center self-end sm:self-auto">
                                                                {c.file_url ? (
                                                                    <a
                                                                        href={c.file_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#1E2A5A] hover:border-[#1E2A5A] border border-[#E6E9F2] rounded-full px-3 py-1.5 bg-white cursor-pointer select-none"
                                                                    >
                                                                        📎 {c.file_name || 'Document'}
                                                                    </a>
                                                                ) : (
                                                                    <label
                                                                        htmlFor={`file-input-${index}`}
                                                                        className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#1E2A5A] hover:border-[#1E2A5A] border border-[#E6E9F2] rounded-full px-3 py-1.5 bg-white cursor-pointer select-none"
                                                                    >
                                                                        📎 Attach File
                                                                    </label>
                                                                )}
                                                                <input
                                                                    type="file"
                                                                    name={`ielts_certificates[${index}]`}
                                                                    id={`file-input-${index}`}
                                                                    accept=".pdf,.png,.jpg,.jpeg,.svg,.webp,.gif"
                                                                    hidden
                                                                    onChange={(e) => handleCertFileSelect(index, e)}
                                                                />
                                                                {c.status === 'verified' ? (
                                                                    <span className="text-[11.5px] font-bold bg-[#F7DE8B] text-[#1E2A5A] rounded-full px-3 py-1.5 whitespace-nowrap">
                                                                        ✓ Verified
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[11.5px] font-bold bg-[#F1F3F8] text-[#6B7394] rounded-full px-3 py-1.5 whitespace-nowrap">
                                                                        Under review
                                                                    </span>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeCertificate(index)}
                                                                    className="p-1.5 text-red-500 hover:text-red-600 focus:outline-none"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                            {/* Hidden inputs to preserve S3 meta details if unchanged */}
                                                            <input type="hidden" name={`certificates[${index}][file_url]`} value={c.file_url || ''} />
                                                            <input type="hidden" name={`certificates[${index}][file_name]`} value={c.file_name || ''} />
                                                            <input type="hidden" name={`certificates[${index}][status]`} value={c.status || 'pending'} />
                                                        </div>
                                                    ))}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={addCertificate}
                                                    className="inline-flex items-center gap-1.5 font-bold text-[13.5px] text-[#1E2A5A] hover:underline bg-transparent border-0 cursor-pointer pt-1"
                                                >
                                                    <Plus className="w-4 h-4" /> Add another certificate
                                                </button>

                                                <div className="text-[12.5px] text-[#6B7394] bg-[#EEF4FB] rounded-xl p-3.5 mt-3 select-none">
                                                    Each certificate needs its document attached. Our team checks it within <b>2 business days</b> — verified certificates get a badge on your public profile.
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 4. Intro video */}
                                    <div className="space-y-4 pt-4">
                                        <div>
                                            <h2 className="text-xl font-bold text-[#1E2A5A] tracking-tight flex items-center gap-2">
                                                Intro video
                                                <span className="inline-block text-[11px] font-bold text-[#1E2A5A] bg-[#F7DE8B] rounded-full px-2.5 py-0.5">Required</span>
                                            </h2>
                                            <p className="text-[13.5px] text-[#6B7394]">The first thing students play. Unscripted, 30–90 seconds, just you saying hello.</p>
                                        </div>
                                        <div className="bg-white border border-[#E6E9F2] rounded-[22px] p-6 space-y-4">
                                            <label
                                                htmlFor="video-file"
                                                className="block border border-[#A9C6E8] border-dashed rounded-2xl bg-[#EEF4FB] p-7 text-center cursor-pointer hover:bg-[#E3EDF9] transition"
                                            >
                                                <div className="w-[52px] h-[52px] rounded-full bg-[#F7DE8B] mx-auto mb-3 flex items-center justify-center text-[#1E2A5A]">
                                                    <Play className="w-5 h-5 fill-current ml-0.5" />
                                                </div>
                                                <b className="text-base text-[#1E2A5A] block">Upload or record your intro</b>
                                                <span className="text-[13px] text-[#6B7394] block mt-1 max-w-[44ch] mx-auto">
                                                    MP4 or WebM, up to 100 MB. Phone camera is perfect — students trust real over polished.
                                                </span>
                                            </label>
                                            <input
                                                type="file"
                                                name="intro_video"
                                                id="video-file"
                                                accept="video/mp4,video/webm,video/quicktime"
                                                hidden
                                                onChange={handleVideoSelect}
                                            />
                                            {videoFileName && (
                                                <div className="text-xs font-bold text-[#1E2A5A]">
                                                    Selected file: {videoFileName}
                                                </div>
                                            )}
                                            {videoPreview && (
                                                <div className="relative aspect-video rounded-xl overflow-hidden border border-[#E6E9F2] bg-neutral-900 mt-2 max-w-sm">
                                                    <video src={videoPreview} controls className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="text-[13px] text-[#6B7394]">
                                                <b>What works:</b> say your name, why you teach, and what a session with you feels like. <b>Skip:</b> reading a script, listing certificates — they're already on your profile.
                                            </div>
                                            <InputError message={errors.intro_video} />
                                        </div>
                                    </div>

                                    {/* 5. Teaching focus */}
                                    <div className="space-y-4 pt-4">
                                        <div>
                                            <h2 className="text-xl font-bold text-[#1E2A5A] tracking-tight">What you offer</h2>
                                            <p className="text-[13.5px] text-[#6B7394]">Shown as tags on your profile. Pick only what you genuinely run sessions for.</p>
                                        </div>
                                        <div className="bg-white border border-[#E6E9F2] rounded-[22px] p-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                {[
                                                    { label: 'Freestyle conversation', val: 'freestyle' },
                                                    { label: 'Practice Q&A', val: 'practice q&a' },
                                                    { label: 'IELTS Speaking mock', val: 'mock' },
                                                    { label: 'Job interview prep', val: 'job interview prep' },
                                                    { label: 'Structured lessons', val: 'lessons' },
                                                    { label: 'Business English', val: 'business english' },
                                                ].map((tag) => {
                                                    const isChecked = labels.includes(tag.val);
                                                    return (
                                                        <label
                                                            key={tag.val}
                                                            className={`flex items-center gap-3 border rounded-2xl p-4 cursor-pointer select-none transition-all ${
                                                                isChecked
                                                                    ? 'border-[#1E2A5A] bg-[#EEF4FB]'
                                                                    : 'border-[#E6E9F2] bg-white hover:border-[#A9C6E8]'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                name="labels[]"
                                                                value={tag.val}
                                                                checked={isChecked}
                                                                onChange={() => toggleLabel(tag.val)}
                                                                className="hidden"
                                                            />
                                                            <div
                                                                className={`w-[22px] h-[22px] rounded-md border flex items-center justify-center transition-all ${
                                                                    isChecked
                                                                        ? 'bg-[#1E2A5A] border-[#1E2A5A]'
                                                                        : 'border-[#C9CFDE] bg-white'
                                                                }`}
                                                            >
                                                                <svg
                                                                    viewBox="0 0 16 16"
                                                                    fill="none"
                                                                    className={`w-3 h-3 stroke-white stroke-[3px] transition-opacity ${
                                                                        isChecked ? 'opacity-100' : 'opacity-0'
                                                                    }`}
                                                                >
                                                                    <path d="M3 8.5 L6.5 12 L13 4.5" strokeLinecap="round" />
                                                                </svg>
                                                            </div>
                                                            <span className="text-[14.5px] font-bold text-[#22284A]">{tag.label}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                            <InputError message={errors.labels} className="mt-2" />
                                        </div>
                                    </div>

                                    {/* 6. Price */}
                                    <div className="space-y-4 pt-4">
                                        <div>
                                            <h2 className="text-xl font-bold text-[#1E2A5A] tracking-tight">Your rate</h2>
                                            <p className="text-[13.5px] text-[#6B7394]">Per 30-minute session. You can change it anytime — existing bookings keep their price.</p>
                                        </div>
                                        <div className="bg-white border border-[#E6E9F2] rounded-[22px] p-6">
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-bold text-[#22284A]">Price per session</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={price}
                                                        onChange={(e) => setPrice(formatPrice(e.target.value))}
                                                        inputMode="numeric"
                                                        placeholder="45 000"
                                                        className="w-full border border-[#E6E9F2] rounded-[14px] pl-4 pr-28 py-3.5 text-base text-[#22284A] bg-white focus:outline-none focus:border-[#1E2A5A] focus:ring-3 focus:ring-[#A9C6E8]/35 transition-all"
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13.5px] text-[#6B7394] font-bold pointer-events-none">
                                                        so'm / 30 min
                                                    </span>
                                                    <input type="hidden" name="price" value={price.replace(/\s/g, '')} />
                                                </div>
                                                <div className="text-[12.5px] text-[#6B7394] mt-2 select-none">
                                                    Most teachers with your scores charge <b>40 000 – 60 000 so'm</b>. New teachers often start lower to collect first reviews.
                                                </div>
                                                <InputError message={errors.price} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 7. Availability */}
                                    <div className="space-y-4 pt-4">
                                        <div>
                                            <h2 className="text-xl font-bold text-[#1E2A5A] tracking-tight">Weekly availability</h2>
                                            <p className="text-[13.5px] text-[#6B7394]">Students only see and book the hours you open here. Times are Tashkent (UTC+5).</p>
                                        </div>
                                        <div className="bg-white border border-[#E6E9F2] rounded-[22px] p-6 divide-y divide-[#E6E9F2]">
                                            {daysOfWeek.map((day) => {
                                                const avail = avails[day];
                                                return (
                                                    <div key={day} className="py-3.5 flex items-center gap-4 flex-wrap select-none">
                                                        <span className="w-14 font-bold text-sm text-[#22284A] capitalize">
                                                            {day.substring(0, 3)}
                                                        </span>
                                                        <div className="relative w-[42px] h-6 flex-shrink-0">
                                                            <input
                                                                type="checkbox"
                                                                name={`availabilities[${day}][is_active]`}
                                                                id={`toggle-${day}`}
                                                                checked={avail.is_active}
                                                                onChange={() => toggleDay(day)}
                                                                value="1"
                                                                className="hidden"
                                                            />
                                                            <label
                                                                htmlFor={`toggle-${day}`}
                                                                className={`absolute inset-0 rounded-full cursor-pointer transition-colors duration-150 after:content-[""] after:absolute after:top-[3px] after:left-[3px] after:w-[18px] after:height-[18px] after:h-[18px] after:rounded-full after:bg-white after:shadow after:transition-all ${
                                                                    avail.is_active
                                                                        ? 'bg-[#1E2A5A] after:left-[21px]'
                                                                        : 'bg-[#DDE1EC]'
                                                                }`}
                                                            />
                                                        </div>

                                                        {avail.is_active ? (
                                                            <div className="flex items-center gap-2">
                                                                <select
                                                                    name={`availabilities[${day}][start_time]`}
                                                                    value={avail.start_time}
                                                                    onChange={(e) => updateDayTime(day, 'start_time', e.target.value)}
                                                                    className="w-auto border border-[#E6E9F2] rounded-xl px-3 py-1.5 text-[13.5px] text-[#22284A] bg-white focus:outline-none focus:border-[#1E2A5A]"
                                                                >
                                                                    {timeOptions.map((t) => (
                                                                        <option key={t} value={t}>
                                                                            {t}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <span className="text-[13.5px] text-[#6B7394] font-bold">—</span>
                                                                <select
                                                                    name={`availabilities[${day}][end_time]`}
                                                                    value={avail.end_time}
                                                                    onChange={(e) => updateDayTime(day, 'end_time', e.target.value)}
                                                                    className="w-auto border border-[#E6E9F2] rounded-xl px-3 py-1.5 text-[13.5px] text-[#22284A] bg-white focus:outline-none focus:border-[#1E2A5A]"
                                                                >
                                                                    {timeOptions.map((t) => (
                                                                        <option key={t} value={t}>
                                                                            {t}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[13px] text-[#6B7394] font-medium">Day off</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                // Original Pupil View Layout
                                <>
                                    {/* Section 1: Personal Profile Info */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                        <div className="lg:col-span-4 space-y-2">
                                            <h3 className="text-xl font-extrabold text-brand-navy">
                                                {t('profile.personal_profile') || 'Personal Profile'}
                                            </h3>
                                            <p className="text-sm font-medium text-brand-navy/65">
                                                {t('profile.personal_profile_desc') || 'Your name and email address used for communication.'}
                                            </p>
                                        </div>
                                        <div className="lg:col-span-8 p-8 bg-white rounded-[32px] border border-brand-pale-blue/30 shadow-ambient">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="flex flex-col gap-2">
                                                    <label htmlFor="name" className="font-bold text-brand-navy ml-1">
                                                        {t('profile.name')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="name"
                                                        className="w-full h-14 px-5 rounded-[16px] border border-brand-pale-blue bg-white focus:border-brand-navy focus:ring-0 focus:outline-none text-base"
                                                        defaultValue={auth.user.name || auth.user.full_name || ''}
                                                        name="name"
                                                        required
                                                        autoComplete="name"
                                                        placeholder={t('profile.fullname_placeholder')}
                                                    />
                                                    <InputError className="mt-1" message={errors.name} />
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <label htmlFor="email" className="font-bold text-brand-navy ml-1">
                                                        {t('profile.email')}
                                                    </label>
                                                    <input
                                                        type="email"
                                                        id="email"
                                                        className="w-full h-14 px-5 rounded-[16px] border border-brand-pale-blue bg-white focus:border-brand-navy focus:ring-0 focus:outline-none text-base"
                                                        defaultValue={auth.user.email}
                                                        name="email"
                                                        required
                                                        autoComplete="username"
                                                        placeholder={t('profile.email')}
                                                    />
                                                    <InputError className="mt-1" message={errors.email} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Pupil specific form */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-brand-pale-blue/20 pt-12">
                                        <div className="lg:col-span-4 space-y-2">
                                            <h3 className="text-xl font-extrabold text-brand-navy">
                                                {t('profile.pupil_info')}
                                            </h3>
                                            <p className="text-sm font-medium text-brand-navy/65">
                                                {t('profile.pupil_desc')}
                                            </p>
                                        </div>
                                        <div className="lg:col-span-8 p-8 bg-white rounded-[32px] border border-brand-pale-blue/30 shadow-ambient">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="flex flex-col gap-2">
                                                    <label htmlFor="age" className="font-bold text-brand-navy ml-1">
                                                        {t('profile.age')}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        id="age"
                                                        className="w-full h-14 px-5 rounded-[16px] border border-brand-pale-blue bg-white focus:border-brand-navy focus:ring-0 focus:outline-none text-base"
                                                        defaultValue={auth.user.pupil_profile?.age || ''}
                                                        name="age"
                                                        placeholder="e.g. 18"
                                                    />
                                                    <InputError className="mt-1" message={errors.age} />
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <label htmlFor="phone_number" className="font-bold text-brand-navy ml-1">
                                                        {t('profile.phone')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="phone_number"
                                                        className="w-full h-14 px-5 rounded-[16px] border border-brand-pale-blue bg-white focus:border-brand-navy focus:ring-0 focus:outline-none text-base"
                                                        defaultValue={auth.user.pupil_profile?.phone_number || ''}
                                                        name="phone_number"
                                                        placeholder="+998 90 123 4567"
                                                    />
                                                    <InputError className="mt-1" message={errors.phone_number} />
                                                </div>

                                                <div className="flex flex-col gap-2 md:col-span-2">
                                                    <label htmlFor="level" className="font-bold text-brand-navy ml-1">
                                                        {t('profile.target_level')}
                                                    </label>
                                                    <select
                                                        id="level"
                                                        name="level"
                                                        className="w-full h-14 px-5 rounded-[16px] border border-brand-pale-blue bg-white focus:border-brand-navy focus:ring-0 focus:outline-none text-base appearance-none"
                                                        defaultValue={auth.user.pupil_profile?.level || ''}
                                                    >
                                                        <option value="">{t('profile.select_level')}</option>
                                                        <option value="beginner">{t('profile.level_beginner')}</option>
                                                        <option value="pre-intermediate">{t('profile.level_pre_int')}</option>
                                                        <option value="upper-intermediate">{t('profile.level_upper_int')}</option>
                                                        <option value="advanced">{t('profile.level_advanced')}</option>
                                                        <option value="ielts_band">{t('profile.level_ielts')}</option>
                                                        <option value="cefr_band">{t('profile.level_cefr')}</option>
                                                    </select>
                                                    <InputError className="mt-1" message={errors.level} />
                                                </div>

                                                <div className="flex flex-col gap-2 md:col-span-2">
                                                    <label htmlFor="ielts_certificates" className="font-bold text-brand-navy ml-1">
                                                        Upload IELTS Certificate(s) (PDF or Image)
                                                    </label>
                                                    <input
                                                        type="file"
                                                        id="ielts_certificates"
                                                        name="ielts_certificates[]"
                                                        multiple
                                                        className="w-full h-14 px-5 rounded-[16px] border border-brand-pale-blue bg-white focus:border-brand-navy focus:ring-0 focus:outline-none text-base py-3"
                                                        accept=".pdf,.png,.jpg,.jpeg,.svg,.webp,.gif"
                                                    />
                                                    <InputError className="mt-1" message={errors.ielts_certificates} />

                                                    {pupilCerts.length > 0 && (
                                                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                            {pupilCerts.map((cert, index) => {
                                                                const isImg = isImageFile(cert);
                                                                const isPdf = isPdfFile(cert);
                                                                return (
                                                                    <div
                                                                        key={index}
                                                                        className="group relative flex flex-col overflow-hidden rounded-[20px] border border-brand-pale-blue/30 bg-neutral-50 p-3 transition-all hover:shadow-sm"
                                                                    >
                                                                        {isImg ? (
                                                                            <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-neutral-200">
                                                                                <img
                                                                                    src={cert}
                                                                                    alt="Certificate"
                                                                                    className="h-full w-full object-cover"
                                                                                />
                                                                                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                                                                    <a
                                                                                        href={cert}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="scale-90 rounded-lg bg-white/95 p-1.5 text-slate-800 transition-all group-hover:scale-100 hover:bg-white"
                                                                                    >
                                                                                        <ExternalLink className="h-4 w-4" />
                                                                                    </a>
                                                                                </div>
                                                                            </div>
                                                                        ) : isPdf ? (
                                                                            <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-brand-pale-blue/30 bg-white">
                                                                                <iframe
                                                                                    src={`${cert}#toolbar=0&navpanes=0`}
                                                                                    className="pointer-events-none h-full w-full border-0"
                                                                                />
                                                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 p-2 text-center opacity-0 transition-opacity group-hover:opacity-100">
                                                                                    <span className="mb-1 max-w-full truncate px-2 text-[10px] font-semibold text-white">
                                                                                        {cert.substring(cert.lastIndexOf('/') + 1)}
                                                                                    </span>
                                                                                    <a
                                                                                        href={cert}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="scale-90 rounded-lg bg-white/95 p-1.5 text-slate-800 transition-all group-hover:scale-100 hover:bg-white"
                                                                                    >
                                                                                        <ExternalLink className="h-4 w-4" />
                                                                                    </a>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex aspect-video w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-brand-pale-blue bg-white p-2">
                                                                                <FileText className="h-8 w-8 text-brand-navy/60" />
                                                                                <span className="max-w-full truncate px-2 text-[10px] font-bold text-brand-navy/80">
                                                                                    {cert.substring(cert.lastIndexOf('/') + 1)}
                                                                                </span>
                                                                                <a
                                                                                    href={cert}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="flex items-center gap-1 text-[10px] font-bold text-brand-navy hover:underline"
                                                                                >
                                                                                    View Document <ExternalLink className="h-3 w-3" />
                                                                                </a>
                                                                            </div>
                                                                        )}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setPupilCerts((prev) => prev.filter((_, i) => i !== index))
                                                                            }
                                                                            className="absolute top-2.5 right-2.5 rounded-full bg-red-500 p-1.5 text-white opacity-0 shadow transition-all group-hover:opacity-100 hover:bg-red-600 focus:opacity-100 focus:outline-none"
                                                                        >
                                                                            <Trash2 className="h-3 w-3" />
                                                                        </button>
                                                                        <input type="hidden" name="existing_certificates[]" value={cert} />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Section 3: Verification status warning & Submit action bar */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-brand-pale-blue/20 pt-8 mt-8">
                                <div className="lg:col-span-4">
                                    {mustVerifyEmail && auth.user.email_verified_at === null && (
                                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                                            <p className="text-sm font-semibold text-amber-800">
                                                {t('profile.email_unverified')}{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="underline font-bold text-amber-900 hover:text-amber-950 transition-colors"
                                                >
                                                    {t('profile.resend_btn')}
                                                </Link>
                                            </p>
                                            {status === 'verification-link-sent' && (
                                                <div className="mt-2 text-xs font-bold text-emerald-700">
                                                    {t('profile.resend_sent')}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="lg:col-span-8 flex justify-end items-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => window.location.reload()}
                                        className="px-8 py-3.5 rounded-full font-bold text-sm text-[#1E2A5A] hover:bg-neutral-100 transition-all cursor-pointer bg-transparent border-0"
                                    >
                                        Discard Changes
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-12 py-4 rounded-full font-bold text-sm bg-[#F7DE8B] text-[#1E2A5A] shadow-lg hover:shadow-xl hover:translate-y-[-2px] active:scale-95 duration-200 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none border-0"
                                        data-test="update-profile-button"
                                    >
                                        {t('profile.save')}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </Form>

                {/* Section 4: Delete Account */}
                <div className="max-w-[760px] mx-auto px-4 pb-20">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-brand-pale-blue/20 pt-12">
                        <div className="lg:col-span-4 space-y-2">
                            <h3 className="text-xl font-extrabold text-red-600">Delete Account</h3>
                            <p className="text-sm font-medium text-[#6B7394]">
                                Permanently delete your account and all of its resources.
                            </p>
                        </div>
                        <div className="lg:col-span-8 p-8 bg-white rounded-[32px] border border-brand-pale-blue/30 shadow-ambient">
                            <DeleteUser />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
