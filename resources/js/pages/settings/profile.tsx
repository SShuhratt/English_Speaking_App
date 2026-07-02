import React from 'react';
import { Form, Head, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { Trash2, FileText, ExternalLink } from 'lucide-react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';
import { useTranslation } from '@/hooks/use-translation';

type PageProps = {
    auth: Auth & {
        user: {
            role: 'teacher' | 'pupil';
            teacher_profile?: {
                age?: number;
                phone_number?: string;
                experience_years?: number;
                workplace?: string;
                overall_level?: string;
                speaking_band?: number;
                certificates?: string[];
                labels?: string[];
            };
            pupil_profile?: {
                age?: number;
                phone_number?: string;
                level?: string;
                certificates?: string[];
            };
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

    const initialUploadedCerts = React.useMemo(() => {
        const rawCerts =
            auth.user.role === 'teacher'
                ? (auth.user.teacher_profile?.certificates ?? [])
                : (auth.user.pupil_profile?.certificates ?? []);
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

    const [uploadedCerts, setUploadedCerts] =
        React.useState<string[]>(initialUploadedCerts);

    return (
        <>
            <Head title={t('profile.title')} />

            <h1 className="sr-only">{t('profile.title')}</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title={t('profile.title')}
                    description={t('profile.desc')}
                />

                <Form
                    {...ProfileController.update.form()}
                    method="post"
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <input type="hidden" name="_method" value="PATCH" />
                            <div className="grid gap-2">
                                <Label htmlFor="name">
                                    {t('profile.name')}
                                </Label>

                                <Input
                                    id="name"
                                    className="mt-1 block w-full"
                                    defaultValue={
                                        auth.user.name ||
                                        auth.user.full_name ||
                                        ''
                                    }
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder={t(
                                        'profile.fullname_placeholder',
                                    )}
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">
                                    {t('profile.email')}
                                </Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder={t('profile.email')}
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            {auth.user.role === 'teacher' && (
                                <div className="mt-6 space-y-6 border-t pt-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground">
                                            {t('profile.teacher_info')}
                                        </h3>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {t('profile.teacher_desc')}
                                        </p>
                                    </div>

                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="age">
                                                {t('profile.age')}
                                            </Label>
                                            <Input
                                                id="age"
                                                type="number"
                                                className="mt-1 block w-full"
                                                defaultValue={
                                                    auth.user.teacher_profile
                                                        ?.age || ''
                                                }
                                                name="age"
                                                placeholder="e.g. 28"
                                            />
                                            <InputError
                                                className="mt-2"
                                                message={errors.age}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="phone_number">
                                                {t('profile.phone')}
                                            </Label>
                                            <Input
                                                id="phone_number"
                                                type="text"
                                                className="mt-1 block w-full"
                                                defaultValue={
                                                    auth.user.teacher_profile
                                                        ?.phone_number || ''
                                                }
                                                name="phone_number"
                                                placeholder="+998 90 123 4567"
                                            />
                                            <InputError
                                                className="mt-2"
                                                message={errors.phone_number}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="overall_level">
                                                {t('profile.overall')}
                                            </Label>
                                            <Input
                                                id="overall_level"
                                                type="text"
                                                className="mt-1 block w-full"
                                                defaultValue={
                                                    auth.user.teacher_profile
                                                        ?.overall_level || ''
                                                }
                                                name="overall_level"
                                                placeholder="e.g. IELTS 8.5"
                                            />
                                            <InputError
                                                className="mt-2"
                                                message={errors.overall_level}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="speaking_band">
                                                {t('profile.speaking')}
                                            </Label>
                                            <Input
                                                id="speaking_band"
                                                type="number"
                                                step="0.5"
                                                className="mt-1 block w-full"
                                                defaultValue={
                                                    auth.user.teacher_profile
                                                        ?.speaking_band || ''
                                                }
                                                name="speaking_band"
                                                placeholder="e.g. 8.5"
                                            />
                                            <InputError
                                                className="mt-2"
                                                message={errors.speaking_band}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="experience_years">
                                                {t('profile.experience')}
                                            </Label>
                                            <Input
                                                id="experience_years"
                                                type="number"
                                                step="0.5"
                                                className="mt-1 block w-full"
                                                defaultValue={
                                                    auth.user.teacher_profile
                                                        ?.experience_years || ''
                                                }
                                                name="experience_years"
                                                placeholder="e.g. 4.5"
                                            />
                                            <InputError
                                                className="mt-2"
                                                message={
                                                    errors.experience_years
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="workplace">
                                                {t('profile.workplace')}
                                            </Label>
                                            <Input
                                                id="workplace"
                                                type="text"
                                                className="mt-1 block w-full"
                                                defaultValue={
                                                    auth.user.teacher_profile
                                                        ?.workplace || ''
                                                }
                                                name="workplace"
                                                placeholder="e.g. British Council"
                                            />
                                            <InputError
                                                className="mt-2"
                                                message={errors.workplace}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="certificates">
                                                {t('profile.certificates')}
                                            </Label>
                                            <Input
                                                id="certificates"
                                                type="text"
                                                className="mt-1 block w-full"
                                                defaultValue={
                                                    auth.user.teacher_profile?.certificates
                                                        ?.filter(
                                                            (c) =>
                                                                !c.startsWith(
                                                                    '/storage',
                                                                ) &&
                                                                !c.startsWith(
                                                                    'http',
                                                                ),
                                                        )
                                                        .join(', ') || ''
                                                }
                                                name="certificates"
                                                placeholder="CELTA, IELTS Trainer, TESOL"
                                            />
                                            <InputError
                                                className="mt-2"
                                                message={errors.certificates}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="ielts_certificates">
                                                Upload IELTS Certificate(s) (PDF
                                                or Image)
                                            </Label>
                                            <Input
                                                id="ielts_certificates"
                                                type="file"
                                                name="ielts_certificates[]"
                                                multiple
                                                className="mt-1 block w-full"
                                                accept=".pdf,.png,.jpg,.jpeg"
                                            />
                                            <InputError
                                                className="mt-2"
                                                message={
                                                    errors.ielts_certificates
                                                }
                                            />

                                            {uploadedCerts.length > 0 && (
                                                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                    {uploadedCerts.map(
                                                        (cert, index) => {
                                                            const isImg =
                                                                isImageFile(
                                                                    cert,
                                                                );
                                                            const isPdf =
                                                                isPdfFile(cert);
                                                            return (
                                                                <div
                                                                    key={index}
                                                                    className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-muted/20 p-2.5 transition-all hover:shadow-sm"
                                                                >
                                                                    {isImg ? (
                                                                        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-muted">
                                                                            <img
                                                                                src={
                                                                                    cert
                                                                                }
                                                                                alt="Certificate"
                                                                                className="h-full w-full object-cover"
                                                                            />
                                                                            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                                                                <a
                                                                                    href={
                                                                                        cert
                                                                                    }
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="scale-90 rounded-lg bg-white/95 p-1.5 text-slate-800 transition-all group-hover:scale-100 hover:bg-white"
                                                                                >
                                                                                    <ExternalLink className="h-4 w-4" />
                                                                                </a>
                                                                            </div>
                                                                        </div>
                                                                    ) : isPdf ? (
                                                                        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border border-border/40 bg-white">
                                                                            <iframe
                                                                                src={`${cert}#toolbar=0&navpanes=0`}
                                                                                className="pointer-events-none h-full w-full border-0"
                                                                            />
                                                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 p-2 text-center opacity-0 transition-opacity group-hover:opacity-100">
                                                                                <span className="mb-1 max-w-full truncate px-2 text-[10px] font-semibold text-white">
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
                                                                                    className="scale-90 rounded-lg bg-white/95 p-1.5 text-slate-800 transition-all group-hover:scale-100 hover:bg-white"
                                                                                >
                                                                                    <ExternalLink className="h-4 w-4" />
                                                                                </a>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex aspect-video w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/80 bg-muted/40 p-2">
                                                                            <FileText className="h-8 w-8 text-brand-brown/80" />
                                                                            <span className="max-w-full truncate px-2 text-[10px] font-bold text-muted-foreground">
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
                                                                                className="flex items-center gap-1 text-[10px] font-bold text-brand-brown hover:underline"
                                                                            >
                                                                                View
                                                                                Document{' '}
                                                                                <ExternalLink className="h-3 w-3" />
                                                                            </a>
                                                                        </div>
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setUploadedCerts(
                                                                                (
                                                                                    prev,
                                                                                ) =>
                                                                                    prev.filter(
                                                                                        (
                                                                                            _,
                                                                                            i,
                                                                                        ) =>
                                                                                            i !==
                                                                                            index,
                                                                                    ),
                                                                            )
                                                                        }
                                                                        className="absolute top-2.5 right-2.5 rounded-full bg-red-500 p-1 text-white opacity-0 shadow transition-all group-hover:opacity-100 hover:bg-red-600 focus:opacity-100 focus:outline-none"
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </button>
                                                                    <input
                                                                        type="hidden"
                                                                        name="existing_certificates[]"
                                                                        value={
                                                                            cert
                                                                        }
                                                                    />
                                                                </div>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid gap-2 pt-2">
                                        <Label className="text-sm font-semibold">
                                            {t('labels.title')}
                                        </Label>
                                        <div className="mt-1.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                            {[
                                                'mock',
                                                'freestyle',
                                                'lessons',
                                                'business english',
                                                'practice q&a',
                                            ].map((lbl) => {
                                                const isChecked =
                                                    auth.user.teacher_profile?.labels?.includes(
                                                        lbl,
                                                    ) || false;
                                                return (
                                                    <label
                                                        key={lbl}
                                                        className="flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-sm font-medium transition-colors select-none hover:bg-muted/40"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            name="labels[]"
                                                            value={lbl}
                                                            defaultChecked={
                                                                isChecked
                                                            }
                                                            className="rounded border-input text-brand-brown focus:ring-brand-brown"
                                                        />
                                                        <span>
                                                            {t(`labels.${lbl}`)}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        <InputError
                                            className="mt-2"
                                            message={errors.labels}
                                        />
                                    </div>
                                </div>
                            )}

                            {auth.user.role === 'pupil' && (
                                <div className="mt-6 space-y-6 border-t pt-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground">
                                            {t('profile.pupil_info')}
                                        </h3>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {t('profile.pupil_desc')}
                                        </p>
                                    </div>

                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="age">
                                                {t('profile.age')}
                                            </Label>
                                            <Input
                                                id="age"
                                                type="number"
                                                className="mt-1 block w-full"
                                                defaultValue={
                                                    auth.user.pupil_profile
                                                        ?.age || ''
                                                }
                                                name="age"
                                                placeholder="e.g. 18"
                                            />
                                            <InputError
                                                className="mt-2"
                                                message={errors.age}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="phone_number">
                                                {t('profile.phone')}
                                            </Label>
                                            <Input
                                                id="phone_number"
                                                type="text"
                                                className="mt-1 block w-full"
                                                defaultValue={
                                                    auth.user.pupil_profile
                                                        ?.phone_number || ''
                                                }
                                                name="phone_number"
                                                placeholder="+998 90 123 4567"
                                            />
                                            <InputError
                                                className="mt-2"
                                                message={errors.phone_number}
                                            />
                                        </div>

                                        <div className="grid gap-2 sm:col-span-2">
                                            <Label htmlFor="level">
                                                {t('profile.target_level')}
                                            </Label>
                                            <select
                                                id="level"
                                                name="level"
                                                className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                defaultValue={
                                                    auth.user.pupil_profile
                                                        ?.level || ''
                                                }
                                            >
                                                <option value="">
                                                    {t('profile.select_level')}
                                                </option>
                                                <option value="beginner">
                                                    {t(
                                                        'profile.level_beginner',
                                                    )}
                                                </option>
                                                <option value="pre-intermediate">
                                                    {t('profile.level_pre_int')}
                                                </option>
                                                <option value="upper-intermediate">
                                                    {t(
                                                        'profile.level_upper_int',
                                                    )}
                                                </option>
                                                <option value="advanced">
                                                    {t(
                                                        'profile.level_advanced',
                                                    )}
                                                </option>
                                                <option value="ielts_band">
                                                    {t('profile.level_ielts')}
                                                </option>
                                                <option value="cefr_band">
                                                    {t('profile.level_cefr')}
                                                </option>
                                            </select>
                                            <InputError
                                                className="mt-2"
                                                message={errors.level}
                                            />
                                        </div>

                                        <div className="grid gap-2 sm:col-span-2">
                                            <Label htmlFor="ielts_certificates">
                                                Upload IELTS Certificate(s) (PDF
                                                or Image)
                                            </Label>
                                            <Input
                                                id="ielts_certificates"
                                                type="file"
                                                name="ielts_certificates[]"
                                                multiple
                                                className="mt-1 block w-full"
                                                accept=".pdf,.png,.jpg,.jpeg"
                                            />
                                            <InputError
                                                className="mt-2"
                                                message={
                                                    errors.ielts_certificates
                                                }
                                            />

                                            {uploadedCerts.length > 0 && (
                                                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                    {uploadedCerts.map(
                                                        (cert, index) => {
                                                            const isImg =
                                                                isImageFile(
                                                                    cert,
                                                                );
                                                            const isPdf =
                                                                isPdfFile(cert);
                                                            return (
                                                                <div
                                                                    key={index}
                                                                    className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-muted/20 p-2.5 transition-all hover:shadow-sm"
                                                                >
                                                                    {isImg ? (
                                                                        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-muted">
                                                                            <img
                                                                                src={
                                                                                    cert
                                                                                }
                                                                                alt="Certificate"
                                                                                className="h-full w-full object-cover"
                                                                            />
                                                                            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                                                                <a
                                                                                    href={
                                                                                        cert
                                                                                    }
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="scale-90 rounded-lg bg-white/95 p-1.5 text-slate-800 transition-all group-hover:scale-100 hover:bg-white"
                                                                                >
                                                                                    <ExternalLink className="h-4 w-4" />
                                                                                </a>
                                                                            </div>
                                                                        </div>
                                                                    ) : isPdf ? (
                                                                        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border border-border/40 bg-white">
                                                                            <iframe
                                                                                src={`${cert}#toolbar=0&navpanes=0`}
                                                                                className="pointer-events-none h-full w-full border-0"
                                                                            />
                                                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 p-2 text-center opacity-0 transition-opacity group-hover:opacity-100">
                                                                                <span className="mb-1 max-w-full truncate px-2 text-[10px] font-semibold text-white">
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
                                                                                    className="scale-90 rounded-lg bg-white/95 p-1.5 text-slate-800 transition-all group-hover:scale-100 hover:bg-white"
                                                                                >
                                                                                    <ExternalLink className="h-4 w-4" />
                                                                                </a>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex aspect-video w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/80 bg-muted/40 p-2">
                                                                            <FileText className="h-8 w-8 text-brand-brown/80" />
                                                                            <span className="max-w-full truncate px-2 text-[10px] font-bold text-muted-foreground">
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
                                                                                className="flex items-center gap-1 text-[10px] font-bold text-brand-brown hover:underline"
                                                                            >
                                                                                View
                                                                                Document{' '}
                                                                                <ExternalLink className="h-3 w-3" />
                                                                            </a>
                                                                        </div>
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setUploadedCerts(
                                                                                (
                                                                                    prev,
                                                                                ) =>
                                                                                    prev.filter(
                                                                                        (
                                                                                            _,
                                                                                            i,
                                                                                        ) =>
                                                                                            i !==
                                                                                            index,
                                                                                    ),
                                                                            )
                                                                        }
                                                                        className="absolute top-2.5 right-2.5 rounded-full bg-red-500 p-1 text-white opacity-0 shadow transition-all group-hover:opacity-100 hover:bg-red-600 focus:opacity-100 focus:outline-none"
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </button>
                                                                    <input
                                                                        type="hidden"
                                                                        name="existing_certificates[]"
                                                                        value={
                                                                            cert
                                                                        }
                                                                    />
                                                                </div>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {mustVerifyEmail &&
                                auth.user.email_verified_at === null && (
                                    <div>
                                        <p className="-mt-4 text-sm text-muted-foreground">
                                            {t('profile.email_unverified')}{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                            >
                                                {t('profile.resend_btn')}
                                            </Link>
                                        </p>

                                        {status ===
                                            'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-green-600">
                                                {t('profile.resend_sent')}
                                            </div>
                                        )}
                                    </div>
                                )}

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    {t('profile.save')}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            <DeleteUser />
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
