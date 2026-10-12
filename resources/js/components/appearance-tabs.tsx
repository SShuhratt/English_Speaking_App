import type { LucideIcon } from 'lucide-react';
import { Monitor, Moon, Sun } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';

export default function AppearanceToggleTab({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();
    const { t } = useTranslation();

    const tabs: { value: Appearance; icon: LucideIcon; labelKey: string }[] = [
        { value: 'light', icon: Sun, labelKey: 'appearance.light' },
        { value: 'dark', icon: Moon, labelKey: 'appearance.dark' },
        { value: 'system', icon: Monitor, labelKey: 'appearance.system' },
    ];

    return (
        <div
            className={cn(
                'inline-flex gap-1 rounded-xl bg-neutral-100 dark:bg-muted/80 p-1 border border-border/40',
                className,
            )}
            {...props}
        >
            {tabs.map(({ value, icon: Icon, labelKey }) => (
                <button
                    key={value}
                    onClick={() => updateAppearance(value)}
                    className={cn(
                        'flex cursor-pointer items-center rounded-lg px-3.5 py-1.5 transition-colors',
                        appearance === value
                            ? 'bg-white dark:bg-card text-foreground dark:text-brand-yellow font-bold shadow-xs'
                            : 'text-neutral-500 dark:text-muted-foreground hover:bg-neutral-200/60 dark:hover:bg-muted hover:text-black dark:hover:text-foreground',
                    )}
                >
                    <Icon className="-ml-1 h-4 w-4" />
                    <span className="ml-1.5 text-sm">{t(labelKey)}</span>
                </button>
            ))}
        </div>
    );
}
