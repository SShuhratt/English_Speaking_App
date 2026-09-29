import { Form, Head, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import '@/types/telegram.d';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';
import { useTranslation } from '@/hooks/use-translation';
import AuthLayout from '@/layouts/auth-layout';
import {
    CertificateInputCard,
    CertificateData,
} from '@/components/certificates/CertificateInputCard';

type Props = {
    passwordRules: string;
};

export default function Register({ passwordRules }: Props) {
    const [role, setRole] = useState<'teacher' | 'pupil'>(() => {
        if (typeof window !== 'undefined') {
            const searchParams = new URLSearchParams(window.location.search);
            const roleParam = searchParams.get('role');
            if (roleParam === 'teacher' || roleParam === 'instructor') {
                return 'teacher';
            }
        }
        return 'pupil';
    });

    const { t, locale } = useTranslation();
    const { google_register, telegram_register } = usePage<any>().props;
    const [isInsideTelegram, setIsInsideTelegram] = useState(Boolean(telegram_register));
    const [price, setPrice] = useState('');
    const [age, setAge] = useState('');
    const [ageError, setAgeError] = useState<string | null>(null);
    const [certError, setCertError] = useState<string | null>(null);
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

    const minAge = role === 'teacher' ? 18 : 8;

    const formatPrice = (val: string) => {
        const clean = val.replace(/\D/g, '');
        return clean ? clean.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '';
    };

    const [phone, setPhone] = useState('+998 ');

    const formatPhoneNumber = (val: string) => {
        if (!val || val === '+') return val;
        const clean = val.replace(/[^\d+]/g, '');
        const digits = clean.replace(/\D/g, '');

        if (clean.startsWith('+998') || clean.startsWith('998') || (!clean.startsWith('+') && digits.length <= 9)) {
            let uzDigits = digits;
            if (uzDigits.startsWith('998')) {
                uzDigits = uzDigits.slice(3);
            }
            uzDigits = uzDigits.slice(0, 9);

            let formatted = '+998';
            if (uzDigits.length > 0) formatted += ' ' + uzDigits.slice(0, 2);
            if (uzDigits.length > 2) formatted += ' ' + uzDigits.slice(2, 5);
            if (uzDigits.length > 5) formatted += ' ' + uzDigits.slice(5, 7);
            if (uzDigits.length > 7) formatted += ' ' + uzDigits.slice(7, 9);
            return formatted;
        }

        if (!clean.startsWith('+')) return ('+' + clean).slice(0, 16);
        return clean.slice(0, 16);
    };

    useEffect(() => {
        if (typeof window !== 'undefined' && Boolean(window.Telegram?.WebApp?.initData)) {
            setIsInsideTelegram(true);
        }
    }, []);

    const [certificates, setCertificates] = useState<CertificateData[]>([
        {
            type: 'ielts',
            language: 'english',
            custom_type_name: '',
            overall: '',
            listening: '',
            reading: '',
            writing: '',
            speaking: '',
            file_name: '',
            file: null,
        },
    ]);

    const isCertificateComplete = (cert: CertificateData): boolean => {
        if (!cert.language || !cert.type) return false;
        if (cert.type === 'other' && !cert.custom_type_name?.trim()) return false;
        if (cert.language === 'other' && !cert.custom_language?.trim()) return false;
        if (!cert.overall?.toString().trim()) return false;

        if (cert.type === 'ielts' || cert.type === 'cefr') {
            if (
                !cert.listening?.toString().trim() ||
                !cert.reading?.toString().trim() ||
                !cert.writing?.toString().trim() ||
                !cert.speaking?.toString().trim()
            ) {
                return false;
            }
        }

        const hasUploadedFile = Boolean(
            cert.file ||
            cert.file_url ||
            (cert.file_name && cert.file_name.trim() !== '')
        );

        return hasUploadedFile;
    };

    const validateForm = (): boolean => {
        setAgeError(null);
        setCertError(null);

        // 1. Age Restriction Validation
        const ageInput = document.getElementById('age') as HTMLInputElement | null;
        const currentAgeStr = ageInput?.value ?? age;
        const numericAge = parseInt(currentAgeStr, 10);
        const requiredMinAge = role === 'teacher' ? 18 : 8;

        if (!currentAgeStr || isNaN(numericAge) || numericAge < requiredMinAge) {
            const message =
                locale === 'uz'
                    ? `Minimal yosh talabi: ${role === 'teacher' ? "O'qituvchilar uchun 18 yosh" : "O'quvchilar uchun 8 yosh"}.`
                    : locale === 'ru'
                        ? `Минимальный возраст: ${role === 'teacher' ? '18 лет для преподавателей' : '8 лет для учеников'}.`
                        : `Minimum age required: ${role === 'teacher' ? '18 years for teachers' : '8 years for pupils'}.`;
            setAgeError(message);
            ageInput?.focus();
            return false;
        }

        // 2. Teacher Multi-Certificate Validation
        if (role === 'teacher') {
            if (!certificates || certificates.length === 0) {
                setCertError(
                    locale === 'uz'
                        ? "Kamida bitta sertifikat ma'lumotlarini to'ldiring va faylini yuklang."
                        : locale === 'ru'
                            ? "Заполните данные как минимум одного сертификата и прикрепите файл."
                            : "Please complete at least one certificate and attach its file."
                );
                return false;
            }

            for (let i = 0; i < certificates.length; i++) {
                const cert = certificates[i];
                if (!isCertificateComplete(cert)) {
                    setCertError(
                        locale === 'uz'
                            ? `${i + 1}-sertifikat ma'lumotlarini to'liq kiriting (ballar va sertifikat fayli majburiy).`
                            : locale === 'ru'
                                ? `Заполните все данные для сертификата №${i + 1} (баллы и файл обязательны).`
                                : `Please complete all fields for certificate #${i + 1} (scores and file upload are required).`
                    );
                    document.getElementById('certificates-section')?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                    });
                    return false;
                }
            }
        }

        return true;
    };

    const addCertificate = () => {
        const hasIncomplete = certificates.some((c) => !isCertificateComplete(c));

        if (hasIncomplete) {
            setCertError(
                locale === 'uz'
                    ? "Yangi sertifikat qo'shishdan oldin mavjud sertifikat ma'lumotlarini to'liq kiriting va faylini yuklang."
                    : locale === 'ru'
                        ? "Заполните все данные и загрузите файл текущего сертификата перед добавлением нового."
                        : "Please complete all fields and upload the certificate file before adding another one."
            );
            return;
        }

        setCertError(null);
        setCertificates((prev) => [
            ...prev,
            {
                type: 'ielts',
                language: 'english',
                custom_type_name: '',
                overall: '',
                listening: '',
                reading: '',
                writing: '',
                speaking: '',
                file_name: '',
                file: null,
            },
        ]);
    };

    const requestRemoveCertificate = (index: number) => {
        if (certificates.length <= 1) return;
        setDeleteIndex(index);
    };

    const confirmRemoveCertificate = () => {
        if (deleteIndex === null || certificates.length <= 1) {
            setDeleteIndex(null);
            return;
        }

        setCertificates((prev) => prev.filter((_, i) => i !== deleteIndex));
        setDeleteIndex(null);
        setCertError(null);
    };

    const updateCertificate = (index: number, updated: CertificateData) => {
        setCertificates((prev) => {
            const copy = [...prev];
            copy[index] = updated;
            return copy;
        });

        if (certError) {
            setCertError(null);
        }
    };

    return (
        <>
            <Head title={t('auth.register')} />

            {/* DELETE CONFIRMATION POPUP MODAL */}
            {deleteIndex !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-2xl">
                        <div className="flex items-center gap-3 text-destructive">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <h4 className="text-base font-bold text-foreground">
                                {locale === 'uz' ? "Sertifikatni o'chirish" : locale === 'ru' ? "Удалить сертификат" : "Delete Certificate"}
                            </h4>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">
                            {locale === 'uz'
                                ? "Ushbu sertifikat va yuklangan faylni o'chirib tashlamoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi."
                                : locale === 'ru'
                                    ? "Вы уверены, что хотите удалить этот сертификат и файл? Это действие нельзя отменить."
                                    : "Are you sure you want to delete this certificate and uploaded file? This action cannot be undone."}
                        </p>
                        <div className="mt-6 flex items-center justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteIndex(null)}
                            >
                                {locale === 'uz' ? "Bekor qilish" : locale === 'ru' ? "Отмена" : "Cancel"}
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={confirmRemoveCertificate}
                            >
                                {locale === 'uz' ? "Ha, o'chirish" : locale === 'ru' ? "Да, удалить" : "Yes, Delete"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {google_register && (
                <div className="mb-2 flex items-center gap-3 rounded-xl border border-brand-brown/10 bg-brand-cream/60 p-4 text-sm text-brand-brown">
                    <svg
                        className="h-5 w-5 shrink-0 text-brand-orange"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                    </svg>
                    <div>
                        <span className="font-semibold">
                            {t('auth.registering_with_google')}
                        </span>{' '}
                        {google_register.email}. {t('auth.google_verified_notice')}
                    </div>
                </div>
            )}

            {telegram_register && !google_register && (
                <div className="mb-2 flex items-center gap-3 rounded-xl border border-sky-500/20 bg-sky-50 dark:bg-sky-950/30 p-4 text-sm text-sky-900 dark:text-sky-200">
                    <svg className="h-5 w-5 shrink-0 text-sky-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .36z" />
                    </svg>
                    <div>
                        <span className="font-semibold">{t('auth.connected_via_telegram')}</span>
                        {telegram_register.telegram_username ? ` (@${telegram_register.telegram_username})` : ''}. {t('auth.telegram_complete_desc')}
                    </div>
                </div>
            )}

            {!google_register && !isInsideTelegram && (
                <>
                    <a
                        href="/auth/google"
                        className="mb-2 flex cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-muted/50"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1l3.18,2.48c1.86,-1.72 2.93,-4.25 2.93,-7.22C21.45,11.77 21.41,11.41 21.35,11.1z" fill="#4285f4" />
                            <path d="M12,20.62c2.6,0 4.78,-0.86 6.37,-2.34l-3.18,-2.48c-0.88,0.59 -2.01,0.94 -3.19,0.94c-2.45,0 -4.53,-1.66 -5.27,-3.9L3.48,16.27c1.61,3.19 4.91,5.35 8.52,5.35z" fill="#34a853" />
                            <path d="M6.73,12.84c-0.19,-0.57 -0.3,-1.18 -0.3,-1.81s0.11,-1.24 0.3,-1.81L3.48,6.48C2.75,7.93 2.33,9.57 2.33,11.03c0,1.46 0.42,3.1 1.15,4.55L6.73,12.84z" fill="#fbbc05" />
                            <path d="M12,5.92c1.41,0 2.68,0.49 3.68,1.44l2.76,-2.76C16.77,3.1 14.6,2.38 12,2.38C8.39,2.38 5.09,4.54 3.48,7.73l3.25,2.51c0.74,-2.24 2.82,-3.9 5.27,-3.9z" fill="#ea4335" />
                        </svg>
                        {t('auth.continue_with_google')}
                    </a>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-border"></div>
                        <span className="mx-4 flex-shrink text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            {t('auth.or_register_with_email')}
                        </span>
                        <div className="flex-grow border-t border-border"></div>
                    </div>
                </>
            )}

            {isInsideTelegram && (
                <a
                    href="/tma"
                    className="mb-4 flex cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-sky-500/30 bg-sky-50 dark:bg-sky-950/30 px-4 py-2.5 text-sm font-semibold text-sky-900 dark:text-sky-200 shadow-sm transition-all hover:bg-sky-100 dark:hover:bg-sky-900/40"
                >
                    <svg className="h-5 w-5 shrink-0 text-sky-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .36z" />
                    </svg>
                    {t('auth.switch_telegram_signup')}
                </a>
            )}

            <Form
                action={typeof store.form === 'function' ? store.form().action : store.url()}
                method="post"
                encType="multipart/form-data"
                noValidate
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
                // 1. Inertia Visit Interceptor (Cancels request if false)
                onBefore={() => {
                    const isValid = validateForm();
                    if (!isValid) {
                        return false;
                    }
                }}
                // 2. Form Submit Interceptor (For Enter key trigger)
                onSubmit={(e: any) => {
                    const isValid = validateForm();
                    if (!isValid) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    }
                }}
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">{t('auth.name')}</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    minLength={2}
                                    maxLength={100}
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    defaultValue={google_register?.name || telegram_register?.name || ''}
                                    placeholder={t('auth.full_name_placeholder')}
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">{t('auth.email_address')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    defaultValue={google_register?.email || ''}
                                    readOnly={!!google_register}
                                    onBlur={(e) => {
                                        e.target.value = e.target.value.trim().toLowerCase();
                                    }}
                                    className={google_register ? 'cursor-not-allowed bg-muted' : ''}
                                    placeholder={t('auth.email_placeholder')}
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label>{t('auth.join_as')}</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRole('pupil');
                                            setAgeError(null);
                                            setCertError(null);
                                        }}
                                        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 p-4 text-center transition-all ${role === 'pupil'
                                            ? 'border-brand-orange bg-brand-orange/5 text-brand-brown'
                                            : 'border-muted bg-transparent hover:border-muted-foreground'
                                            }`}
                                    >
                                        <span className="text-sm font-semibold">{t('auth.role_pupil')}</span>
                                        <span className="mt-1 text-[10px] text-muted-foreground">{t('auth.pupil_desc')}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRole('teacher');
                                            setAgeError(null);
                                            setCertError(null);
                                        }}
                                        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 p-4 text-center transition-all ${role === 'teacher'
                                            ? 'border-brand-orange bg-brand-orange/5 text-brand-brown'
                                            : 'border-muted bg-transparent hover:border-muted-foreground'
                                            }`}
                                    >
                                        <span className="text-sm font-semibold">{t('auth.role_teacher')}</span>
                                        <span className="mt-1 text-[10px] text-muted-foreground">{t('auth.teacher_desc')}</span>
                                    </button>
                                    <input type="hidden" name="role" value={role} />
                                </div>
                                <InputError message={errors.role} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="age">
                                    {t('auth.age')}{' '}
                                    <span className="text-[11px] font-normal text-muted-foreground">
                                        ({role === 'teacher' ? '18+' : '8+'})
                                    </span>
                                </Label>
                                <Input
                                    id="age"
                                    type="number"
                                    required
                                    name="age"
                                    value={age}
                                    onChange={(e) => {
                                        setAge(e.target.value);
                                        if (ageError) setAgeError(null);
                                    }}
                                    autoComplete="bday"
                                    placeholder={role === 'teacher' ? '18' : '8'}
                                />
                                <InputError message={ageError || errors.age} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone_number">{t('auth.phone_number')}</Label>
                                <Input
                                    id="phone_number"
                                    type="tel"
                                    required
                                    name="phone_number"
                                    autoComplete="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                                    placeholder="+998 90 123 45 67"
                                />
                                <InputError message={errors.phone_number} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="gender">{t('auth.gender')}</Label>
                                <select
                                    id="gender"
                                    name="gender"
                                    defaultValue="prefer_not_to_say"
                                    className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="male">{t('auth.gender_male')}</option>
                                    <option value="female">{t('auth.gender_female')}</option>
                                    <option value="prefer_not_to_say">{t('auth.gender_prefer_not_to_say')}</option>
                                </select>
                                <InputError message={errors.gender} />
                            </div>

                            {/* PUPIL SPECIFIC SECTION */}
                            {role === 'pupil' && (
                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="level">{t('auth.target_level')}</Label>
                                        <select
                                            id="level"
                                            name="level"
                                            required
                                            className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="">{t('auth.select_level')}</option>
                                            <option value="beginner">{t('auth.level_beginner')}</option>
                                            <option value="pre-intermediate">{t('auth.level_pre_intermediate')}</option>
                                            <option value="upper-intermediate">{t('auth.level_upper_intermediate')}</option>
                                            <option value="advanced">{t('auth.level_advanced')}</option>
                                            <option value="ielts_band">{t('auth.level_ielts_band')}</option>
                                            <option value="cefr_band">{t('auth.level_cefr_band')}</option>
                                        </select>
                                        <InputError message={errors.level} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="ielts_certificates">{t('auth.pupil_certificates_label')}</Label>
                                        <Input
                                            id="ielts_certificates"
                                            type="file"
                                            name="ielts_certificates[]"
                                            multiple
                                            className="mt-1 block w-full"
                                            accept=".pdf,.png,.jpg,.jpeg"
                                        />
                                        <InputError message={errors.ielts_certificates} />
                                    </div>
                                </div>
                            )}

                            {/* TEACHER SPECIFIC SECTION */}
                            {role === 'teacher' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="price">{t('auth.hourly_rate')}</Label>
                                        <div className="relative">
                                            <Input
                                                id="price"
                                                type="text"
                                                inputMode="numeric"
                                                autoComplete="off"
                                                value={price}
                                                onChange={(e) => setPrice(formatPrice(e.target.value))}
                                                className="pr-16"
                                                placeholder={t('auth.hourly_rate_placeholder')}
                                            />
                                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-bold text-muted-foreground select-none">
                                                {t('auth.currency_som') || "so'm"}
                                            </span>
                                            <input type="hidden" name="price" value={price.replace(/\s/g, '')} />
                                        </div>
                                        <InputError message={errors.price} />
                                    </div>

                                    {/* Multi-Certificate Repeater Section */}
                                    <div id="certificates-section" className="mt-6 space-y-4 rounded-3xl border border-blue-100 bg-blue-50/30 p-5 dark:border-blue-900/40 dark:bg-blue-950/10">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <h3 className="text-base font-extrabold text-brand-navy dark:text-white">
                                                    {t('auth.certificates_heading')}
                                                </h3>
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    {t('auth.certificates_subheading')}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={addCertificate}
                                                className="border-indigo-200 bg-white font-bold text-indigo-600 hover:bg-indigo-50 dark:bg-gray-800 dark:text-indigo-400"
                                            >
                                                {t('auth.add_certificate')}
                                            </Button>
                                        </div>

                                        {certError && (
                                            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                                                {certError}
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            {certificates.map((cert, index) => (
                                                <CertificateInputCard
                                                    key={index}
                                                    index={index}
                                                    cert={cert}
                                                    isRequiredUpload={true}
                                                    fileFieldName={`certificates[${index}][file]`}
                                                    onChange={(updated) => updateCertificate(index, updated)}
                                                    onRemove={() => requestRemoveCertificate(index)}
                                                    canRemove={certificates.length > 1}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {!google_register && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">{t('auth.password')}</Label>
                                        <PasswordInput
                                            id="password"
                                            required
                                            tabIndex={3}
                                            autoComplete="new-password"
                                            name="password"
                                            placeholder={t('auth.password')}
                                            passwordrules={passwordRules}
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="password_confirmation">{t('auth.confirm_password')}</Label>
                                        <PasswordInput
                                            id="password_confirmation"
                                            required
                                            tabIndex={4}
                                            autoComplete="new-password"
                                            name="password_confirmation"
                                            placeholder={t('auth.confirm_password')}
                                            passwordrules={passwordRules}
                                        />
                                        <InputError message={errors.password_confirmation} />
                                    </div>
                                </>
                            )}

                            {/* 3. Direct Submit Button onClick Guard */}
                            <Button
                                type="submit"
                                className="mt-2 w-full cursor-pointer"
                                tabIndex={5}
                                data-test="register-user-button"
                                onClick={(e) => {
                                    if (!validateForm()) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }
                                }}
                            >
                                {processing && <Spinner />}
                                {t('auth.register_button')}
                            </Button>

                            <p className="text-center text-xs text-muted-foreground">
                                {locale === 'uz' ? (
                                    <>
                                        Davom etish orqali siz ConvoMate'ning{' '}
                                        <a href="/terms" className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80">
                                            {t('auth.terms_service')}
                                        </a>{' '}
                                        va{' '}
                                        <a href="/privacy" className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80">
                                            {t('auth.privacy_policy')}
                                        </a>
                                        ga rozilik bildirasiz.
                                    </>
                                ) : locale === 'ru' ? (
                                    <>
                                        Продолжая, вы соглашаетесь с{' '}
                                        <a href="/terms" className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80">
                                            {t('auth.terms_service')}
                                        </a>{' '}
                                        и{' '}
                                        <a href="/privacy" className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80">
                                            {t('auth.privacy_policy')}
                                        </a>{' '}
                                        ConvoMate.
                                    </>
                                ) : (
                                    <>
                                        By continuing, you agree to ConvoMate's{' '}
                                        <a href="/terms" className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80">
                                            {t('auth.terms_service')}
                                        </a>{' '}
                                        and{' '}
                                        <a href="/privacy" className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80">
                                            {t('auth.privacy_policy')}
                                        </a>.
                                    </>
                                )}
                            </p>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            {t('auth.has_account')}{' '}
                            <TextLink href={login()} tabIndex={6}>
                                {t('auth.login_button')}
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

function AuthLayoutWrapper({ children }: { children: React.ReactNode }) {
    const { t } = useTranslation();
    return (
        <AuthLayout
            title={t('auth.create_account_title')}
            description={t('auth.create_account_desc')}
        >
            {children}
        </AuthLayout>
    );
}

Register.layout = (page: React.ReactNode) => {
    return <AuthLayoutWrapper>{page}</AuthLayoutWrapper>;
};