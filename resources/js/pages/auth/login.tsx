import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasskeyVerify from '@/components/passkey-verify';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { useTranslation } from '@/hooks/use-translation';
import AuthLayout from '@/layouts/auth-layout';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    const { t } = useTranslation();

    return (
        <>
            <Head title={t('auth.login')} />

            <PasskeyVerify />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">
                                    {t('auth.email_address')}
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">
                                        {t('auth.password')}
                                    </Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm"
                                            tabIndex={5}
                                        >
                                            {t('auth.forgot_password')}
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder={t('auth.password')}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label htmlFor="remember">
                                    {t('auth.remember_me')}
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-4 w-full cursor-pointer"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                {t('auth.login_button')}
                            </Button>

                            <div className="relative flex items-center py-1">
                                <div className="flex-grow border-t border-border"></div>
                                <span className="mx-4 flex-shrink text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Or continue with
                                </span>
                                <div className="flex-grow border-t border-border"></div>
                            </div>

                            <a
                                href="/auth/google"
                                className="flex cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-muted/50"
                            >
                                <svg
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1l3.18,2.48c1.86,-1.72 2.93,-4.25 2.93,-7.22C21.45,11.77 21.41,11.41 21.35,11.1z"
                                        fill="#4285f4"
                                    />
                                    <path
                                        d="M12,20.62c2.6,0 4.78,-0.86 6.37,-2.34l-3.18,-2.48c-0.88,0.59 -2.01,0.94 -3.19,0.94c-2.45,0 -4.53,-1.66 -5.27,-3.9L3.48,16.27c1.61,3.19 4.91,5.35 8.52,5.35z"
                                        fill="#34a853"
                                    />
                                    <path
                                        d="M6.73,12.84c-0.19,-0.57 -0.3,-1.18 -0.3,-1.81s0.11,-1.24 0.3,-1.81L3.48,6.48C2.75,7.93 2.33,9.57 2.33,11.03c0,1.46 0.42,3.1 1.15,4.55L6.73,12.84z"
                                        fill="#fbbc05"
                                    />
                                    <path
                                        d="M12,5.92c1.41,0 2.68,0.49 3.68,1.44l2.76,-2.76C16.77,3.1 14.6,2.38 12,2.38C8.39,2.38 5.09,4.54 3.48,7.73l3.25,2.51c0.74,-2.24 2.82,-3.9 5.27,-3.9z"
                                        fill="#ea4335"
                                    />
                                </svg>
                                {t('auth.continue_with_google')}
                            </a>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            {t('auth.no_account')}{' '}
                            <TextLink href={register()} tabIndex={5}>
                                {t('auth.sign_up')}
                            </TextLink>
                        </div>

                        <p className="mt-2 text-center text-xs text-muted-foreground">
                            <a
                                href="/terms"
                                className="underline hover:text-foreground"
                            >
                                Terms of Service
                            </a>{' '}
                            ·{' '}
                            <a
                                href="/privacy"
                                className="underline hover:text-foreground"
                            >
                                Privacy Policy
                            </a>
                        </p>
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </>
    );
}

function AuthLayoutWrapper({ children }: { children: React.ReactNode }) {
    const { t } = useTranslation();
    return (
        <AuthLayout
            title={t('auth.login_title')}
            description={t('auth.login_desc')}
        >
            {children}
        </AuthLayout>
    );
}

Login.layout = (page: React.ReactNode) => {
    return <AuthLayoutWrapper>{page}</AuthLayoutWrapper>;
};
