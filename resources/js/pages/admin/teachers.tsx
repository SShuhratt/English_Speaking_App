import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    ShieldCheck,
    ShieldAlert,
    Sparkles,
    MessageSquare,
    ExternalLink,
    GraduationCap,
    FileText,
    Edit,
    Check,
    Trash2,
    Download,
    Video,
    VideoOff,
    Phone,
    Send,
    AlertCircle,
    Eye,
    Briefcase,
    CheckCircle2,
    Clock,
    BookOpen,
} from 'lucide-react';
import DeleteUserModal from '@/components/delete-user-modal';
import ShareProfileDropdown from '@/components/ShareProfileDropdown';
import AdminPagination, { PaginationLink } from '@/components/AdminPagination';
import {
    CertificatePreviewModal,
    CertificatePreviewData,
} from '@/components/certificates/CertificatePreviewModal';
import { useTranslation } from '@/hooks/use-translation';
import { validateCertificateScores } from '@/config/certificates';

interface TeacherProfile {
    id: string;
    overall_level?: string;
    speaking_band?: string | number;
    price?: number;
    is_verified?: boolean;
    certificates?: any;
    intro_video_url?: string | null;
    labels?: string[] | string | null;
    headline?: string | null;
    bio?: string | null;
    experience_years?: number | null;
    workplace?: string | null;
    age?: number | null;
    country_code?: string | null;
    city?: string | null;
    phone_number?: string | null;
}

interface Teacher {
    id: string;
    full_name: string;
    email: string;
    phone_number?: string | null;
    telegram_username?: string | null;
    telegram_chat_id?: string | number | null;
    avatar?: string;
    created_at: string;
    teacher_profile?: TeacherProfile;
    unread_messages_count?: number;
    is_new?: boolean;
}

interface FilterCounts {
    all: number;
    verified: number;
    unverified: number;
    new: number;
}

interface Props {
    teachers: {
        data: Teacher[];
        links: PaginationLink[];
        from?: number | null;
        to?: number | null;
        total: number;
        current_page?: number;
        last_page?: number;
        per_page?: number;
    };
    currentFilter: string;
    filterCounts?: FilterCounts;
    perPage?: string | number;
}

