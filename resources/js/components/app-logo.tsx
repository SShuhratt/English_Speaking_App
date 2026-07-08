import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            {/* Circle logo frame using the premium brand logo */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-brand-navy/10 bg-white shadow-md shadow-brand-navy/10 transition-transform group-hover:scale-105">
                <img
                    src="/images/logo.png"
                    alt="ConvoMate"
                    className="h-full w-full object-cover"
                />
            </div>
            <span className="ml-2 text-base font-black tracking-tight text-brand-navy">
                Convo<span className="text-brand-yellow">Mate</span>
            </span>
        </>
    );
}
