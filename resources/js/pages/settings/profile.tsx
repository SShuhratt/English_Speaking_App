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

            <div className="space-y-12">
                <Form
                    {...ProfileController.update.form()}
                    method="post"
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-12"
                >
                    {({ processing, errors }) => (
                        <>
                            <input type="hidden" name="_method" value="PATCH" />

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
                                            <Label htmlFor="name" className="font-bold text-brand-navy ml-1">
                                                {t('profile.name')}
                                            </Label>
                                            <Input
                                                id="name"
                                                className="h-14 px-5 rounded-[16px] border border-brand-pale-blue bg-white focus:border-brand-navy focus:ring-0 focus:outline-none font-body-md text-body-md"
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
                                                className="mt-1"
                                                message={errors.name}
                                            />
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="email" className="font-bold text-brand-navy ml-1">
                                                {t('profile.email')}
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                className="h-14 px-5 rounded-[16px] border border-brand-pale-blue bg-white focus:border-brand-navy focus:ring-0 focus:outline-none font-body-md text-body-md"
                                                defaultValue={auth.user.email}
                                                name="email"
                                                required
                                                autoComplete="username"
                                                placeholder={t('profile.email')}
                                            />
                                            <InputError
                                                className="mt-1"
                                                message={errors.email}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Role Specific Profile Info */}
                            {auth.user.role === 'teacher' && (
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-brand-pale-blue/20 pt-12">
                                    <div className="lg:col-span-4 space-y-2">
                                        <h3 className="text-xl font-extrabold text-brand-navy">
                                            {t('profile.teacher_info')}
                                        </h3>
                                        <p className="text-sm font-medium text-brand-navy/65">
                                            {t('profile.teacher_desc')}
                                        </p>
                                    </div>
                                    <div className="lg:col-span-8 p-8 bg-white rounded-[32px] border border-brand-pale-blue/30 shadow-ambient">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="age" className="font-bold text-brand-navy ml-1">
                                                    {t('profile.age')}
                                                </Label>
                                                <Input
                                                    id="age"
                                                    type="number"
                                                    className="h-14 px-5 rounded-[16px] border border-brand-pale-blue bg-white focus:border-brand-navy focus:ring-0 focus:outline-none font-body-md text-body-md"
                                                    defaultValue={
                                                        auth.user.teacher_profile
                                                            ?.age || ''
                                                    }
                                                    name="age"
                                                    placeholder="e.g. 28"
                                                />
                                                <InputError
                                                    className="mt-1"
                                                    message={errors.age}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="phone_number" className="font-bold text-brand-navy ml-1">
                                                    {t('profile.phone')}
                                                </Label>
                                                <Input
                                                    id="phone_number"
                                                    type="text"
                                                    className="h-14 px-5 rounded-[16px] border border-brand-pale-blue bg-white focus:border-brand-navy focus:ring-0 focus:outline-none font-body-md text-body-md"
                                                    defaultValue={
                                                        auth.user.teacher_profile
                                                            ?.phone_number || ''
                                                    }
                                                    name="phone_number"
                                                    placeholder="+998 90 123 4567"
                                                />
                                                <InputError
                                                    className="mt-1"
                                                    message={errors.phone_number}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="overall_level" className="font-bold text-brand-navy ml-1">
                                                    {t('profile.overall')}
                                                </Label>
                                                <Input
                                                    id="overall_level"
                                                    type="text"
                                                    className="h-14 px-5 rounded-[16px] border border-brand-pale-blue bg-white focus:border-brand-navy focus:ring-0 focus:outline-none font-body-md text-body-md"
                                                    defaultValue={
                                                        auth.user.teacher_profile
                                                            ?.overall_level || ''
                                                    }
                                                    name="overall_level"
                                                    placeholder="e.g. IELTS 8.5"
                                                />
                                                <InputError
                                                    className="mt-1"
                                                    message={errors.overall_level}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="speaking_band" className="font-bold text-brand-navy ml-1">
                                                    {t('profile.speaking')}
                                                </Label>
                                                <Input
                                                    id="speaking_band"
                                                    type="number"
                                                    step="0.5"
                                                    className="h-14 px-5 rounded-[16px] border border-brand-pale-blue bg-white focus:border-brand-navy focus:ring-0 focus:outline-none font-body-md text-body-md"
                                                    defaultValue={
                                                        auth.user.teacher_profile
                                                            ?.speaking_band || ''
                                                    }
                                                    name="speaking_band"
                                                    placeholder="e.g. 8.5"
                                                />
                                                <InputError
                                                    className="mt-1"
                                                    message={errors.speaking_band}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="experience_years" className="font-bold text-brand-navy ml-1">
                                                    {t('profile.experience')}
                                                </Label>
                                                <Input
                                                    id="experience_years"
                                                    type="number"
                                                    step="0.5"
                                                    className="h-14 px-5 rounded-[16px] border border-brand-pale-blue bg-white focus:border-brand-navy focus:ring-0 focus:outline-none font-body-md text-body-md"
                                                    defaultValue={
                                                        auth.user.teacher_profile
                                                            ?.experience_years || ''
                                                    }
                                                    name="experience_years"
                                                    placeholder="e.g. 4.5"
                                                />
                                                <InputError
                                                    className="mt-1"
                                                    message={
                                                        errors.experience_years
                                                    }
                                                />
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="workplace" className="font-bold text-brand-navy ml-1">
                                                    {t('profile.workplace')}
                                                </Label>
                                                <Input
                                                    id="workplace"
                                                    type="text"
                                                    className="h-14 px-5 rounded-[16px] border border-brand-pale-blue bg-white focus:border-brand-navy focus:ring-0 focus:outline-none font-body-md text-body-md"
                                                    defaultValue={
                                                        auth.user.teacher_profile
                                                            ?.workplace || ''
                                                    }
                                                    name="workplace"
                                                    placeholder="e.g. British Council"
                                                />
                                                <InputError
                                                    className="mt-1"
                                                    message={errors.workplace}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-2 md:col-span-2">
                                                <Label htmlFor="certificates" className="font-bold text-brand-navy ml-1">
                                                    {t('profile.certificates')}
                                                </Label>
                                                <Input
                                                    id="certificates"
                                                    type="text"
                                                    className="h-14 px-5 rounded-[16px] border border-brand-pale-blue bg-white focus:border-brand-navy focus:ring-0 focus:outline-none font-body-md text-body-md"
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
                                                    className="mt-1"
                                                    message={errors.certificates}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-2 md:col-span-2">
                                                <Label htmlFor="ielts_certificates" className="font-bold text-brand-navy ml-1">
                                                    Upload IELTS Certificate(s) (PDF or Image)
                                                </Label>
                                                <Input
                                                    id="ielts_certificates"
                                                    type="file"
                                                    name="ielts_certificates[]"
                                                    multiple
                                                    className="h-14 px-5 rounded-[16px] border border-brand-pale-blue bg-white focus:border-brand-navy focus:ring-0 focus:outline-none font-body-md text-body-md"
                                                    accept=".pdf,.png,.jpg,.jpeg"
                                                />
                                                <InputError
                                                    className="mt-1"
                                                    message={
                                                        errors.ielts_certificates
                                                    }
                                                />

                                                {uploadedCerts.length > 0 && (
                                                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                                                                        className="group relative flex flex-col overflow-hidden rounded-[20px] border border-brand-pale-blue/30 bg-neutral-50 p-3 transition-all hover:shadow-sm"
                                                                    >
                                                                        {isImg ? (
                                                                            <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-neutral-200">
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
                                                                            <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-brand-pale-blue/30 bg-white">
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
                                                                            <div className="flex aspect-video w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-brand-pale-blue bg-white p-2">
                                                                                <FileText className="h-8 w-8 text-brand-navy/60" />
                                                                                <span className="max-w-full truncate px-2 text-[10px] font-bold text-brand-navy/80">
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
                                                                                    className="flex items-center gap-1 text-[10px] font-bold text-brand-navy hover:underline"
                                                                                >
                                                                                    View Document{' '}
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
                                                                            className="absolute top-2.5 right-2.5 rounded-full bg-red-500 p-1.5 text-white opacity-0 shadow transition-all group-hover:opacity-100 hover:bg-red-600 focus:opacity-100 focus:outline-none"
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

                                        <div className="grid gap-2 pt-6 mt-4 border-t border-brand-pale-blue/20">
                                            <Label className="text-sm font-bold text-brand-navy mb-2 block">
                                                {t('labels.title')}
                                            </Label>
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                                                            className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-brand-pale-blue/30 p-4 text-sm font-bold text-brand-navy transition-colors select-none hover:bg-neutral-50"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                name="labels[]"
                                                                value={lbl}
                                                                defaultChecked={
                                                                    isChecked
                                                                }
                                                                className="rounded border-brand-pale-blue text-brand-navy focus:ring-brand-navy h-5 w-5"
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
                                </div>
                            )}

                            {auth.user.role === 'pupil' && (
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
                                                <Label htmlFor="age" className="font-bold text-brand-navy ml-1">
                                                    {t('profile.age')}
                                                </Label>
                                                <Input
                                                    id="age"
                                                    type="number"
                                                    className="h-14 px-5 rounded-[16px] border border-brand-pale-blue bg-white focus:border-brand-navy focus:ring-0 focus:outline-none font-body-md text-body-md"
                                                    defaultValue={
                                                        auth.user.pupil_profile
                                                            ?.age || ''
                                                    }
                                                    name="age"
                                                    placeholder="e.g. 18"
                                                />
                                                <InputError
                                                    className="mt-1"
                                                    message={errors.age}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="phone_number" className="font-bold text-brand-navy ml-1">
                                                    {t('profile.phone')}
                                                </Label>
                                                <Input
                                                    id="phone_number"
                                                    type="text"
                                                    className="h-14 px-5 rounded-[16px] border border-brand-pale-blue bg-white focus:border-brand-navy focus:ring-0 focus:outline-none font-body-md text-body-md"
                                                    defaultValue={
                                                        auth.user.pupil_profile
                                                            ?.phone_number || ''
                                                    }
                                                    name="phone_number"
                                                    placeholder="+998 90 123 4567"
                                                />
                                                <InputError
                                                    className="mt-1"
                                                    message={errors.phone_number}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-2 md:col-span-2">
                                                <Label htmlFor="level" className="font-bold text-brand-navy ml-1">
                                                    {t('profile.target_level')}
                                                </Label>
                                                <select
                                                    id="level"
                                                    name="level"
                                                    className="w-full h-14 px-5 rounded-[16px] border border-brand-pale-blue bg-white focus:border-brand-navy focus:ring-0 focus:outline-none font-body-md text-body-md appearance-none"
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
                                                    className="mt-1"
                                                    message={errors.level}
                                                />
                                            </div>

                                            <div className="flex flex-col gap-2 md:col-span-2">
                                                <Label htmlFor="ielts_certificates" className="font-bold text-brand-navy ml-1">
                                                    Upload IELTS Certificate(s) (PDF or Image)
                                                </Label>
                                                <Input
                                                    id="ielts_certificates"
                                                    type="file"
                                                    name="ielts_certificates[]"
                                                    multiple
                                                    className="h-14 px-5 rounded-[16px] border border-brand-pale-blue bg-white focus:border-brand-navy focus:ring-0 focus:outline-none font-body-md text-body-md"
                                                    accept=".pdf,.png,.jpg,.jpeg"
                                                />
                                                <InputError
                                                    className="mt-1"
                                                    message={
                                                        errors.ielts_certificates
                                                    }
                                                />

                                                {uploadedCerts.length > 0 && (
                                                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                                                                        className="group relative flex flex-col overflow-hidden rounded-[20px] border border-brand-pale-blue/30 bg-neutral-50 p-3 transition-all hover:shadow-sm"
                                                                    >
                                                                        {isImg ? (
                                                                            <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-neutral-200">
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
                                                                            <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-brand-pale-blue/30 bg-white">
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
                                                                            <div className="flex aspect-video w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-brand-pale-blue bg-white p-2">
                                                                                <FileText className="h-8 w-8 text-brand-navy/60" />
                                                                                <span className="max-w-full truncate px-2 text-[10px] font-bold text-brand-navy/80">
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
                                                                                    className="flex items-center gap-1 text-[10px] font-bold text-brand-navy hover:underline"
                                                                                >
                                                                                    View Document{' '}
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
                                                                            className="absolute top-2.5 right-2.5 rounded-full bg-red-500 p-1.5 text-white opacity-0 shadow transition-all group-hover:opacity-100 hover:bg-red-600 focus:opacity-100 focus:outline-none"
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
                                </div>
                            )}

                            {/* Section 3: Verification status warning & Submit action bar */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-brand-pale-blue/20 pt-12">
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
                                        className="px-8 py-3.5 rounded-full font-bold text-sm text-brand-navy hover:bg-neutral-100 transition-all cursor-pointer"
                                    >
                                        Discard Changes
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-12 py-4 rounded-full font-bold text-sm bg-brand-yellow text-brand-navy shadow-lg hover:shadow-xl hover:translate-y-[-2px] active:scale-95 duration-200 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
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
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-brand-pale-blue/20 pt-12">
                    <div className="lg:col-span-4 space-y-2">
                        <h3 className="text-xl font-extrabold text-red-600">
                            Delete Account
                        </h3>
                        <p className="text-sm font-medium text-brand-navy/65">
                            Permanently delete your account and all of its resources.
                        </p>
                    </div>
                    <div className="lg:col-span-8 p-8 bg-white rounded-[32px] border border-brand-pale-blue/30 shadow-ambient">
                        <DeleteUser />
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