export default function AdminTeachers({
    teachers,
    currentFilter,
    filterCounts,
    perPage,
}: Props) {
    const { t, locale } = useTranslation();
    const [editingTeacherId, setEditingTeacherId] = useState<string | null>(
        null,
    );
    const [inspectingTeacher, setInspectingTeacher] = useState<Teacher | null>(
        null,
    );
    const [previewCert, setPreviewCert] =
        useState<CertificatePreviewData | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
    const [editingCerts, setEditingCerts] = useState<any[]>([]);
    const [editingOverallLevel, setEditingOverallLevel] = useState<string>('');
    const [editingSpeakingBand, setEditingSpeakingBand] = useState<string>('');
    const [deletingUser, setDeletingUser] = useState<{
        id: string;
        name: string;
    } | null>(null);

    // Keep active inspecting teacher synchronized with current props
    const activeInspectingTeacher = React.useMemo(() => {
        if (!inspectingTeacher) return null;
        return (
            teachers.data.find((t) => t.id === inspectingTeacher.id) ||
            inspectingTeacher
        );
    }, [inspectingTeacher, teachers.data]);

    const handleToggleVerify = (id: string, currentStatus?: boolean) => {
        router.post(
            `/admin/teachers/${id}/verify`,
            {
                verified: !currentStatus,
            },
            { preserveScroll: true },
        );
    };

    const handleToggleCertStatus = (
        teacherId: string,
        certIndex: number,
        currentStatus?: string,
    ) => {
        const nextStatus =
            currentStatus === 'verified' ? 'under_review' : 'verified';
        router.post(
            `/admin/teachers/${teacherId}/certificates/${certIndex}/verify`,
            { status: nextStatus },
            { preserveScroll: true },
        );
    };

    const setFilter = (filter: string) => {
        const currentParams = new URLSearchParams(window.location.search);
        currentParams.set('status', filter);
        currentParams.set('page', '1');
        if (perPage) {
            currentParams.set('per_page', String(perPage));
        }
        router.get(
            `${window.location.pathname}?${currentParams.toString()}`,
            {},
            { preserveState: true },
        );
    };

    const parseCertificates = (rawCerts: any): any[] => {
        const certsArray =
            typeof rawCerts === 'string' ? JSON.parse(rawCerts) : rawCerts;
        return (Array.isArray(certsArray) ? certsArray : []).map((c: any) => {
            if (typeof c === 'string') {
                const isUrl =
                    c.startsWith('http') || c.startsWith('/storage');
                return {
                    type: 'ielts',
                    custom_type_name: '',
                    title: isUrl ? 'IELTS Certificate' : c,
                    overall: '',
                    listening: '',
                    reading: '',
                    writing: '',
                    speaking: '',
                    file_url: isUrl ? c : null,
                    file_name: isUrl
                        ? c.substring(c.lastIndexOf('/') + 1)
                        : '',
                    status: 'verified',
                };
            }
            return {
                type: c.type ?? 'ielts',
                custom_type_name: c.custom_type_name ?? '',
                title: c.title ?? '',
                overall: String(c.overall ?? ''),
                listening: String(c.listening ?? ''),
                reading: String(c.reading ?? ''),
                writing: String(c.writing ?? ''),
                speaking: String(c.speaking ?? ''),
                file_url: c.file_url ?? null,
                file_name: c.file_name ?? '',
                status: c.status ?? 'pending',
                language: c.language,
                sub_scores: c.sub_scores,
            };
        });
    };

    const parseLabels = (rawLabels: any): string[] => {
        if (!rawLabels) return [];
        if (Array.isArray(rawLabels)) return rawLabels;
        if (typeof rawLabels === 'string') {
            try {
                const parsed = JSON.parse(rawLabels);
                if (Array.isArray(parsed)) return parsed;
            } catch {
                return [rawLabels];
            }
        }
        return [];
    };

    const getTopicLabel = (lbl: string): string => {
        const cleanKey = lbl.toLowerCase().trim();
        const translated = t(`labels.${cleanKey}`);
        if (translated && !translated.startsWith('labels.')) {
            return translated;
        }
        const withUnderscore = t(`labels.${cleanKey.replace(/\s+/g, '_')}`);
        if (withUnderscore && !withUnderscore.startsWith('labels.')) {
            return withUnderscore;
        }
        return lbl
            .split(/[-_\s]+/)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
    };

    const handlePreviewCertificate = (cert: any) => {
        setPreviewCert({
            type: cert.type || 'ielts',
            title: cert.title,
            custom_type_name: cert.custom_type_name,
            overall: cert.overall,
            listening: cert.listening,
            reading: cert.reading,
            writing: cert.writing,
            speaking: cert.speaking,
            sub_scores: cert.sub_scores,
            file_url: cert.file_url,
            file_name: cert.file_name,
            status: cert.status,
            language: cert.language,
        });
        setIsPreviewOpen(true);
    };

    const openEditModal = (teacher: Teacher) => {
        const normalized = parseCertificates(
            teacher.teacher_profile?.certificates,
        );
        setEditingTeacherId(teacher.id);
        setEditingCerts(normalized);
        setEditingOverallLevel(teacher.teacher_profile?.overall_level ?? '');
        setEditingSpeakingBand(
            String(teacher.teacher_profile?.speaking_band ?? ''),
        );
    };

    const updateCertScore = (index: number, field: string, val: string) => {
        setEditingCerts((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: val };
            return next;
        });
    };

    const certScoreErrors = React.useMemo(() => {
        return editingCerts.map((cert) => validateCertificateScores(cert, t));
    }, [editingCerts, t]);

    const hasCertScoreErrors = certScoreErrors.some(
        (errors) => Object.keys(errors).length > 0,
    );

    const saveCertificates = (teacherId: string) => {
        if (hasCertScoreErrors) {
            return;
        }

        router.post(
            `/admin/teachers/${teacherId}/certificates`,
            {
                certificates: editingCerts,
                overall_level: editingOverallLevel,
                speaking_band: editingSpeakingBand,
            },
            {
                onSuccess: () => setEditingTeacherId(null),
                preserveScroll: true,
            },
        );
    };

    return (
        <>
            <Head title={t('admin.teachers_title')} />

            <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
                {/* Header Banner */}
                <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-white/20 p-3 backdrop-blur-md">
                            <GraduationCap className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold md:text-3xl">
                                {t('admin.teachers_heading')}
                            </h1>
                            <p className="mt-1 text-sm text-blue-100">
                                {t('admin.teachers_desc')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter & List Card */}
                <Card className="shadow-md">
                    <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-lg">
                                {t('admin.teachers_list_title')}
                            </CardTitle>
                            <CardDescription>
                                {t('admin.teachers_list_desc')}
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
                            <Button
                                size="sm"
                                variant={
                                    currentFilter === 'all'
                                        ? 'default'
                                        : 'ghost'
                                }
                                onClick={() => setFilter('all')}
                                className={`flex items-center gap-1.5 ${
                                    currentFilter === 'all'
                                        ? 'bg-indigo-600 text-white'
                                        : ''
                                }`}
                            >
                                <span>{t('admin.filter_all_teachers')}</span>
                                {filterCounts && (
                                    <span
                                        className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                                            currentFilter === 'all'
                                                ? 'bg-indigo-700/80 text-white'
                                                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        {filterCounts.all}
                                    </span>
                                )}
                            </Button>
                            <Button
                                size="sm"
                                variant={
                                    currentFilter === 'verified'
                                        ? 'default'
                                        : 'ghost'
                                }
                                onClick={() => setFilter('verified')}
                                className={`flex items-center gap-1.5 ${
                                    currentFilter === 'verified'
                                        ? 'bg-indigo-600 text-white'
                                        : ''
                                }`}
                            >
                                <span>{t('admin.filter_verified_teachers')}</span>
                                {filterCounts && (
                                    <span
                                        className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                                            currentFilter === 'verified'
                                                ? 'bg-indigo-700/80 text-white'
                                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                        }`}
                                    >
                                        {filterCounts.verified}
                                    </span>
                                )}
                            </Button>
                            <Button
                                size="sm"
                                variant={
                                    currentFilter === 'new'
                                        ? 'default'
                                        : 'ghost'
                                }
                                onClick={() => setFilter('new')}
                                className={`flex items-center gap-1.5 ${
                                    currentFilter === 'new'
                                        ? 'bg-indigo-600 text-white'
                                        : ''
                                }`}
                            >
                                <span>{t('admin.filter_new_teachers')}</span>
                                {filterCounts && (
                                    <span
                                        className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                                            currentFilter === 'new'
                                                ? 'bg-indigo-700/80 text-white'
                                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                        }`}
                                    >
                                        {filterCounts.new}
                                    </span>
                                )}
                            </Button>
                            <Button
                                size="sm"
                                variant={
                                    currentFilter === 'unverified'
                                        ? 'default'
                                        : 'ghost'
                                }
                                onClick={() => setFilter('unverified')}
                                className={`flex items-center gap-1.5 ${
                                    currentFilter === 'unverified'
                                        ? 'bg-indigo-600 text-white'
                                        : ''
                                }`}
                            >
                                <span>{t('admin.filter_unverified_teachers')}</span>
                                {filterCounts && (
                                    <span
                                        className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                                            currentFilter === 'unverified'
                                                ? 'bg-indigo-700/80 text-white'
                                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                        }`}
                                    >
                                        {filterCounts.unverified}
                                    </span>
                                )}
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-gray-50 text-xs text-gray-700 uppercase dark:bg-gray-800 dark:text-gray-300">
                                    <tr>
                                        <th className="px-4 py-3">
                                            {t('admin.col_teacher_info')}
                                        </th>
                                        <th className="px-4 py-3">
                                            {t('admin.col_qualification')}
                                        </th>
                                        <th className="px-4 py-3">
                                            {t('admin.col_status_badges')}
                                        </th>
                                        <th className="px-4 py-3">
                                            {t('admin.col_unread_support')}
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            {t('admin.col_actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {teachers.data.map((teacher) => {
                                        const isVerified = Boolean(
                                            teacher.teacher_profile
                                                ?.is_verified,
                                        );
                                        const isEditing =
                                            editingTeacherId === teacher.id;

                                        return (
                                            <React.Fragment key={teacher.id}>
                                                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-10 w-10">
                                                                <AvatarImage
                                                                    src={
                                                                        teacher.avatar
                                                                    }
                                                                />
                                                                <AvatarFallback>
                                                                    {teacher.full_name?.substring(
                                                                        0,
                                                                        2,
                                                                    ) || 'T'}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <Link
                                                                        href={`/profile/${teacher.id}`}
                                                                        className="flex items-center gap-1 font-medium text-indigo-600 hover:underline"
                                                                    >
                                                                        {
                                                                            teacher.full_name
                                                                        }
                                                                        <ExternalLink className="h-3 w-3" />
                                                                    </Link>
                                                                    <span className="inline-flex items-center rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                                                        ID:{' '}
                                                                        {teacher.id.substring(
                                                                            0,
                                                                            8,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-gray-500">
                                                                    {
                                                                        teacher.email
                                                                    }
                                                                </p>
                                                                <div className="mt-1.5 flex flex-col gap-1 text-xs">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Phone className="h-3 w-3 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                                                                        {teacher.phone_number ||
                                                                        teacher
                                                                            .teacher_profile
                                                                            ?.phone_number ? (
                                                                            <a
                                                                                href={`tel:${teacher.phone_number || teacher.teacher_profile?.phone_number}`}
                                                                                className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                                                                            >
                                                                                {teacher.phone_number ||
                                                                                    teacher
                                                                                        .teacher_profile
                                                                                        ?.phone_number}
                                                                            </a>
                                                                        ) : (
                                                                            <span className="text-[11px] text-gray-400 italic">
                                                                                {t('admin.no_phone_recorded')}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Send className="h-3 w-3 flex-shrink-0 text-sky-500" />
                                                                        {teacher.telegram_username ? (
                                                                            <a
                                                                                href={`https://t.me/${teacher.telegram_username.replace(/^@/, '')}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="font-medium text-sky-600 hover:underline dark:text-sky-400"
                                                                            >
                                                                                @{teacher.telegram_username.replace(/^@/, '')}
                                                                            </a>
                                                                        ) : teacher.telegram_chat_id ? (
                                                                            <span className="text-[11px] font-medium text-sky-700 dark:text-sky-300">
                                                                                {t('admin.telegram_linked', { id: String(teacher.telegram_chat_id) })}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-[11px] text-gray-400 italic">
                                                                                {t('admin.telegram_not_linked')}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-4 text-xs text-gray-600 dark:text-gray-300">
                                                        <div>
                                                            {t('admin.level_label', {
                                                                level: teacher.teacher_profile?.overall_level || t('admin.not_set'),
                                                            })}
                                                        </div>
                                                        <div>
                                                            {t('admin.speaking_label', {
                                                                score: teacher.teacher_profile?.speaking_band || 'N/A',
                                                            })}
                                                        </div>
                                                        <div>
                                                            {t('admin.rate_label', {
                                                                rate: teacher.teacher_profile?.price
                                                                    ? Number(teacher.teacher_profile.price).toLocaleString()
                                                                    : '0',
                                                            })}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {isVerified ? (
                                                                <Badge className="flex items-center gap-1 bg-emerald-600 text-white">
                                                                    <ShieldCheck className="h-3 w-3" />{' '}
                                                                    {t('admin.badge_verified')}
                                                                </Badge>
                                                            ) : (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-amber-300 bg-amber-50 text-amber-600 dark:bg-amber-950/40"
                                                                >
                                                                    <ShieldAlert className="mr-1 h-3 w-3" />{' '}
                                                                    {t('admin.badge_unverified')}
                                                                </Badge>
                                                            )}

                                                            {teacher.is_new && (
                                                                <Badge className="flex items-center gap-1 bg-blue-600 text-white">
                                                                    <Sparkles className="h-3 w-3" />{' '}
                                                                    {t('admin.badge_new_teacher')}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        {(teacher.unread_messages_count ||
                                                            0) > 0 ? (
                                                            <Link
                                                                href={`/admin/support?user_id=${teacher.id}`}
                                                            >
                                                                <Badge
                                                                    variant="destructive"
                                                                    className="flex w-fit items-center gap-1"
                                                                >
                                                                    <MessageSquare className="h-3 w-3" />
                                                                    {t('admin.unread_messages_count', {
                                                                        count: teacher.unread_messages_count,
                                                                    })}
                                                                </Badge>
                                                            </Link>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">
                                                                {t('admin.no_unread_messages')}
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-4 text-right">
                                                        <div className="flex flex-wrap items-center justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="default"
                                                                onClick={() =>
                                                                    setInspectingTeacher(
                                                                        teacher,
                                                                    )
                                                                }
                                                                className="bg-indigo-600 font-semibold text-white shadow-sm hover:bg-indigo-700"
                                                            >
                                                                <Eye className="mr-1.5 h-3.5 w-3.5" />
                                                                {t(
                                                                    'admin.btn_inspect_dossier',
                                                                )}
                                                            </Button>

                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    isEditing
                                                                        ? setEditingTeacherId(
                                                                              null,
                                                                          )
                                                                        : openEditModal(
                                                                              teacher,
                                                                          )
                                                                }
                                                                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                                            >
                                                                <Edit className="mr-1 h-3.5 w-3.5" />
                                                                {isEditing
                                                                    ? t(
                                                                          'admin.btn_close',
                                                                      )
                                                                    : t(
                                                                          'admin.btn_inspect_scores',
                                                                      )}
                                                            </Button>

                                                            {teacher.teacher_profile?.intro_video_url ? (
                                                                <a
                                                                    href={`/admin/teachers/${teacher.id}/download-video`}
                                                                    className="inline-flex items-center gap-1.5 rounded-md border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300"
                                                                    title={t('admin.btn_download_video')}
                                                                >
                                                                    <Download className="h-3.5 w-3.5" />
                                                                    {t('admin.btn_download_video')}
                                                                </a>
                                                            ) : (
                                                                <span
                                                                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-400 dark:border-gray-700"
                                                                    title={t('admin.btn_no_video')}
                                                                >
                                                                    <Video className="h-3.5 w-3.5" />
                                                                    {t('admin.btn_no_video')}
                                                                </span>
                                                            )}

                                                            <ShareProfileDropdown
                                                                profileId={teacher.id}
                                                                name={teacher.full_name}
                                                            />


                                                            <Button
                                                                size="sm"
                                                                variant={
                                                                    isVerified
                                                                        ? 'outline'
                                                                        : 'default'
                                                                }
                                                                onClick={() =>
                                                                    handleToggleVerify(
                                                                        teacher.id,
                                                                        isVerified,
                                                                    )
                                                                }
                                                                className={
                                                                    !isVerified
                                                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                                        : ''
                                                                }
                                                            >
                                                                {isVerified
                                                                    ? t('admin.unverify_teacher')
                                                                    : t('admin.verify_teacher')}
                                                            </Button>

                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() =>
                                                                    setDeletingUser(
                                                                        {
                                                                            id: teacher.id,
                                                                            name: teacher.full_name,
                                                                        },
                                                                    )
                                                                }
                                                                className="bg-red-600 font-bold text-white hover:bg-red-700"
                                                            >
                                                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                                                {t('admin.delete_user')}
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Expanded Admin Inspection & Edit Row */}
                                                {isEditing && (
                                                    <tr>
                                                        <td
                                                            colSpan={5}
                                                            className="bg-indigo-50/40 p-4 dark:bg-indigo-950/20"
                                                        >
                                                            <div className="space-y-4 rounded-xl border border-indigo-200 bg-white p-5 shadow-inner dark:border-indigo-900 dark:bg-gray-900">
                                                                <div className="flex items-center justify-between border-b pb-3">
                                                                    <h3 className="flex items-center gap-2 font-bold text-indigo-950 dark:text-indigo-200">
                                                                        <FileText className="h-4 w-4 text-indigo-600" />
                                                                        {t('admin.cert_inspector_title', { name: teacher.full_name })}
                                                                    </h3>
                                                                    <Button
                                                                        size="sm"
                                                                        disabled={hasCertScoreErrors}
                                                                        onClick={() =>
                                                                            saveCertificates(
                                                                                teacher.id,
                                                                            )
                                                                        }
                                                                        className="bg-indigo-600 font-bold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    >
                                                                        <Check className="mr-1 h-4 w-4" />{' '}
                                                                        {t('admin.btn_save_changes')}
                                                                    </Button>
                                                                </div>

                                                                {hasCertScoreErrors && (
                                                                    <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                                                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                                                        <span>
                                                                            {locale === 'uz'
                                                                                ? "Iltimos, sertifikatlardagi kiritilgan ballarni tekshiring (ballar belgilangan me'yordan oshmasligi kerak)."
                                                                                : locale === 'ru'
                                                                                    ? "Пожалуйста, проверьте баллы в сертификатах (баллы не должны превышать установленный лимит)."
                                                                                    : "Please review certificate scores (scores cannot exceed maximum band limits)."}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                                    <div>
                                                                        <Label className="text-xs font-bold">
                                                                            {t('admin.overall_level_cache')}
                                                                        </Label>
                                                                        <Input
                                                                            type="text"
                                                                            value={
                                                                                editingOverallLevel
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                setEditingOverallLevel(
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                            className="mt-1 text-xs"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <Label className="text-xs font-bold">
                                                                            {t('admin.speaking_band_cache')}
                                                                        </Label>
                                                                        <Input
                                                                            type="text"
                                                                            value={
                                                                                editingSpeakingBand
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                setEditingSpeakingBand(
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                            className="mt-1 text-xs"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-4 pt-2">
                                                                    <h4 className="text-xs font-extrabold tracking-wider text-gray-500 uppercase">
                                                                        {t('admin.certs_and_files')}
                                                                    </h4>
                                                                    {editingCerts.length ===
                                                                    0 ? (
                                                                        <p className="text-xs text-gray-500 italic">
                                                                            {t('admin.no_certs_submitted')}
                                                                        </p>
                                                                    ) : (
                                                                        editingCerts.map(
                                                                            (
                                                                                cert,
                                                                                cIdx,
                                                                            ) => {
                                                                                const errors = certScoreErrors[cIdx] || {};

                                                                                return (
                                                                                <div
                                                                                    key={
                                                                                        cIdx
                                                                                    }
                                                                                    className="space-y-3 rounded-xl border bg-gray-50 p-4 dark:bg-gray-800"
                                                                                >
                                                                                    <div className="flex items-center justify-between">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                                                                                {cert.title ||
                                                                                                    cert.type?.toUpperCase() ||
                                                                                                    `Certificate #${cIdx + 1}`}
                                                                                            </span>
                                                                                            {cert.file_url ? (
                                                                                                <a
                                                                                                    href={
                                                                                                        cert.file_url
                                                                                                    }
                                                                                                    target="_blank"
                                                                                                    rel="noopener noreferrer"
                                                                                                    className="inline-flex items-center gap-1 rounded-md border bg-white px-2.5 py-1 text-xs font-bold text-indigo-600 hover:underline dark:bg-gray-900"
                                                                                                >
                                                                                                    <ExternalLink className="h-3 w-3" />{' '}
                                                                                                    {t('admin.view_uploaded_doc', { file: cert.file_name || 'File' })}
                                                                                                </a>
                                                                                            ) : (
                                                                                                <span className="text-xs text-gray-400">
                                                                                                    {t('admin.no_doc_attached')}
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <Label className="text-xs">
                                                                                                {t('admin.col_payment_status')}:
                                                                                            </Label>
                                                                                            <select
                                                                                                value={
                                                                                                    cert.status ||
                                                                                                    'pending'
                                                                                                }
                                                                                                onChange={(
                                                                                                    e,
                                                                                                ) =>
                                                                                                    updateCertScore(
                                                                                                        cIdx,
                                                                                                        'status',
                                                                                                        e
                                                                                                            .target
                                                                                                            .value,
                                                                                                    )
                                                                                                }
                                                                                                className="rounded border bg-white px-2 py-1 text-xs dark:bg-gray-900"
                                                                                            >
                                                                                                <option value="pending">
                                                                                                    {t('admin.status_under_review')}
                                                                                                </option>
                                                                                                <option value="verified">
                                                                                                    {t('admin.status_verified_cert')}
                                                                                                </option>
                                                                                            </select>
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                                                                                        <div>
                                                                                            <Label className="text-[11px] font-bold">
                                                                                                {t('admin.skill_overall')}
                                                                                            </Label>
                                                                                            <Input
                                                                                                type="text"
                                                                                                value={
                                                                                                    cert.overall ||
                                                                                                    ''
                                                                                                }
                                                                                                onChange={(
                                                                                                    e,
                                                                                                ) =>
                                                                                                    updateCertScore(
                                                                                                        cIdx,
                                                                                                        'overall',
                                                                                                        e
                                                                                                            .target
                                                                                                            .value,
                                                                                                    )
                                                                                                }
                                                                                                className={`mt-1 h-8 text-xs font-bold ${errors.overall ? 'border-red-500 focus-visible:ring-red-500 bg-red-50/50 dark:bg-red-950/20' : ''}`}
                                                                                            />
                                                                                            {errors.overall && (
                                                                                                <p className="mt-1 text-[10px] font-semibold text-red-500 leading-tight">
                                                                                                    {errors.overall}
                                                                                                </p>
                                                                                            )}
                                                                                        </div>
                                                                                        <div>
                                                                                            <Label className="text-[11px] font-bold">
                                                                                                {t('admin.skill_listening')}
                                                                                            </Label>
                                                                                            <Input
                                                                                                type="text"
                                                                                                value={
                                                                                                    cert.listening ||
                                                                                                    ''
                                                                                                }
                                                                                                onChange={(
                                                                                                    e,
                                                                                                ) =>
                                                                                                    updateCertScore(
                                                                                                        cIdx,
                                                                                                        'listening',
                                                                                                        e
                                                                                                            .target
                                                                                                            .value,
                                                                                                    )
                                                                                                }
                                                                                                className={`mt-1 h-8 text-xs ${errors.listening ? 'border-red-500 focus-visible:ring-red-500 bg-red-50/50 dark:bg-red-950/20' : ''}`}
                                                                                            />
                                                                                            {errors.listening && (
                                                                                                <p className="mt-1 text-[10px] font-semibold text-red-500 leading-tight">
                                                                                                    {errors.listening}
                                                                                                </p>
                                                                                            )}
                                                                                        </div>
                                                                                        <div>
                                                                                            <Label className="text-[11px] font-bold">
                                                                                                {t('admin.skill_reading')}
                                                                                            </Label>
                                                                                            <Input
                                                                                                type="text"
                                                                                                value={
                                                                                                    cert.reading ||
                                                                                                    ''
                                                                                                }
                                                                                                onChange={(
                                                                                                    e,
                                                                                                ) =>
                                                                                                    updateCertScore(
                                                                                                        cIdx,
                                                                                                        'reading',
                                                                                                        e
                                                                                                            .target
                                                                                                            .value,
                                                                                                    )
                                                                                                }
                                                                                                className={`mt-1 h-8 text-xs ${errors.reading ? 'border-red-500 focus-visible:ring-red-500 bg-red-50/50 dark:bg-red-950/20' : ''}`}
                                                                                            />
                                                                                            {errors.reading && (
                                                                                                <p className="mt-1 text-[10px] font-semibold text-red-500 leading-tight">
                                                                                                    {errors.reading}
                                                                                                </p>
                                                                                            )}
                                                                                        </div>
                                                                                        <div>
                                                                                            <Label className="text-[11px] font-bold">
                                                                                                {t('admin.skill_writing')}
                                                                                            </Label>
                                                                                            <Input
                                                                                                type="text"
                                                                                                value={
                                                                                                    cert.writing ||
                                                                                                    ''
                                                                                                }
                                                                                                onChange={(
                                                                                                    e,
                                                                                                ) =>
                                                                                                    updateCertScore(
                                                                                                        cIdx,
                                                                                                        'writing',
                                                                                                        e
                                                                                                            .target
                                                                                                            .value,
                                                                                                    )
                                                                                                }
                                                                                                className={`mt-1 h-8 text-xs ${errors.writing ? 'border-red-500 focus-visible:ring-red-500 bg-red-50/50 dark:bg-red-950/20' : ''}`}
                                                                                            />
                                                                                            {errors.writing && (
                                                                                                <p className="mt-1 text-[10px] font-semibold text-red-500 leading-tight">
                                                                                                    {errors.writing}
                                                                                                </p>
                                                                                            )}
                                                                                        </div>
                                                                                        <div>
                                                                                            <Label className="text-[11px] font-bold">
                                                                                                {t('admin.skill_speaking')}
                                                                                            </Label>
                                                                                            <Input
                                                                                                type="text"
                                                                                                value={
                                                                                                    cert.speaking ||
                                                                                                    ''
                                                                                                }
                                                                                                onChange={(
                                                                                                    e,
                                                                                                ) =>
                                                                                                    updateCertScore(
                                                                                                        cIdx,
                                                                                                        'speaking',
                                                                                                        e
                                                                                                            .target
                                                                                                            .value,
                                                                                                    )
                                                                                                }
                                                                                                className={`mt-1 h-8 text-xs ${errors.speaking ? 'border-red-500 focus-visible:ring-red-500 bg-red-50/50 dark:bg-red-950/20' : ''}`}
                                                                                            />
                                                                                            {errors.speaking && (
                                                                                                <p className="mt-1 text-[10px] font-semibold text-red-500 leading-tight">
                                                                                                    {errors.speaking}
                                                                                                </p>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                            },
                                                                        )
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <AdminPagination
                            links={teachers.links}
                            from={teachers.from}
                            to={teachers.to}
                            total={teachers.total}
                            perPage={perPage || '15'}
                            currentFilter={currentFilter}
                            filterParamName="status"
                            itemLabel={t('admin.filter_all_teachers')}
                        />
                    </CardContent>
                </Card>
            </div>

            <DeleteUserModal
                isOpen={!!deletingUser}
                onClose={() => setDeletingUser(null)}
                userId={deletingUser?.id ?? null}
                userName={deletingUser?.name}
            />

            {/* Teacher Dossier Inspection Modal */}
            {activeInspectingTeacher && (
                <Dialog
                    open={!!activeInspectingTeacher}
                    onOpenChange={(open) => {
                        if (!open) {
                            setInspectingTeacher(null);
                        }
                    }}
                >
                    <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto p-0 sm:max-w-4xl">
                        <DialogHeader className="sr-only">
                            <DialogTitle>
                                {t('admin.dossier_modal_title')}
                            </DialogTitle>
                            <DialogDescription>
                                {t('admin.dossier_modal_desc')}
                            </DialogDescription>
                        </DialogHeader>

                        {/* Banner Header */}
                        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 p-6 text-white">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16 border-2 border-white/30 shadow-md">
                                        <AvatarImage
                                            src={
                                                activeInspectingTeacher.avatar
                                            }
                                        />
                                        <AvatarFallback className="bg-white/20 text-lg font-bold text-white">
                                            {activeInspectingTeacher.full_name?.substring(
                                                0,
                                                2,
                                            ) || 'T'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-xl font-bold md:text-2xl">
                                                {
                                                    activeInspectingTeacher.full_name
                                                }
                                            </h2>
                                            <span className="rounded border border-white/20 bg-white/10 px-2 py-0.5 font-mono text-xs font-semibold text-white">
                                                ID:{' '}
                                                {activeInspectingTeacher.id.substring(
                                                    0,
                                                    8,
                                                )}
                                            </span>
                                        </div>
                                        <p className="text-sm text-indigo-100">
                                            {activeInspectingTeacher.email}
                                        </p>
                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-indigo-200">
                                            <Link
                                                href={`/profile/${activeInspectingTeacher.id}`}
                                                className="inline-flex items-center gap-1 font-semibold text-white underline-offset-2 hover:underline"
                                                target="_blank"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                                {t(
                                                    'admin.btn_view_public_profile',
                                                )}
                                            </Link>
                                            <span>•</span>
                                            <span>
                                                {t('common.joined', 'Joined')}:{' '}
                                                {new Date(
                                                    activeInspectingTeacher.created_at,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    {activeInspectingTeacher.teacher_profile
                                        ?.is_verified ? (
                                        <Badge className="flex items-center gap-1.5 bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-emerald-600">
                                            <ShieldCheck className="h-4 w-4" />
                                            {t('admin.verified_status')}
                                        </Badge>
                                    ) : (
                                        <Badge className="flex items-center gap-1.5 bg-amber-500 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-amber-600">
                                            <ShieldAlert className="h-4 w-4" />
                                            {t('admin.unverified_status')}
                                        </Badge>
                                    )}

                                    <Button
                                        size="sm"
                                        variant={
                                            activeInspectingTeacher
                                                .teacher_profile?.is_verified
                                                ? 'secondary'
                                                : 'default'
                                        }
                                        onClick={() =>
                                            handleToggleVerify(
                                                activeInspectingTeacher.id,
                                                activeInspectingTeacher
                                                    .teacher_profile
                                                    ?.is_verified,
                                            )
                                        }
                                        className={
                                            !activeInspectingTeacher
                                                .teacher_profile?.is_verified
                                                ? 'bg-emerald-600 font-bold text-white hover:bg-emerald-500'
                                                : 'border border-white/30 bg-white/20 font-semibold text-white hover:bg-white/30'
                                        }
                                    >
                                        {activeInspectingTeacher
                                            .teacher_profile?.is_verified
                                            ? t('admin.unverify_teacher')
                                            : t('admin.verify_teacher')}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 p-6">
                            {/* 1. Intro Video & Conversation Topics */}
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                                {/* Intro Video Card */}
                                <div className="flex flex-col rounded-xl border bg-gray-50/50 p-4 dark:bg-gray-800/50 lg:col-span-7">
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-gray-100">
                                            <Video className="h-4 w-4 text-indigo-600" />
                                            {t('admin.section_intro_video')}
                                        </h3>
                                        {activeInspectingTeacher
                                            .teacher_profile
                                            ?.intro_video_url && (
                                            <a
                                                href={`/admin/teachers/${activeInspectingTeacher.id}/download-video`}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                                {t('admin.btn_download_video')}
                                            </a>
                                        )}
                                    </div>

                                    {activeInspectingTeacher.teacher_profile
                                        ?.intro_video_url ? (
                                        <div className="overflow-hidden rounded-lg bg-black shadow-inner">
                                            <video
                                                controls
                                                preload="metadata"
                                                className="aspect-video max-h-72 w-full object-contain"
                                                src={
                                                    activeInspectingTeacher
                                                        .teacher_profile
                                                        .intro_video_url
                                                }
                                            >
                                                Your browser does not support the video tag.
                                            </video>
                                        </div>
                                    ) : (
                                        <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-10 text-center text-gray-400 dark:border-gray-700">
                                            <VideoOff className="mb-2 h-8 w-8 text-gray-300" />
                                            <p className="text-xs font-medium">
                                                {t('admin.no_intro_video')}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Conversation Topics & Contact Info */}
                                <div className="flex flex-col rounded-xl border bg-gray-50/50 p-4 dark:bg-gray-800/50 lg:col-span-5">
                                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-gray-100">
                                        <BookOpen className="h-4 w-4 text-purple-600" />
                                        {t('admin.section_conversation_topics')}
                                    </h3>

                                    {parseLabels(
                                        activeInspectingTeacher.teacher_profile
                                            ?.labels,
                                    ).length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {parseLabels(
                                                activeInspectingTeacher
                                                    .teacher_profile?.labels,
                                            ).map((lbl, idx) => (
                                                <span
                                                    key={idx}
                                                    className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-300"
                                                >
                                                    {getTopicLabel(lbl)}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-gray-300 py-8 text-center text-xs text-gray-400 dark:border-gray-700">
                                            {t('admin.no_conversation_topics')}
                                        </div>
                                    )}

                                    {/* Contact Information block */}
                                    <div className="mt-4 space-y-2 border-t pt-4">
                                        <h4 className="text-xs font-bold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                                            {t('admin.section_contact_info')}
                                        </h4>
                                        <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                                {activeInspectingTeacher.phone_number ||
                                                activeInspectingTeacher
                                                    .teacher_profile
                                                    ?.phone_number ? (
                                                    <a
                                                        href={`tel:${activeInspectingTeacher.phone_number || activeInspectingTeacher.teacher_profile?.phone_number}`}
                                                        className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                                                    >
                                                        {activeInspectingTeacher.phone_number ||
                                                            activeInspectingTeacher
                                                                .teacher_profile
                                                                ?.phone_number}
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400 italic">
                                                        {t(
                                                            'admin.no_phone_recorded',
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Send className="h-3.5 w-3.5 shrink-0 text-sky-500" />
                                                {activeInspectingTeacher.telegram_username ? (
                                                    <a
                                                        href={`https://t.me/${activeInspectingTeacher.telegram_username.replace(/^@/, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-semibold text-sky-600 hover:underline dark:text-sky-400"
                                                    >
                                                        @
                                                        {activeInspectingTeacher.telegram_username.replace(
                                                            /^@/,
                                                            '',
                                                        )}
                                                    </a>
                                                ) : activeInspectingTeacher.telegram_chat_id ? (
                                                    <span className="font-medium text-sky-700 dark:text-sky-300">
                                                        {t(
                                                            'admin.telegram_linked',
                                                            {
                                                                id: String(
                                                                    activeInspectingTeacher.telegram_chat_id,
                                                                ),
                                                            },
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic">
                                                        {t(
                                                            'admin.telegram_not_linked',
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Professional Credentials & Bio */}
                            <div className="space-y-4 rounded-xl border bg-gray-50/50 p-4 dark:bg-gray-800/50">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-gray-100">
                                    <Briefcase className="h-4 w-4 text-indigo-600" />
                                    {t('admin.section_credentials')}
                                </h3>

                                {/* Quick Stats Grid */}
                                <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                                    <div className="rounded-lg border bg-white p-3 shadow-sm dark:bg-gray-900">
                                        <span className="block text-[11px] font-medium text-gray-500">
                                            {t('admin.experience_years')}
                                        </span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                            {activeInspectingTeacher
                                                .teacher_profile
                                                ?.experience_years
                                                ? `${activeInspectingTeacher.teacher_profile.experience_years} ${
                                                      locale === 'uz'
                                                          ? 'yil'
                                                          : locale === 'ru'
                                                            ? 'лет'
                                                            : 'years'
                                                  }`
                                                : t('admin.not_set')}
                                        </span>
                                    </div>
                                    <div className="rounded-lg border bg-white p-3 shadow-sm dark:bg-gray-900">
                                        <span className="block text-[11px] font-medium text-gray-500">
                                            {t('admin.workplace')}
                                        </span>
                                        <span className="block truncate text-sm font-bold text-gray-900 dark:text-white">
                                            {activeInspectingTeacher
                                                .teacher_profile?.workplace ||
                                                t('admin.not_set')}
                                        </span>
                                    </div>
                                    <div className="rounded-lg border bg-white p-3 shadow-sm dark:bg-gray-900">
                                        <span className="block text-[11px] font-medium text-gray-500">
                                            {t('admin.hourly_rate')}
                                        </span>
                                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                            {activeInspectingTeacher
                                                .teacher_profile?.price
                                                ? `${Number(activeInspectingTeacher.teacher_profile.price).toLocaleString()} UZS`
                                                : '0 UZS'}
                                        </span>
                                    </div>
                                    <div className="rounded-lg border bg-white p-3 shadow-sm dark:bg-gray-900">
                                        <span className="block text-[11px] font-medium text-gray-500">
                                            {t('admin.location_label')} &{' '}
                                            {t('admin.age_label')}
                                        </span>
                                        <span className="block truncate text-sm font-bold text-gray-900 dark:text-white">
                                            {[
                                                activeInspectingTeacher
                                                    .teacher_profile?.city,
                                                activeInspectingTeacher
                                                    .teacher_profile
                                                    ?.country_code,
                                                activeInspectingTeacher
                                                    .teacher_profile?.age
                                                    ? `${activeInspectingTeacher.teacher_profile.age} y/o`
                                                    : null,
                                            ]
                                                .filter(Boolean)
                                                .join(' • ') ||
                                                t('admin.not_set')}
                                        </span>
                                    </div>
                                </div>

                                {/* Headline */}
                                {activeInspectingTeacher.teacher_profile
                                    ?.headline && (
                                    <div>
                                        <span className="mb-1 block text-xs font-bold tracking-wider text-gray-500 uppercase">
                                            {t('admin.headline_label')}
                                        </span>
                                        <p className="rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow-sm dark:bg-gray-900 dark:text-gray-200">
                                            {
                                                activeInspectingTeacher
                                                    .teacher_profile.headline
                                            }
                                        </p>
                                    </div>
                                )}

                                {/* Bio */}
                                <div>
                                    <span className="mb-1 block text-xs font-bold tracking-wider text-gray-500 uppercase">
                                        {t('admin.bio_label')}
                                    </span>
                                    <div className="rounded-lg border bg-white p-3 text-xs leading-relaxed text-gray-700 shadow-sm dark:bg-gray-900 dark:text-gray-300">
                                        {activeInspectingTeacher.teacher_profile
                                            ?.bio || (
                                            <span className="text-gray-400 italic">
                                                {t('admin.no_bio')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 3. Uploaded Certificates Review */}
                            <div className="space-y-4 rounded-xl border bg-gray-50/50 p-4 dark:bg-gray-800/50">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-gray-100">
                                    <FileText className="h-4 w-4 text-indigo-600" />
                                    {t('admin.certs_and_files')}
                                </h3>

                                {parseCertificates(
                                    activeInspectingTeacher.teacher_profile
                                        ?.certificates,
                                ).length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center text-xs text-gray-400 dark:border-gray-700">
                                        {t('admin.no_certs_submitted')}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {parseCertificates(
                                            activeInspectingTeacher
                                                .teacher_profile?.certificates,
                                        ).map((cert, cIdx) => (
                                            <div
                                                key={cIdx}
                                                className="flex flex-col justify-between gap-4 rounded-xl border bg-white p-4 shadow-sm md:flex-row md:items-center dark:bg-gray-900"
                                            >
                                                <div className="space-y-2">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                                            {cert.title ||
                                                                cert.type?.toUpperCase() ||
                                                                `Certificate #${cIdx + 1}`}
                                                        </span>
                                                        {cert.status ===
                                                        'verified' ? (
                                                            <Badge className="border-emerald-200 bg-emerald-100 text-[10px] text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                                <CheckCircle2 className="mr-1 inline h-3 w-3" />
                                                                {t(
                                                                    'admin.status_verified_cert',
                                                                )}
                                                            </Badge>
                                                        ) : (
                                                            <Badge
                                                                variant="outline"
                                                                className="border-amber-300 bg-amber-50 text-[10px] text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                                            >
                                                                <Clock className="mr-1 inline h-3 w-3" />
                                                                {t(
                                                                    'admin.status_under_review',
                                                                )}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400">
                                                        {cert.overall && (
                                                            <span className="rounded bg-indigo-50 px-2 py-0.5 font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                                                                Overall:{' '}
                                                                {cert.overall}
                                                            </span>
                                                        )}
                                                        {cert.speaking && (
                                                            <span className="rounded bg-gray-100 px-2 py-0.5 font-medium dark:bg-gray-800">
                                                                Speaking:{' '}
                                                                {cert.speaking}
                                                            </span>
                                                        )}
                                                        {cert.listening && (
                                                            <span className="rounded bg-gray-100 px-2 py-0.5 font-medium dark:bg-gray-800">
                                                                Listening:{' '}
                                                                {cert.listening}
                                                            </span>
                                                        )}
                                                        {cert.reading && (
                                                            <span className="rounded bg-gray-100 px-2 py-0.5 font-medium dark:bg-gray-800">
                                                                Reading:{' '}
                                                                {cert.reading}
                                                            </span>
                                                        )}
                                                        {cert.writing && (
                                                            <span className="rounded bg-gray-100 px-2 py-0.5 font-medium dark:bg-gray-800">
                                                                Writing:{' '}
                                                                {cert.writing}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    {cert.file_url ? (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                handlePreviewCertificate(
                                                                    cert,
                                                                )
                                                            }
                                                            className="border-indigo-200 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                                                        >
                                                            <Eye className="mr-1 h-3.5 w-3.5" />
                                                            {t(
                                                                'admin.preview_doc',
                                                            )}
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">
                                                            {t(
                                                                'admin.no_doc_attached',
                                                            )}
                                                        </span>
                                                    )}

                                                    <Button
                                                        size="sm"
                                                        variant={
                                                            cert.status ===
                                                            'verified'
                                                                ? 'outline'
                                                                : 'default'
                                                        }
                                                        onClick={() =>
                                                            handleToggleCertStatus(
                                                                activeInspectingTeacher.id,
                                                                cIdx,
                                                                cert.status,
                                                            )
                                                        }
                                                        className={
                                                            cert.status !==
                                                            'verified'
                                                                ? 'bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700'
                                                                : 'text-xs font-semibold'
                                                        }
                                                    >
                                                        {cert.status ===
                                                        'verified'
                                                            ? t(
                                                                  'admin.status_under_review',
                                                              )
                                                            : t(
                                                                  'admin.status_verified_cert',
                                                              )}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Document Preview Modal for Certificates */}
            <CertificatePreviewModal
                certificate={previewCert}
                isOpen={isPreviewOpen}
                onClose={() => {
                    setIsPreviewOpen(false);
                    setPreviewCert(null);
                }}
            />
        </>
    );
}

AdminTeachers.layout = {
    breadcrumbs: [{ title: 'Manage Teachers', href: '/admin/teachers' }],
};
