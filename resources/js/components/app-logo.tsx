import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center">
                <AppLogoIcon className="size-8" />
            </div>
            <div className="ml-2 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate text-base font-black tracking-tight text-foreground">
                    Convo<span className="text-yellow-500 dark:text-brand-yellow">Mate</span>
                </span>
            </div>
        </>
    );
}
