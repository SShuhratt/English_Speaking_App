import { Form, Head } from '@inertiajs/react';
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

    return (
        <>
            <Head title={t('auth.register')} />
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
                                </>
                            )}

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
