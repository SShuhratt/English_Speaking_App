import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import {
    evaluatePasswordRules,
    PasswordConfirmationStatus,
    PasswordRequirements,
} from '@/components/password-requirements';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useTranslation } from '@/hooks/use-translation';
import AuthLayout from '@/layouts/auth-layout';
import { update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
    passwordRules: string;
};

export default function ResetPassword({ token, email, passwordRules }: Props) {
    const { t } = useTranslation();
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordConfirmationError, setPasswordConfirmationError] = useState<string | null>(null);

    const validatePasswords = (): boolean => {
        setPasswordError(null);
        setPasswordConfirmationError(null);

        const passwordInput = document.getElementById('password') as HTMLInputElement | null;
        const confirmInput = document.getElementById('password_confirmation') as HTMLInputElement | null;
        const currentPassword = passwordInput?.value ?? password;
        const currentConfirm = confirmInput?.value ?? passwordConfirmation;

        if (!evaluatePasswordRules(currentPassword).isValid) {
            setPasswordTouched(true);
            setPasswordError(t('auth.password_rules_invalid'));
            passwordInput?.focus();
            return false;
        }

        if (currentPassword !== currentConfirm) {
            setPasswordConfirmationError(t('auth.password_mismatch'));
            confirmInput?.focus();
            return false;
        }

        return true;
    };

    return (
        <>
            <Head title={t('auth.reset_password_title')} />

            <Form
                {...update.form()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
                onBefore={() => {
                    if (!validatePasswords()) {
                        return false;
                    }
                }}
                onSuccess={() => {
                    setPassword('');
                    setPasswordConfirmation('');
                    setPasswordTouched(false);
                    setPasswordError(null);
                    setPasswordConfirmationError(null);
                }}
            >
                {({ processing, errors }) => (
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="email">{t('auth.email')}</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={email}
                                className="mt-1 block w-full"
                                readOnly
                            />
                            <InputError
                                message={errors.email}
                                className="mt-2"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">{t('auth.password')}</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                autoComplete="new-password"
                                className="mt-1 block w-full"
                                autoFocus
                                value={password}
                                onChange={(e) => {
                                    const nextValue = e.target.value;
                                    setPassword(nextValue);
                                    if (passwordError && evaluatePasswordRules(nextValue).isValid) {
                                        setPasswordError(null);
                                    }
                                    if (passwordConfirmationError && nextValue === passwordConfirmation) {
                                        setPasswordConfirmationError(null);
                                    }
                                }}
                                onBlur={() => setPasswordTouched(true)}
                                aria-describedby="reset-password-requirements"
                                placeholder={t('auth.password')}
                                passwordrules={passwordRules}
                            />
                            <PasswordRequirements
                                id="reset-password-requirements"
                                password={password}
                                highlightUnmet={passwordTouched || Boolean(passwordError || errors.password)}
                            />
                            <InputError message={passwordError || errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">
                                {t('auth.confirm_password')}
                            </Label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                autoComplete="new-password"
                                className="mt-1 block w-full"
                                value={passwordConfirmation}
                                onChange={(e) => {
                                    const nextValue = e.target.value;
                                    setPasswordConfirmation(nextValue);
                                    if (passwordConfirmationError && nextValue === password) {
                                        setPasswordConfirmationError(null);
                                    }
                                }}
                                placeholder={t('auth.confirm_password')}
                                passwordrules={passwordRules}
                            />
                            {!(passwordConfirmationError || errors.password_confirmation) && (
                                <PasswordConfirmationStatus
                                    password={password}
                                    confirmPassword={passwordConfirmation}
                                />
                            )}
                            <InputError
                                message={passwordConfirmationError || errors.password_confirmation}
                                className="mt-2"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="mt-4 w-full"
                            disabled={processing}
                            data-test="reset-password-button"
                        >
                            {processing && <Spinner />}
                            {t('auth.reset_password_button')}
                        </Button>
                    </div>
                )}
            </Form>
        </>
    );
}

function AuthLayoutWrapper({ children }: { children: React.ReactNode }) {
    const { t } = useTranslation();
    return (
        <AuthLayout
            title={t('auth.reset_password_title')}
            description={t('auth.reset_password_desc')}
        >
            {children}
        </AuthLayout>
    );
}

ResetPassword.layout = (page: React.ReactNode) => {
    return <AuthLayoutWrapper>{page}</AuthLayoutWrapper>;
};

