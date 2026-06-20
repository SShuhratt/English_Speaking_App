import { Form, Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
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

type Props = {
    passwordRules: string;
};

export default function Register({ passwordRules }: Props) {
    const [role, setRole] = useState<'teacher' | 'pupil'>('pupil');
    const { t } = useTranslation();
    const { google_register } = usePage<any>().props;

    return (
        <>
            <Head title={t('auth.register')} />

            {google_register && (
                <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-sm text-indigo-900 dark:border-indigo-900/30 dark:bg-indigo-950/20 dark:text-indigo-200 mb-2">
                    <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <div>
                        <span className="font-semibold">{t('auth.registering_with_google')}</span> {google_register.email}. Your email will be verified automatically.
                    </div>
                </div>
            )}

            {!google_register && (
                <>
                    <a
                        href="/auth/google"
                        className="flex items-center justify-center gap-2.5 rounded-xl border border-input bg-background hover:bg-muted/50 px-4 py-2.5 text-sm font-semibold transition-all shadow-sm cursor-pointer mb-2 text-foreground"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2001/XMLSchema">
                            <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1l3.18,2.48c1.86,-1.72 2.93,-4.25 2.93,-7.22C21.45,11.77 21.41,11.41 21.35,11.1z" fill="#4285f4" />
                            <path d="M12,20.62c2.6,0 4.78,-0.86 6.37,-2.34l-3.18,-2.48c-0.88,0.59 -2.01,0.94 -3.19,0.94c-2.45,0 -4.53,-1.66 -5.27,-3.9L3.48,16.27c1.61,3.19 4.91,5.35 8.52,5.35z" fill="#34a853" />
                            <path d="M6.73,12.84c-0.19,-0.57 -0.3,-1.18 -0.3,-1.81s0.11,-1.24 0.3,-1.81L3.48,6.48C2.75,7.93 2.33,9.57 2.33,11.03c0,1.46 0.42,3.1 1.15,4.55L6.73,12.84z" fill="#fbbc05" />
                            <path d="M12,5.92c1.41,0 2.68,0.49 3.68,1.44l2.76,-2.76C16.77,3.1 14.6,2.38 12,2.38C8.39,2.38 5.09,4.54 3.48,7.73l3.25,2.51c0.74,-2.24 2.82,-3.9 5.27,-3.9z" fill="#ea4335" />
                        </svg>
                        {t('auth.continue_with_google')}
                    </a>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-border"></div>
                        <span className="flex-shrink mx-4 text-muted-foreground text-xs uppercase font-semibold tracking-wider">Or register with email</span>
                        <div className="flex-grow border-t border-border"></div>
                    </div>
                </>
            )}

            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
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
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    defaultValue={google_register?.name || ''}
                                    placeholder={t('auth.full_name_placeholder')}
                                />
                                <InputError
                                    message={errors.name}
                                    className="mt-2"
                                />
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
                                    className={google_register ? "bg-muted cursor-not-allowed" : ""}
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label>{t('auth.join_as')}</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setRole('pupil')}
                                        className={`flex flex-col items-center justify-center rounded-xl border-2 p-4 text-center cursor-pointer transition-all ${
                                            role === 'pupil'
                                                ? 'border-indigo-600 bg-indigo-50/30 text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-200'
                                                : 'border-muted hover:border-muted-foreground bg-transparent'
                                        }`}
                                    >
                                        <span className="font-semibold text-sm">{t('auth.role_pupil')}</span>
                                        <span className="text-[10px] text-muted-foreground mt-1">{t('auth.pupil_desc')}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole('teacher')}
                                        className={`flex flex-col items-center justify-center rounded-xl border-2 p-4 text-center cursor-pointer transition-all ${
                                            role === 'teacher'
                                                ? 'border-indigo-600 bg-indigo-50/30 text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-200'
                                                : 'border-muted hover:border-muted-foreground bg-transparent'
                                        }`}
                                    >
                                        <span className="font-semibold text-sm">{t('auth.role_teacher')}</span>
                                        <span className="text-[10px] text-muted-foreground mt-1">{t('auth.teacher_desc')}</span>
                                    </button>
                                    <input type="hidden" name="role" value={role} />
                                </div>
                                <InputError message={errors.role} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="age">{t('auth.age')}</Label>
                                <Input
                                    id="age"
                                    type="number"
                                    required
                                    name="age"
                                    placeholder={t('auth.age_placeholder')}
                                />
                                <InputError message={errors.age} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone_number">{t('auth.phone_number')}</Label>
                                <Input
                                    id="phone_number"
                                    type="text"
                                    required
                                    name="phone_number"
                                    placeholder="+998 90 123 4567"
                                />
                                <InputError message={errors.phone_number} />
                            </div>

                            {role === 'pupil' && (
                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="level">{t('auth.target_level')}</Label>
                                        <select
                                            id="level"
                                            name="level"
                                            required
                                            className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="">{t('auth.select_level')}</option>
                                            <option value="beginner">Beginner</option>
                                            <option value="pre-intermediate">Pre-Intermediate</option>
                                            <option value="upper-intermediate">Upper-Intermediate</option>
                                            <option value="advanced">Advanced</option>
                                            <option value="ielts_band">IELTS Band</option>
                                            <option value="cefr_band">CEFR Band</option>
                                        </select>
                                        <InputError message={errors.level} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="ielts_certificates">Upload IELTS Certificate(s) (PDF or Image)</Label>
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

                            {role === 'teacher' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="overall_level">{t('auth.overall_level')}</Label>
                                        <Input
                                            id="overall_level"
                                            type="text"
                                            required
                                            name="overall_level"
                                            placeholder="e.g. IELTS 8.5"
                                        />
                                        <InputError message={errors.overall_level} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="speaking_band">{t('auth.speaking_band')}</Label>
                                        <Input
                                            id="speaking_band"
                                            type="number"
                                            step="0.5"
                                            required
                                            name="speaking_band"
                                            placeholder="e.g. 8.5"
                                        />
                                        <InputError message={errors.speaking_band} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label className="text-sm font-semibold">{t('labels.title')}</Label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1.5">
                                            {['mock', 'freestyle', 'lessons', 'business english', 'practice q&a'].map((lbl) => (
                                                <label key={lbl} className="flex items-center gap-2.5 text-sm font-medium cursor-pointer border rounded-xl p-3 hover:bg-muted/40 transition-colors select-none">
                                                    <input
                                                        type="checkbox"
                                                        name="labels[]"
                                                        value={lbl}
                                                        className="rounded border-input text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span>{t(`labels.${lbl}`)}</span>
                                                </label>
                                            ))}
                                        </div>
                                        <InputError message={errors.labels} />
                                    </div>

                                    <div className="grid gap-2 mt-4">
                                        <Label htmlFor="ielts_certificates">Upload IELTS Certificate(s) (PDF or Image)</Label>
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
                                        <Label htmlFor="password_confirmation">
                                            {t('auth.confirm_password')}
                                        </Label>
                                        <PasswordInput
                                            id="password_confirmation"
                                            required
                                            tabIndex={4}
                                            autoComplete="new-password"
                                            name="password_confirmation"
                                            placeholder={t('auth.confirm_password')}
                                            passwordrules={passwordRules}
                                        />
                                        <InputError
                                            message={errors.password_confirmation}
                                        />
                                    </div>
                                </>
                            )}

                            <Button
                                type="submit"
                                className="mt-2 w-full cursor-pointer"
                                tabIndex={5}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                {t('auth.register_button')}
                            </Button>
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
