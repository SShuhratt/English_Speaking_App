import { AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';

export interface PasswordValidationState {
    minLength: boolean;
    mixedCase: boolean;
    numbers: boolean;
    isValid: boolean;
}

/**
 * Evaluate password rules matching AppServiceProvider::configureDefaults():
 * at least 6 characters, uppercase and lowercase letters, and at least one number.
 */
export function evaluatePasswordRules(password: string): PasswordValidationState {
    const minLength = password.length >= 6;
    const mixedCase = /\p{Ll}/u.test(password) && /\p{Lu}/u.test(password);
    const numbers = /\p{N}/u.test(password);

    return {
        minLength,
        mixedCase,
        numbers,
        isValid: minLength && mixedCase && numbers,
    };
}

interface PasswordRequirementsProps {
    password: string;
    highlightUnmet?: boolean;
    className?: string;
    id?: string;
}

export function PasswordRequirements({
    password,
    highlightUnmet = false,
    className,
    id,
}: PasswordRequirementsProps) {
    const { t } = useTranslation();
    const state = evaluatePasswordRules(password);

    const rules = [
        {
            key: 'minLength',
            label: t('auth.password_rule_min_length'),
            met: state.minLength,
        },
        {
            key: 'mixedCase',
            label: t('auth.password_rule_mixed_case'),
            met: state.mixedCase,
        },
        {
            key: 'numbers',
            label: t('auth.password_rule_number'),
            met: state.numbers,
        },
    ];

    const metCount = rules.filter((rule) => rule.met).length;

    return (
        <div
            id={id}
            aria-live="polite"
            className={cn(
                'rounded-xl border border-border/80 bg-muted/40 px-3.5 py-3 text-xs transition-colors dark:bg-muted/20',
                className,
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground">
                    {t('auth.password_rules_title')}
                </span>
                <span
                    className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums transition-colors',
                        state.isValid
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'bg-muted text-muted-foreground',
                    )}
                >
                    {metCount}/{rules.length}
                </span>
            </div>

            <ul className="mt-2 space-y-1.5">
                {rules.map((rule) => {
                    const showError = !rule.met && highlightUnmet;

                    return (
                        <li
                            key={rule.key}
                            className={cn(
                                'flex items-center gap-2 transition-colors duration-150',
                                rule.met
                                    ? 'font-medium text-emerald-700 dark:text-emerald-300'
                                    : showError
                                      ? 'text-red-600 dark:text-red-400'
                                      : 'text-muted-foreground',
                            )}
                        >
                            {rule.met ? (
                                <CheckCircle2
                                    className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                                    aria-hidden="true"
                                />
                            ) : showError ? (
                                <AlertCircle
                                    className="h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400"
                                    aria-hidden="true"
                                />
                            ) : (
                                <Circle
                                    className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60"
                                    aria-hidden="true"
                                />
                            )}
                            <span>{rule.label}</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

interface PasswordConfirmationStatusProps {
    password: string;
    confirmPassword: string;
    className?: string;
}

export function PasswordConfirmationStatus({
    password,
    confirmPassword,
    className,
}: PasswordConfirmationStatusProps) {
    const { t } = useTranslation();

    if (confirmPassword.length === 0) {
        return null;
    }

    const matches = password.length > 0 && password === confirmPassword;

    return (
        <p
            aria-live="polite"
            className={cn(
                'flex items-center gap-1.5 text-xs font-medium',
                matches
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-red-600 dark:text-red-400',
                className,
            )}
        >
            {matches ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            ) : (
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>{matches ? t('auth.password_match') : t('auth.password_mismatch')}</span>
        </p>
    );
}

