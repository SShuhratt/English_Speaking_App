import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col bg-[#061445] p-10 text-white lg:flex">
                <div className="absolute inset-0 bg-[#061445]" />
                <Link
                    href={home()}
                    className="relative z-20 flex items-center gap-2 text-lg font-bold"
                >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/20 bg-white shadow-md">
                        <img src="/logo.png" alt="ConvoMate" className="h-full w-full object-cover" />
                    </div>
                    <span>
                        Convo<span className="text-[#f5c518]">Mate</span>
                    </span>
                </Link>
                <div className="relative z-20 mt-auto">
                    <blockquote className="space-y-2">
                        <p className="text-lg text-white/80 italic">
                            "The limits of my language mean the limits of my world."
                        </p>
                        <footer className="text-sm text-white/50">Ludwig Wittgenstein</footer>
                    </blockquote>
                </div>
            </div>
            <div className="w-full lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <Link
                        href={home()}
                        className="relative z-20 flex items-center justify-center gap-2 lg:hidden"
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#061445]/10 bg-white shadow-md shadow-[#061445]/10">
                            <img src="/logo.png" alt="ConvoMate" className="h-full w-full object-cover" />
                        </div>
                        <span className="text-lg font-bold text-[#061445]">
                            Convo<span className="text-[#f5c518]">Mate</span>
                        </span>
                    </Link>
                    <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                        <h1 className="text-xl font-medium">{title}</h1>
                        <p className="text-sm text-balance text-muted-foreground">
                            {description}
                        </p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
