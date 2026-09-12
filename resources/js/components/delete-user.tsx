import { Form, usePage } from '@inertiajs/react';
import { useRef } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import type { Auth } from '@/types';

export default function DeleteUser() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const hasPassword = auth?.user?.has_password ?? true;
    const userEmail = auth?.user?.email ?? '';
    const inputRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation();

    return (
        <div className="space-y-4 rounded-[20px] border border-red-100 bg-red-50 p-6">
            <div className="relative space-y-0.5 text-red-600">
                <p className="font-medium">Warning</p>
                <p className="text-sm">
                    Please proceed with caution, this cannot be undone.
                </p>
            </div>

            <Dialog>
                <DialogTrigger asChild>
                    <Button
                        variant="destructive"
                        data-test="delete-user-button"
                    >
                        Delete account
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogTitle>
                        Are you sure you want to delete your account?
                    </DialogTitle>
                    <DialogDescription className="space-y-3 text-left">
                        <p>
                            Once your account is deleted, all of its resources and
                            data will also be permanently deleted.{' '}
                            {hasPassword
                                ? t('profile.delete_confirm_desc_password')
                                : t('profile.delete_confirm_desc_email', {
                                      email: userEmail,
                                  })}
                        </p>
                        {auth?.user?.google_connected && (
                            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                                <Calendar className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                                <div>
                                    <span className="font-bold">Google Calendar: </span>
                                    <span>
                                        {t('profile.delete_account_google_calendar_notice') ||
                                            'Your Google Calendar connection will be automatically cancelled, and third-party access will be revoked from your Google Account.'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </DialogDescription>

                    <Form
                        {...ProfileController.destroy.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        onError={() => inputRef.current?.focus()}
                        resetOnSuccess
                        className="space-y-6"
                    >
                        {({ resetAndClearErrors, processing, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    {hasPassword ? (
                                        <>
                                            <Label
                                                htmlFor="password"
                                                className="sr-only"
                                            >
                                                Password
                                            </Label>

                                            <PasswordInput
                                                id="password"
                                                name="password"
                                                ref={inputRef}
                                                placeholder="Password"
                                                autoComplete="current-password"
                                            />

                                            <InputError
                                                message={errors.password}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <Label
                                                htmlFor="email"
                                                className="sr-only"
                                            >
                                                Email
                                            </Label>

                                            <Input
                                                id="email"
                                                type="email"
                                                name="email"
                                                ref={inputRef}
                                                placeholder={t(
                                                    'profile.delete_email_placeholder',
                                                )}
                                                autoComplete="email"
                                                className="mt-1 block w-full"
                                            />

                                            <InputError
                                                message={errors.email}
                                            />
                                        </>
                                    )}
                                </div>

                                <DialogFooter className="gap-2">
                                    <DialogClose asChild>
                                        <Button
                                            variant="secondary"
                                            onClick={() =>
                                                resetAndClearErrors()
                                            }
                                        >
                                            Cancel
                                        </Button>
                                    </DialogClose>

                                    <Button
                                        variant="destructive"
                                        disabled={processing}
                                        asChild
                                    >
                                        <button
                                            type="submit"
                                            data-test="confirm-delete-user-button"
                                        >
                                            Delete account
                                        </button>
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
