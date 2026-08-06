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
            gender?: string;
            teacher_profile?: {
                is_verified?: boolean;
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
                certificates?: Array<{ title: string; file_url: string; file_name?: string; status?: string }> | string[];
                headline?: string;
                bio?: string;
                target_overall_band?: string | number;
                target_speaking_band?: string | number;
                labels?: string[];
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

    // Helper to safely parse JSON or array values
    const safeParseArray = (raw: any): any[] => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'string') {
            try {
                const parsed = JSON.parse(raw);
                return Array.isArray(parsed) ? parsed : [raw];
            } catch {
                return [raw];
            }
        }
        return [];
    };

    // --- Pupil specific logic ---
    const initialPupilCerts = React.useMemo(() => {
        const rawCerts = auth.user.pupil_profile?.certificates ?? [];
        return safeParseArray(rawCerts).map((c: any, index: number) => {
            if (typeof c === 'string') {
                const isUrl = c.startsWith('http') || c.startsWith('/storage');
                return {
                    id: index,
                    title: isUrl ? '' : c,
                    file_url: isUrl ? c : null,
                    file_name: isUrl ? (c.includes('/') ? c.substring(c.lastIndexOf('/') + 1) : c) : '',
                    status: 'verified',
                };
            }
            return {
                id: index,
                title: String(c?.title ?? ''),
                file_url: c?.file_url ? String(c.file_url) : null,
                file_name: String(c?.file_name ?? ''),
                status: String(c?.status ?? 'pending'),
            };
        });
    }, [auth.user]);

    const [pupilCerts, setPupilCerts] = React.useState(initialPupilCerts);

    const addPupilCertificate = () => {
        setPupilCerts((prev) => [
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

    const updatePupilCertTitle = (index: number, title: string) => {
        setPupilCerts((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], title };
            return next;
        });
    };

    const handlePupilCertFileSelect = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPupilCerts((prev) => {
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

    const removePupilCertificate = (index: number) => {
        setPupilCerts((prev) => (Array.isArray(prev) ? prev.filter((_, i) => i !== index) : []));
    };

    const [pupilHeadline, setPupilHeadline] = React.useState(auth.user.pupil_profile?.headline ?? '');
    const [pupilBio, setPupilBio] = React.useState(auth.user.pupil_profile?.bio ?? '');
    const [targetOverallBand, setTargetOverallBand] = React.useState(auth.user.pupil_profile?.target_overall_band ?? '');
    const [targetSpeakingBand, setTargetSpeakingBand] = React.useState(auth.user.pupil_profile?.target_speaking_band ?? '');
    
    const initialPupilLabels = React.useMemo(() => {
        return safeParseArray(auth.user.pupil_profile?.labels).filter((x): x is string => typeof x === 'string');
    }, [auth.user]);
    const [pupilLabels, setPupilLabels] = React.useState<string[]>(initialPupilLabels);

    const togglePupilLabel = (val: string) => {
        setPupilLabels((prev) => {
            const safePrev = Array.isArray(prev) ? prev : [];
            return safePrev.includes(val) ? safePrev.filter((x) => x !== val) : [...safePrev, val];
        });
    };

    // --- Teacher specific logic ---
    const initialTeacherCerts = React.useMemo(() => {
        const rawCerts = auth.user.teacher_profile?.certificates ?? [];
        const parsed = safeParseArray(rawCerts);

        const profileOverall = auth.user.teacher_profile?.overall_level
            ? String(auth.user.teacher_profile.overall_level).replace(/[^0-9.]/g, '')
            : '';
        const profileSpeaking = auth.user.teacher_profile?.speaking_band
            ? String(auth.user.teacher_profile.speaking_band)
            : profileOverall;

        if (parsed.length === 0 && (profileOverall || profileSpeaking)) {
            return [
                {
                    id: 0,
                    isExisting: true,
                    type: 'ielts',
                    custom_type_name: '',
                    title: 'IELTS (Academic / General)',
                    overall: profileOverall || profileSpeaking,
                    listening: profileOverall || profileSpeaking,
                    reading: profileOverall || profileSpeaking,
                    writing: profileOverall || profileSpeaking,
                    speaking: profileSpeaking || profileOverall,
                    file_url: null,
                    file_name: '',
                    status: 'verified',
                },
            ];
        }

        return parsed.map((c: any, index: number) => {
            if (typeof c === 'string') {
                const isUrl = c.startsWith('http') || c.startsWith('/storage');
                return {
                    id: index,
                    isExisting: true,
                    type: 'ielts',
                    custom_type_name: '',
                    title: isUrl ? 'IELTS (Academic / General)' : c,
                    overall: profileOverall || profileSpeaking,
                    listening: profileOverall || profileSpeaking,
                    reading: profileOverall || profileSpeaking,
                    writing: profileOverall || profileSpeaking,
                    speaking: profileSpeaking || profileOverall,
                    file_url: isUrl ? c : null,
                    file_name: isUrl ? (c.includes('/') ? c.substring(c.lastIndexOf('/') + 1) : c) : '',
                    status: 'verified',
                };
            }

            const overallVal = String(c?.overall ?? '') || profileOverall || profileSpeaking;
            const speakingVal = String(c?.speaking ?? '') || profileSpeaking || overallVal;

            return {
                id: index,
                isExisting: true,
                type: String(c?.type ?? 'ielts'),
                custom_type_name: String(c?.custom_type_name ?? ''),
                title: String(c?.title ?? ''),
                overall: overallVal,
                listening: String(c?.listening ?? '') || overallVal,
                reading: String(c?.reading ?? '') || overallVal,
                writing: String(c?.writing ?? '') || overallVal,
                speaking: speakingVal,
                file_url: c?.file_url ? String(c.file_url) : null,
                file_name: String(c?.file_name ?? ''),
                status: String(c?.status ?? 'pending'),
            };
        });
    }, [auth.user]);

    const [certs, setCerts] = React.useState(initialTeacherCerts);

    React.useEffect(() => {
        setCerts(initialTeacherCerts);
    }, [initialTeacherCerts]);

    const addCertificate = () => {
        setCerts((prev) => [
            ...prev,
            {
                id: Date.now(),
                isExisting: false, // New certificate: editable scores!
                type: 'ielts',
                custom_type_name: '',
                title: 'IELTS (Academic / General)',
                overall: '',
                listening: '',
                reading: '',
                writing: '',
                speaking: '',
                file_url: null,
                file_name: '',
                status: 'pending',
            },
        ]);
    };

    const updateCertField = (index: number, field: string, value: string) => {
        setCerts((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
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
    const initialTeacherLabels = React.useMemo(() => {
        return safeParseArray(auth.user.teacher_profile?.labels).filter((x): x is string => typeof x === 'string');
    }, [auth.user]);
    const [labels, setLabels] = React.useState<string[]>(initialTeacherLabels);

    const toggleLabel = (val: string) => {
        setLabels((prev) => {
            const safePrev = Array.isArray(prev) ? prev : [];
            return safePrev.includes(val) ? safePrev.filter((x) => x !== val) : [...safePrev, val];
        });
    };

    // Hourly Rate
    const [price, setPrice] = React.useState(() => {
        const p = auth.user.teacher_profile?.price;
        if (p === null || p === undefined) {
            return '';
        }
        return String(p).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    });

    const formatPrice = (val: string) => {
        const clean = val.replace(/\D/g, '');
        return clean ? clean.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '';
    };



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

            {/* Mockup styles */}

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
                    .teacher-settings-container .hero {
                      background: var(--navy); border-radius: var(--radius); padding: 34px 34px 30px;
                      position: relative; overflow: hidden; margin-bottom: 26px;
                    }
                    .teacher-settings-container .hero .eyebrow { color: var(--butter); font-size: 12px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
                    .teacher-settings-container .hero h1 { color: #fff; font-size: 34px; font-weight: 800; letter-spacing: -0.8px; margin-top: 6px; }
                    .teacher-settings-container .hero p { color: var(--blue); font-size: 15px; margin-top: 4px; }
                    .teacher-settings-container .hero .naqsh { position: absolute; right: 22px; top: 50%; transform: translateY(-50%); width: 90px; height: 90px; opacity: .35; }
                    .teacher-settings-container .preview-link {
                      display: inline-flex; align-items: center; gap: 7px; margin-top: 16px;
                      background: rgba(255,255,255,.08); border: 1px solid rgba(169,198,232,.35);
                      color: #fff; font-size: 13px; font-weight: 600; padding: 8px 16px; border-radius: 999px;
                      text-decoration: none; transition: background .15s;
                    }
                    .teacher-settings-container .preview-link:hover { background: rgba(255,255,255,.16); }
                    .teacher-settings-container .preview-link svg { width: 13px; height: 13px; stroke: var(--butter); }
                    .teacher-settings-container .tabs { display: flex; gap: 24px; border-bottom: 1px solid var(--line); margin-bottom: 28px; }
                    .teacher-settings-container .tab {
                      padding: 10px 2px 12px; font-size: 15px; font-weight: 600; color: var(--muted);
                      cursor: pointer; border-bottom: 2.5px solid transparent; margin-bottom: -1px;
                    }
                    .teacher-settings-container .tab.active { color: var(--navy); border-color: var(--butter-deep); }
                    .teacher-settings-container .tab:hover:not(.active) { color: var(--ink); }
                    .teacher-settings-container .sec { margin-bottom: 34px; }
                    .teacher-settings-container .sec-head { margin-bottom: 14px; }
                    .teacher-settings-container .sec-head h2 { font-size: 19px; font-weight: 700; color: var(--navy); letter-spacing: -0.3px; }
                    .teacher-settings-container .sec-head p { font-size: 13.5px; color: var(--muted); margin-top: 3px; }
                    .teacher-settings-container .sec-head .req {
                      display: inline-block; font-size: 11px; font-weight: 700; color: var(--navy);
                      background: var(--butter); border-radius: 999px; padding: 3px 10px; margin-left: 8px; vertical-align: 2px;
                    }
                    .teacher-settings-container .card {
                      background: #fff; border: 1px solid var(--line); border-radius: var(--radius); padding: 26px;
                    }
                    .teacher-settings-container .field { margin-bottom: 20px; }
                    .teacher-settings-container .field:last-child { margin-bottom: 0; }
                    .teacher-settings-container label { display: block; font-size: 14px; font-weight: 700; color: var(--ink); margin-bottom: 7px; }
                    .teacher-settings-container label .hint { font-weight: 500; color: var(--muted); font-size: 12.5px; margin-left: 6px; }
                    .teacher-settings-container .private-tag {
                      display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700;
                      color: var(--muted); background: #F1F3F8; border-radius: 999px; padding: 3px 9px; margin-left: 8px; vertical-align: 1px;
                    }
                    .teacher-settings-container .private-tag svg { width: 10px; height: 10px; stroke: var(--muted); }
                    .teacher-settings-container input[type=text],
                    .teacher-settings-container input[type=email],
                    .teacher-settings-container input[type=tel],
                    .teacher-settings-container input[type=number],
                    .teacher-settings-container textarea,
                    .teacher-settings-container select {
                      width: 100%; border: 1px solid var(--line); border-radius: 14px; padding: 13px 16px;
                      font-family: 'Schibsted Grotesk', sans-serif; font-size: 15px; color: var(--ink); background: #fff;
                      transition: border-color .15s, box-shadow .15s;
                    }
                    .teacher-settings-container input:focus,
                    .teacher-settings-container textarea:focus,
                    .teacher-settings-container select:focus {
                      outline: none; border-color: var(--navy); box-shadow: 0 0 0 3px rgba(169,198,232,.35);
                    }
                    .teacher-settings-container input::placeholder,
                    .teacher-settings-container textarea::placeholder { color: #A6ACC4; }
                    .teacher-settings-container textarea { resize: vertical; min-height: 110px; }
                    .teacher-settings-container .char-count { font-size: 12px; color: var(--muted); text-align: right; margin-top: 5px; }
                    .teacher-settings-container .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                    @media(max-width:560px){.teacher-settings-container .row2 { grid-template-columns: 1fr; }}
                    .teacher-settings-container .photo-row { display: flex; gap: 20px; align-items: center; }
                    .teacher-settings-container .photo-preview {
                      width: 92px; height: 92px; border-radius: 24px; flex-shrink: 0;
                      background: linear-gradient(135deg, var(--blue), var(--blue-tint));
                      display: flex; align-items: center; justify-content: center;
                      font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 30px; color: var(--navy);
                    }
                    .teacher-settings-container .upload-btn {
                      display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
                      border: 1.5px solid var(--line); border-radius: 999px; padding: 10px 18px;
                      font-size: 13.5px; font-weight: 700; color: var(--navy); background: #fff; transition: border-color .15s;
                    }
                    .teacher-settings-container .upload-btn:hover { border-color: var(--navy); }
                    .teacher-settings-container .upload-btn svg { width: 14px; height: 14px; stroke: var(--navy); }
                    .teacher-settings-container .photo-note { font-size: 12.5px; color: var(--muted); margin-top: 8px; }
                    .teacher-settings-container .cert-row {
                      display: grid; grid-template-columns: 1fr auto auto auto; gap: 12px; align-items: center;
                      border: 1px solid var(--line); border-radius: 16px; padding: 12px 14px; margin-bottom: 10px; background: #fff;
                    }
                    .teacher-settings-container .cert-row input { border: none; padding: 6px 4px; font-weight: 600; }
                    .teacher-settings-container .cert-row input:focus { box-shadow: none; }
                    .teacher-settings-container .cert-status {
                      font-size: 11.5px; font-weight: 700; padding: 5px 11px; border-radius: 999px; white-space: nowrap;
                    }
                    .teacher-settings-container .cert-status.verified { background: var(--butter); color: var(--navy); }
                    .teacher-settings-container .cert-status.pending { background: #F1F3F8; color: var(--muted); }
                    .teacher-settings-container .cert-file {
                      font-size: 12.5px; font-weight: 600; color: var(--navy); cursor: pointer; white-space: nowrap;
                      border: 1px solid var(--line); border-radius: 999px; padding: 6px 13px;
                    }
                    .teacher-settings-container .cert-file:hover { border-color: var(--navy); }
                    .teacher-settings-container .add-cert {
                      display: inline-flex; align-items: center; gap: 7px; font-size: 13.5px; font-weight: 700; color: var(--navy);
                      background: none; border: none; cursor: pointer; margin-top: 4px; font-family: inherit;
                    }
                    .teacher-settings-container .add-cert:hover { text-decoration: underline; }
                    .teacher-settings-container .verify-note {
                      margin-top: 14px; font-size: 12.5px; color: var(--muted); background: var(--blue-tint);
                      border-radius: 12px; padding: 11px 14px;
                    }
                    .teacher-settings-container .verify-note b { color: var(--navy); }
                    @media(max-width:560px){.teacher-settings-container .cert-row { grid-template-columns: 1fr; gap: 8px; }}
                    .teacher-settings-container .focus-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                    @media(max-width:560px){.teacher-settings-container .focus-grid { grid-template-columns: 1fr; }}
                    .teacher-settings-container .check {
                      display: flex; align-items: center; gap: 12px; border: 1px solid var(--line); border-radius: 16px;
                      padding: 14px 16px; cursor: pointer; transition: all .15s; background: #fff; user-select: none;
                    }
                    .teacher-settings-container .check:hover { border-color: var(--blue); }
                    .teacher-settings-container .check input { display: none; }
                    .teacher-settings-container .box {
                      width: 22px; height: 22px; border-radius: 7px; border: 1.5px solid #C9CFDE; flex-shrink: 0;
                      display: flex; items-center: center; justify-content: center; transition: all .15s;
                    }
                    .teacher-settings-container .box svg { width: 12px; height: 12px; stroke: #fff; stroke-width: 3; opacity: 0; }
                    .teacher-settings-container .check input:checked ~ .box { background: var(--navy); border-color: var(--navy); }
                    .teacher-settings-container .check input:checked ~ .box svg { opacity: 1; }
                    .teacher-settings-container .check input:checked ~ .check-label { color: var(--navy); }
                    .teacher-settings-container .check.checked { border-color: var(--navy); background: var(--blue-tint); }
                    .teacher-settings-container .check-label { font-size: 14.5px; font-weight: 600; }
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
                                        <div className="bg-white border border-[#E6E9F2] rounded-[22px] p-6 space-y-4">
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
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-bold text-[#22284A]">
                                                        {t('auth.gender')}
                                                    </label>
                                                    <select
                                                        name="gender"
                                                        defaultValue={String(auth.user.gender || 'prefer_not_to_say')}
                                                        className="w-full border border-[#E6E9F2] rounded-[14px] px-4 py-3.5 text-base text-[#22284A] bg-white focus:outline-none focus:border-[#1E2A5A] focus:ring-3 focus:ring-[#A9C6E8]/35 transition-all"
                                                    >
                                                        <option value="male">{t('auth.gender_male')}</option>
                                                        <option value="female">{t('auth.gender_female')}</option>
                                                        <option value="prefer_not_to_say">{t('auth.gender_prefer_not_to_say')}</option>
                                                    </select>
                                                    <InputError message={errors.gender} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. Credentials */}
                                    <div className="space-y-4 pt-4">
                                        <div>
                                            <h2 className="text-xl font-bold text-[#1E2A5A] tracking-tight flex items-center gap-2">
                                                Credentials
                                                {auth.user.teacher_profile?.is_verified && (
                                                    <span className="inline-block text-[11px] font-bold text-[#1E2A5A] bg-[#F7DE8B] rounded-full px-2.5 py-0.5">
                                                        Verified by ConvoMate
                                                    </span>
                                                )}
                                            </h2>
                                            <p className="text-[13.5px] text-[#6B7394]">Scores and certificates we check before showing your profile to students.</p>
                                        </div>
                                        <div className="bg-white border border-[#E6E9F2] rounded-[22px] p-6 space-y-6">
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

                                            {/* Language Certificates & Scores Section */}
                                            <div className="space-y-4 pt-2">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <label className="text-base font-extrabold text-[#1E2A5A]">Language Certificates & Scores</label>
                                                        <p className="text-xs text-[#6B7394]">Provide official band scores and upload certificate document credentials.</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={addCertificate}
                                                        className="inline-flex items-center gap-1 font-bold text-xs text-[#1E2A5A] hover:bg-[#EEF4FB] border border-[#E6E9F2] rounded-xl px-3 py-1.5 bg-white cursor-pointer transition"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" /> Add Certificate
                                                    </button>
                                                </div>

                                                <div className="space-y-4">
                                                    {certs.map((c, index) => (
                                                        <div
                                                            key={c.id || index}
                                                            className="border border-[#E6E9F2] rounded-2xl p-4 bg-white space-y-3.5 shadow-sm"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-bold text-[#1E2A5A] bg-[#EEF4FB] px-2.5 py-1 rounded-lg">
                                                                        Certificate #{index + 1}
                                                                    </span>
                                                                    {c.status === 'verified' ? (
                                                                        <span className="text-[11px] font-bold bg-[#F7DE8B] text-[#1E2A5A] rounded-full px-2.5 py-0.5">
                                                                            ✓ Verified
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[11px] font-bold bg-[#F1F3F8] text-[#6B7394] rounded-full px-2.5 py-0.5">
                                                                            Under review
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeCertificate(index)}
                                                                    className="p-1 text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" /> Delete Certificate
                                                                </button>
                                                            </div>

                                                            <div className="space-y-3">
                                                                <div>
                                                                    <label className="text-xs font-bold text-[#22284A]">Certificate Type</label>
                                                                    <select
                                                                        name={`certificates[${index}][type]`}
                                                                        disabled={Boolean(c.isExisting)}
                                                                        value={c.type || 'ielts'}
                                                                        onChange={(e) => updateCertField(index, 'type', e.target.value)}
                                                                        className={`mt-1 block w-full rounded-xl border border-[#E6E9F2] px-3 py-2 text-xs font-bold text-[#22284A] ${
                                                                            c.isExisting ? 'bg-[#F4F6FB] cursor-not-allowed' : 'bg-white focus:border-[#1E2A5A] focus:outline-none'
                                                                        }`}
                                                                    >
                                                                        <option value="other">Other Certificate</option>
                                                                        <option value="ielts">IELTS (Academic / General)</option>
                                                                        <option value="cefr">CEFR / Multilevel</option>
                                                                        <option value="toefl">TOEFL</option>
                                                                    </select>
                                                                    {c.isExisting && (
                                                                        <input type="hidden" name={`certificates[${index}][type]`} value={c.type || 'ielts'} />
                                                                    )}
                                                                </div>

                                                                {c.type === 'other' && (
                                                                    <div>
                                                                        <input
                                                                            type="text"
                                                                            name={`certificates[${index}][custom_type_name]`}
                                                                            readOnly={Boolean(c.isExisting)}
                                                                            value={c.custom_type_name || ''}
                                                                            onChange={(e) => updateCertField(index, 'custom_type_name', e.target.value)}
                                                                            placeholder="Enter certificate name (e.g. Duolingo, Cambridge C1, PTE)"
                                                                            className={`w-full border border-[#E6E9F2] rounded-xl px-3 py-2 text-xs font-medium text-[#22284A] ${
                                                                                c.isExisting ? 'bg-[#F4F6FB] cursor-not-allowed' : 'bg-white focus:outline-none focus:border-[#1E2A5A]'
                                                                            }`}
                                                                        />
                                                                    </div>
                                                                )}

                                                                 <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                                                                    <div>
                                                                        <label className="text-[11px] font-bold text-[#6B7394]">
                                                                            Overall
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            name={`certificates[${index}][overall]`}
                                                                            readOnly={Boolean(c.isExisting)}
                                                                            value={c.overall || ''}
                                                                            onChange={(e) => updateCertField(index, 'overall', e.target.value)}
                                                                            placeholder="e.g. 7.5"
                                                                            className={`mt-1 w-full border border-[#E6E9F2] rounded-lg px-2.5 py-1.5 text-xs text-[#22284A] font-bold ${
                                                                                c.isExisting ? 'bg-[#F4F6FB] cursor-not-allowed' : 'bg-white focus:border-[#1E2A5A]'
                                                                            }`}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[11px] font-bold text-[#6B7394]">
                                                                            Listening
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            name={`certificates[${index}][listening]`}
                                                                            readOnly={Boolean(c.isExisting)}
                                                                            value={c.listening || ''}
                                                                            onChange={(e) => updateCertField(index, 'listening', e.target.value)}
                                                                            placeholder="e.g. 8.0"
                                                                            className={`mt-1 w-full border border-[#E6E9F2] rounded-lg px-2.5 py-1.5 text-xs text-[#22284A] ${
                                                                                c.isExisting ? 'bg-[#F4F6FB] cursor-not-allowed' : 'bg-white focus:border-[#1E2A5A]'
                                                                            }`}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[11px] font-bold text-[#6B7394]">
                                                                            Reading
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            name={`certificates[${index}][reading]`}
                                                                            readOnly={Boolean(c.isExisting)}
                                                                            value={c.reading || ''}
                                                                            onChange={(e) => updateCertField(index, 'reading', e.target.value)}
                                                                            placeholder="e.g. 7.0"
                                                                            className={`mt-1 w-full border border-[#E6E9F2] rounded-lg px-2.5 py-1.5 text-xs text-[#22284A] ${
                                                                                c.isExisting ? 'bg-[#F4F6FB] cursor-not-allowed' : 'bg-white focus:border-[#1E2A5A]'
                                                                            }`}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[11px] font-bold text-[#6B7394]">
                                                                            Writing
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            name={`certificates[${index}][writing]`}
                                                                            readOnly={Boolean(c.isExisting)}
                                                                            value={c.writing || ''}
                                                                            onChange={(e) => updateCertField(index, 'writing', e.target.value)}
                                                                            placeholder="e.g. 6.5"
                                                                            className={`mt-1 w-full border border-[#E6E9F2] rounded-lg px-2.5 py-1.5 text-xs text-[#22284A] ${
                                                                                c.isExisting ? 'bg-[#F4F6FB] cursor-not-allowed' : 'bg-white focus:border-[#1E2A5A]'
                                                                            }`}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[11px] font-bold text-[#6B7394]">
                                                                            Speaking
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            name={`certificates[${index}][speaking]`}
                                                                            readOnly={Boolean(c.isExisting)}
                                                                            value={c.speaking || ''}
                                                                            onChange={(e) => updateCertField(index, 'speaking', e.target.value)}
                                                                            placeholder="e.g. 8.5"
                                                                            className={`mt-1 w-full border border-[#E6E9F2] rounded-lg px-2.5 py-1.5 text-xs text-[#22284A] ${
                                                                                c.isExisting ? 'bg-[#F4F6FB] cursor-not-allowed' : 'bg-white focus:border-[#1E2A5A]'
                                                                            }`}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {c.isExisting ? (
                                                                    <p className="text-[11px] text-[#6B7394] italic flex items-center gap-1">
                                                                        🔒 Verified registration scores are locked. New certificates added below can be assigned band scores.
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-[11px] text-[#1D9E75] font-semibold flex items-center gap-1">
                                                                        ✎ Enter official band scores for this new certificate before saving.
                                                                    </p>
                                                                )}

                                                                <div>
                                                                    <label className="text-[11px] font-bold text-[#6B7394] block mb-1.5">Certificate Document Credential</label>
                                                                    <div className="flex items-center gap-3 flex-wrap">
                                                                        <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EEF4FB] hover:bg-[#E2ECF8] border border-[#D5E2F2] text-xs font-bold text-[#1E2A5A] cursor-pointer shadow-sm transition">
                                                                            <Upload className="w-4 h-4 text-[#1E2A5A]" />
                                                                            <span>Upload Certificate Document (PDF or Image)</span>
                                                                            <input
                                                                                type="file"
                                                                                name={`certificate_files[${index}]`}
                                                                                accept=".pdf,.png,.jpg,.jpeg,.svg,.webp,.gif"
                                                                                onChange={(e) => handleCertFileSelect(index, e)}
                                                                                className="hidden"
                                                                            />
                                                                        </label>
                                                                        {c.file_name ? (
                                                                            <span className="text-xs font-semibold text-[#1D9E75] bg-[#E8F8F3] border border-[#B3E8D7] rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                                                                                ✓ File Attached: {c.file_name}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-xs text-[#6B7394] italic">
                                                                                No file attached yet
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <input type="hidden" name={`certificates[${index}][title]`} value={c.title || c.custom_type_name || c.type} />
                                                            <input type="hidden" name={`certificates[${index}][file_url]`} value={c.file_url || ''} />
                                                            <input type="hidden" name={`certificates[${index}][file_name]`} value={c.file_name || ''} />
                                                            <input type="hidden" name={`certificates[${index}][status]`} value={c.status || 'pending'} />
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="text-[12.5px] text-[#6B7394] bg-[#EEF4FB] rounded-xl p-3.5 select-none">
                                                    Each certificate is reviewed by platform admins within <b>2 business days</b>.
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
                                                <label className="text-sm font-bold text-[#22284A]">Price per session <span className="text-xs font-normal text-[#6B7394] ml-1">(optional)</span></label>
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


                                </>
                            ) : (
                                // Redesigned Pupil View Layout
                                <>
                                    {/* Eyebrow & Hero Header */}
                                    <div className="hero shadow-md">
                                        <svg className="naqsh" viewBox="0 0 80 80" fill="none" stroke="#A9C6E8" strokeWidth="1.1">
                                            <path d="M40 6 L52 28 L74 40 L52 52 L40 74 L28 52 L6 40 L28 28 Z"/>
                                            <path d="M40 20 L47 33 L60 40 L47 47 L40 60 L33 47 L20 40 L33 33 Z"/>
                                            <circle cx="40" cy="40" r="5"/>
                                        </svg>
                                        <div className="eyebrow">Pupil settings</div>
                                        <h1>Your profile</h1>
                                        <p>Customize how teachers and conversation partners see you during matching.</p>
                                    </div>

                                    {/* Tabs */}
                                    <div className="tabs">
                                        <Link href="/settings/profile" className="tab active">Profile</Link>
                                        <Link href="/settings/security" className="tab">Security</Link>
                                        <Link href="/settings/appearance" className="tab">Appearance</Link>
                                    </div>

                                    {/* 1. Basics */}
                                    <div className="sec">
                                        <div className="sec-head">
                                            <h2>The basics</h2>
                                            <p>Your name, photo, and one line about your conversation style or goal.</p>
                                        </div>
                                        <div className="card shadow-sm">
                                            <div className="field">
                                                <label>Profile picture</label>
                                                <div className="photo-row">
                                                    {avatarPreview ? (
                                                        <img
                                                            src={avatarPreview}
                                                            alt="Avatar"
                                                            className="w-[92px] h-[92px] rounded-[24px] object-cover flex-shrink-0 border border-[#E6E9F2]"
                                                        />
                                                    ) : (
                                                        <div className="photo-preview">
                                                            {getInitials(auth.user.name || auth.user.full_name || '')}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <label className="upload-btn" htmlFor="photo-file">
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
                                                        <div className="photo-note">
                                                            Use a clear picture of yourself, or choose from our default presets.
                                                        </div>
                                                        <InputError message={errors.avatar} className="mt-1" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="field">
                                                <label>Display name <span className="hint">How teachers and partners address you</span></label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    defaultValue={auth.user.name || auth.user.full_name || ''}
                                                    required
                                                />
                                                <InputError message={errors.name} className="mt-1" />
                                            </div>
                                            <div className="field">
                                                <label>Headline <span className="hint">A brief description about your learning objective</span></label>
                                                <input
                                                    type="text"
                                                    name="headline"
                                                    placeholder="e.g. Intermediate speaker trying to conquer English-speaking anxiety."
                                                    maxLength={90}
                                                    value={pupilHeadline}
                                                    onChange={(e) => setPupilHeadline(e.target.value)}
                                                />
                                                <div className="char-count">{pupilHeadline.length} / 90</div>
                                                <InputError message={errors.headline} className="mt-1" />
                                            </div>
                                            <div className="field">
                                                <label>About you</label>
                                                <textarea
                                                    name="bio"
                                                    placeholder="Introduce yourself. What are your main struggles in English? What hobbies do you like to talk about?"
                                                    maxLength={600}
                                                    value={pupilBio}
                                                    onChange={(e) => setPupilBio(e.target.value)}
                                                ></textarea>
                                                <div className="char-count">{pupilBio.length} / 600</div>
                                                <InputError message={errors.bio} className="mt-1" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Contact details (private) */}
                                    <div className="sec">
                                        <div className="sec-head">
                                            <h2>Contact details</h2>
                                            <p>Never shown to other students or teachers. Used strictly for notifications and authentication.</p>
                                        </div>
                                        <div className="card shadow-sm">
                                            <div className="row2 mb-4">
                                                <div className="field">
                                                    <label className="flex items-center gap-2">
                                                        Email address
                                                        <span className="private-tag">
                                                            <Lock className="w-2.5 h-2.5" /> Private
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        defaultValue={auth.user.email}
                                                        required
                                                    />
                                                    <InputError message={errors.email} className="mt-1" />
                                                </div>
                                                <div className="field">
                                                    <label className="flex items-center gap-2">
                                                        Phone number
                                                        <span className="private-tag">
                                                            <Lock className="w-2.5 h-2.5" /> Private
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        name="phone_number"
                                                        defaultValue={auth.user.pupil_profile?.phone_number || ''}
                                                        placeholder="+998 90 123 4567"
                                                    />
                                                    <InputError message={errors.phone_number} className="mt-1" />
                                                </div>
                                            </div>
                                            <div className="row2">
                                                <div className="field">
                                                    <label>{t('auth.gender')}</label>
                                                    <select
                                                        name="gender"
                                                        defaultValue={String(auth.user.gender || 'prefer_not_to_say')}
                                                        className="w-full border border-[#E6E9F2] rounded-[14px] px-4 py-3.5 text-base text-[#22284A] bg-white focus:outline-none focus:border-[#1E2A5A]"
                                                    >
                                                        <option value="male">{t('auth.gender_male')}</option>
                                                        <option value="female">{t('auth.gender_female')}</option>
                                                        <option value="prefer_not_to_say">{t('auth.gender_prefer_not_to_say')}</option>
                                                    </select>
                                                    <InputError message={errors.gender} className="mt-1" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. IELTS Target Metrics */}
                                    <div className="sec">
                                        <div className="sec-head">
                                            <h2>
                                                IELTS Target Metrics <span className="req">ConvoMate Path</span>
                                            </h2>
                                            <p>Your previous target metrics and certificates checked to optimize matches.</p>
                                        </div>
                                        <div className="card shadow-sm">
                                            <div className="row2 mb-6">
                                                <div className="field">
                                                    <label>Target IELTS overall band</label>
                                                    <input
                                                        type="text"
                                                        name="target_overall_band"
                                                        value={targetOverallBand}
                                                        onChange={(e) => setTargetOverallBand(e.target.value)}
                                                        inputMode="decimal"
                                                        placeholder="e.g. 7.5"
                                                    />
                                                    <InputError message={errors.target_overall_band} className="mt-1" />
                                                </div>
                                                <div className="field">
                                                    <label>Target Speaking band <span className="hint">Matches you with optimal peers</span></label>
                                                    <input
                                                        type="text"
                                                        name="target_speaking_band"
                                                        value={targetSpeakingBand}
                                                        onChange={(e) => setTargetSpeakingBand(e.target.value)}
                                                        inputMode="decimal"
                                                        placeholder="e.g. 7.0"
                                                    />
                                                    <InputError message={errors.target_speaking_band} className="mt-1" />
                                                </div>
                                            </div>

                                            <div className="field">
                                                <label>Diagnostic Test Results / Certificates</label>
                                                {pupilCerts.map((c: any, index: number) => (
                                                    <div key={c.id || index} className="cert-row shadow-sm">
                                                        <input
                                                            type="text"
                                                            name={`certificates[${index}][title]`}
                                                            value={c.title}
                                                            onChange={(e) => updatePupilCertTitle(index, e.target.value)}
                                                            placeholder="Certificate title..."
                                                            className="w-full border-none p-1 font-bold text-sm bg-transparent focus:outline-none focus:ring-0 focus:border-none"
                                                            required
                                                        />
                                                        {c.file_url ? (
                                                            <a
                                                                href={c.file_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="cert-file flex items-center gap-1.5"
                                                            >
                                                                📎 {c.file_name || 'View file'}
                                                            </a>
                                                        ) : (
                                                            <label
                                                                className="cert-file flex items-center gap-1.5 cursor-pointer"
                                                                htmlFor={`pupil-file-${index}`}
                                                            >
                                                                <Upload className="w-3.5 h-3.5" /> Upload
                                                            </label>
                                                        )}
                                                        <input
                                                            type="file"
                                                            id={`pupil-file-${index}`}
                                                            name={`ielts_certificates[${index}]`}
                                                            accept=".pdf,.png,.jpg,.jpeg,.svg,.webp,.gif"
                                                            hidden
                                                            onChange={(e) => handlePupilCertFileSelect(index, e)}
                                                        />
                                                        <input type="hidden" name={`certificates[${index}][file_url]`} value={c.file_url || ''} />
                                                        <input type="hidden" name={`certificates[${index}][file_name]`} value={c.file_name || ''} />
                                                        <input type="hidden" name={`certificates[${index}][status]`} value={c.status || 'pending'} />

                                                        {c.status === 'verified' ? (
                                                            <span className="cert-status verified">✓ Verified</span>
                                                        ) : (
                                                            <span className="cert-status pending">Under review</span>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => removePupilCertificate(index)}
                                                            className="p-2 text-red-500 hover:text-red-700 transition"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}

                                                <button
                                                    type="button"
                                                    onClick={addPupilCertificate}
                                                    className="add-cert text-[#1E2A5A] hover:underline flex items-center gap-1 mt-2"
                                                >
                                                    + Add diagnostic file / certificate
                                                </button>
                                                <div className="verify-note">
                                                    Uploading official results helps us optimize matchmaking parameters to pair you with partners of complementary fluency bands. Verified results display on your target charts.
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 4. Conversational Focus Areas */}
                                    <div className="sec">
                                        <div className="sec-head">
                                            <h2>My conversational goals</h2>
                                            <p>Shown as profile focus areas. Select the types of sessions you want to run.</p>
                                        </div>
                                        <div className="card shadow-sm">
                                            <div className="focus-grid">
                                                {[
                                                    { val: 'freestyle conversation', label: 'Freestyle conversation' },
                                                    { val: 'practice q&a', label: 'Practice Q&A' },
                                                    { val: 'ielts speaking mock', label: 'IELTS Speaking mock' },
                                                    { val: 'job interview prep', label: 'Job interview prep' },
                                                    { val: 'vocabulary expansion', label: 'Vocabulary expansion' },
                                                    { val: 'business english', label: 'Business English' },
                                                ].map((tag) => {
                                                    const isChecked = pupilLabels.includes(tag.val);
                                                    return (
                                                        <label
                                                            key={tag.val}
                                                            className={`check ${isChecked ? 'checked' : ''}`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                name="labels[]"
                                                                value={tag.val}
                                                                checked={isChecked}
                                                                onChange={() => togglePupilLabel(tag.val)}
                                                                className="hidden"
                                                            />
                                                            <div className={`box border transition-all ${
                                                                isChecked ? 'bg-[#1E2A5A] border-[#1E2A5A]' : 'border-[#C9CFDE]'
                                                            }`}>
                                                                <svg viewBox="0 0 16 16" fill="none" strokeLinecap="round" className={`w-3 h-3 stroke-white stroke-[3px] transition-opacity ${
                                                                    isChecked ? 'opacity-100' : 'opacity-0'
                                                                }`}>
                                                                    <path d="M3 8.5 L6.5 12 L13 4.5" />
                                                                </svg>
                                                            </div>
                                                            <span className="check-label">{tag.label}</span>
                                                        </label>
                                                    );
                                                })}
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
