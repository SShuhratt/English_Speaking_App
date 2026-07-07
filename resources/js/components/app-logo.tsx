import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-brand-navy">
                <AppLogoIcon className="size-5 text-brand-yellow" />
            </div>
            <div className="ml-2 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate text-base font-extrabold tracking-tight text-brand-navy">
                    Convo<span className="text-brand-yellow" style={{ textShadow: '0 0 0 #fae18e' }}>Mate</span>
                </span>
            </div>
        </>
    );
}
