import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';
import { useTranslation } from '@/hooks/use-translation';
import {
    BookOpen,
    Calendar,
    CheckCircle2,
    Globe2,
    GraduationCap,
    MessageCircle,
    Mic,
    Sparkles,
    Star,
    Users,
    Video,
    Zap,
    Globe,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import AppLogoIcon from '@/components/app-logo-icon';

export default function Welcome() {
    const { auth } = usePage<{ auth: { user: unknown } }>().props;
    const { t, locale, setLanguage } = useTranslation();

    return (
        <>
            <Head title={t('welcome.title')} />

            <div className="min-h-screen overflow-x-hidden bg-[#a2c1f2] font-sans text-slate-800 transition-colors duration-300 dark:bg-background dark:text-foreground">
                {/* ── Navbar ── */}
                <nav className="fixed top-0 right-0 left-0 z-50 bg-[#a2c1f2]/95 shadow-sm backdrop-blur-xl dark:bg-background/95">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                        <Link
                            href="/"
                            className="group flex items-center gap-2"
                        >
                            <AppLogoIcon className="h-8 w-8" />
                            <span className="text-xl font-black tracking-tight text-white">
                                Convo<span className="text-[#ffe4a0]">Mate</span>
                            </span>
                        </Link>

                        <div className="hidden items-center gap-8 text-sm font-bold text-white/90 md:flex">
                            <a
                                href="#features"
                                className="transition-colors hover:text-[#ffe4a0]"
                            >
                                {t('welcome.nav_features')}
                            </a>
                            <a
                                href="#how-it-works"
                                className="transition-colors hover:text-[#ffe4a0]"
                            >
                                {t('welcome.nav_how_it_works')}
                            </a>
                            <a
                                href="#teachers"
                                className="transition-colors hover:text-[#ffe4a0]"
                            >
                                {t('welcome.nav_teachers')}
                            </a>
                        </div>

                        <div className="flex items-center gap-3">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl px-3 font-semibold text-white hover:bg-white/10 hover:text-white"
                                    >
                                        <Globe className="h-4 w-4 text-white" />
                                        <span className="text-xs font-bold uppercase">
                                            {locale}
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="rounded-2xl border border-border/10 p-1.5 shadow-xl dark:bg-[#0F0F1E]"
                                >
                                    <DropdownMenuItem
                                        onClick={() => setLanguage('en')}
                                        className="flex cursor-pointer items-center justify-between rounded-xl px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-white/10"
                                    >
                                        <span className="text-sm font-medium">English</span>
                                        {locale === 'en' && <span className="h-2 w-2 rounded-full bg-[#ffe4a0]" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setLanguage('uz')}
                                        className="flex cursor-pointer items-center justify-between rounded-xl px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-white/10"
                                    >
                                        <span className="text-sm font-medium">O'zbek</span>
                                        {locale === 'uz' && <span className="h-2 w-2 rounded-full bg-[#ffe4a0]" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setLanguage('ru')}
                                        className="flex cursor-pointer items-center justify-between rounded-xl px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-white/10"
                                    >
                                        <span className="text-sm font-medium">Русский</span>
                                        {locale === 'ru' && <span className="h-2 w-2 rounded-full bg-[#ffe4a0]" />}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="rounded-full bg-[#ffe4a0] hover:bg-[#ffd67a] px-6 py-2.5 text-sm font-bold text-slate-900 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
                                >
                                    {t('nav.dashboard')}
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="rounded-xl px-4 py-2 text-sm font-semibold text-white/90 transition-colors hover:text-[#ffe4a0]"
                                    >
                                        {t('auth.login')}
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="rounded-full bg-[#ffe4a0] hover:bg-[#ffd67a] px-6 py-2.5 text-sm font-bold text-slate-900 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
                                    >
                                        {t('welcome.get_started')}
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                {/* ── Hero Section ── */}
                <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32 bg-[#a2c1f2] dark:bg-background">
                    {/* Decorative subtle glows */}
                    <div className="pointer-events-none absolute top-20 -left-32 h-[500px] w-[500px] rounded-full bg-white/10 blur-[128px]" />
                    <div className="pointer-events-none absolute top-40 -right-32 h-[400px] w-[400px] rounded-full bg-white/10 blur-[128px]" />

                    <div className="relative mx-auto max-w-7xl px-6">
                        <div className="grid items-center gap-12 lg:grid-cols-12">
                            {/* Left Side: Content */}
                            <div className="space-y-8 text-left lg:col-span-7">
                                <h1 className="text-5xl leading-[1.1] font-black tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
                                    <span className="text-[#ffe4a0] block mb-2">{t('welcome.title')}</span>
                                    <span className="block">{t('welcome.title_fluently')}</span>
                                </h1>

                                <p className="max-w-xl text-lg leading-relaxed text-white/90 md:text-xl">
                                    {t('welcome.subtitle')}
                                </p>

                                <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                                    <Link
                                        href={register()}
                                        className="group flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#ffe4a0] hover:bg-[#ffd67a] px-8 py-4 text-base font-bold text-slate-900 shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
                                    >
                                        {t('welcome.cta_start')}
                                        <Zap className="h-4 w-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12 fill-slate-900" />
                                    </Link>
                                </div>

                                {/* Trust Badges */}
                                <div className="flex flex-wrap items-center gap-8 border-t border-white/20 pt-8 text-sm text-white/80">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-[#ffe4a0]" />
                                        <span>{t('welcome.trust_learners')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Star className="h-4 w-4 fill-[#ffe4a0] text-[#ffe4a0]" />
                                        <span>{t('welcome.trust_rating')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Globe2 className="h-4 w-4 text-emerald-300" />
                                        <span>{t('welcome.trust_experts')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Mockup Call Card */}
                            <div className="relative mt-12 flex items-center justify-center lg:col-span-5 lg:mt-0 w-full">
                                <style dangerouslySetInnerHTML={{__html: `
                                    @keyframes float-slow {
                                        0%, 100% { transform: translateY(0px); }
                                        50% { transform: translateY(-8px); }
                                    }
                                    @keyframes pulse-glow {
                                        0%, 100% { opacity: 0.9; box-shadow: 0 0 15px rgba(6, 182, 212, 0.4); }
                                        50% { opacity: 1; box-shadow: 0 0 25px rgba(6, 182, 212, 0.7); }
                                    }
                                    @keyframes pulse-glow-purple {
                                        0%, 100% { opacity: 0.9; box-shadow: 0 0 15px rgba(168, 85, 247, 0.4); }
                                        50% { opacity: 1; box-shadow: 0 0 25px rgba(168, 85, 247, 0.7); }
                                    }
                                    .animate-float-slow {
                                        animation: float-slow 4s ease-in-out infinite;
                                    }
                                    .animate-pulse-glow-cyan {
                                        animation: pulse-glow 3.5s ease-in-out infinite;
                                    }
                                    .animate-pulse-glow-purple {
                                        animation: pulse-glow-purple 3.5s ease-in-out infinite;
                                    }
                                `}} />

                                <div className="relative w-full max-w-lg aspect-[4/3] rounded-[2.5rem] p-6 md:p-8 shadow-[0_0_50px_-12px_rgba(168,85,247,0.3)] transition-all duration-300 overflow-visible flex flex-col justify-between">
                                    {/* Decorative fluid neon backgrounds inside card */}
                                    <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-[#0b0a21] via-[#1a0f30] to-[#08041a] rounded-[2.5rem] overflow-hidden border border-purple-500/20">
                                        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#06b6d4]/20 blur-[60px]" />
                                        <div className="absolute bottom-[-15%] left-[-15%] w-[75%] h-[75%] rounded-full bg-[#a855f7]/25 blur-[80px]" />
                                    </div>

                                    {/* Top-Left Floating Badge (Active Practice) */}
                                    <div className="absolute -top-6 -left-4 z-20 flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-100 dark:bg-[#121225] dark:border-white/5 animate-float-slow">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-500/20">
                                            <Mic className="h-4.5 w-4.5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-none">Active Practice</p>
                                            <p className="text-sm font-black text-slate-800 dark:text-white mt-0.5">Speak Freely</p>
                                        </div>
                                    </div>

                                    {/* Bottom-Right Floating Badge (Expert Feedback) */}
                                    <div className="absolute -bottom-6 -right-4 z-20 flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-100 dark:bg-[#121225] dark:border-white/5 animate-float-slow" style={{ animationDelay: '1.5s' }}>
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                                            <CheckCircle2 className="h-4.5 w-4.5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-none">Expert Feedback</p>
                                            <p className="text-sm font-black text-slate-800 dark:text-white mt-0.5">CEFR / IELTS</p>
                                        </div>
                                    </div>

                                    {/* Main Video Call Grid */}
                                    <div className="grid grid-cols-12 gap-3 items-center w-full mt-4 relative z-10">
                                        {/* Left User: Sarah */}
                                        <div className="col-span-4 relative group aspect-[3/4]">
                                            <div className="absolute inset-0 rounded-[1.5rem] overflow-hidden border border-white/10 bg-slate-900/60 shadow-xl">
                                                <img
                                                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300"
                                                    alt="Sarah M."
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                                <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5 bg-slate-950/70 backdrop-blur-md border border-white/10 py-1 px-2.5 rounded-lg">
                                                    <span className="text-xs">🇬🇧</span>
                                                    <span className="text-[10px] font-bold text-white truncate">Sarah M. (UK)</span>
                                                </div>
                                            </div>

                                            {/* Sarah's Speech Bubble */}
                                            <div className="absolute -top-12 left-2 z-20 flex items-center bg-[#070619]/90 backdrop-blur-md border border-[#06b6d4] py-1.5 px-3 rounded-2xl text-[10px] font-bold text-white whitespace-nowrap animate-pulse-glow-cyan">
                                                🇬🇧 Hello, let's practice!
                                                <div className="absolute -bottom-1 left-4 w-2 h-2 bg-[#070619] border-r border-b border-[#06b6d4] rotate-45" />
                                            </div>
                                        </div>

                                        {/* Center Panel: Transcript & Info */}
                                        <div className="col-span-4 flex flex-col gap-3 h-full justify-center">
                                            {/* Live Chat Log */}
                                            <div className="flex flex-col gap-2 bg-slate-950/50 backdrop-blur-md border border-white/5 p-3 rounded-2xl text-[9px] text-white">
                                                <div className="leading-tight">
                                                    <span className="font-extrabold text-[#06b6d4]">Sarah:</span>{' '}
                                                    <span className="text-white/80">Focus on pronunciation.</span>
                                                </div>
                                                <div className="leading-tight">
                                                    <span className="font-extrabold text-[#a855f7]">David:</span>{' '}
                                                    <span className="text-white/80">Absolutely! Sounds good.</span>
                                                </div>
                                                <div className="flex items-center justify-between text-[8px] text-white/40 mt-0.5 pt-1 border-t border-white/5">
                                                    <span>7:35 AM</span>
                                                    <Mic className="h-2 w-2 text-[#06b6d4]" />
                                                </div>
                                            </div>

                                            {/* Lesson Outline */}
                                            <div className="flex flex-col gap-1.5 bg-slate-950/50 backdrop-blur-md border border-white/5 p-3 rounded-2xl text-[9px] text-white">
                                                <p className="font-extrabold text-white/95 leading-none">Lesson outline</p>
                                                <div className="mt-1">
                                                    <span className="text-white/40 block text-[8px]">Topic:</span>
                                                    <span className="font-black text-[#ffe4a0]">Daily Conversation</span>
                                                </div>
                                                <div>
                                                    <span className="text-white/40 block text-[8px]">Next:</span>
                                                    <span className="font-black text-white/80">Common Idioms</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right User: David */}
                                        <div className="col-span-4 relative group aspect-[3/4]">
                                            <div className="absolute inset-0 rounded-[1.5rem] overflow-hidden border border-white/10 bg-slate-900/60 shadow-xl">
                                                <img
                                                    src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300"
                                                    alt="David L."
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                                <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5 bg-slate-950/70 backdrop-blur-md border border-white/10 py-1 px-2.5 rounded-lg">
                                                    <span className="text-xs">🇺🇸</span>
                                                    <span className="text-[10px] font-bold text-white truncate">David L. (US)</span>
                                                </div>
                                            </div>

                                            {/* David's Speech Bubble */}
                                            <div className="absolute -bottom-10 right-2 z-20 flex items-center bg-[#070619]/90 backdrop-blur-md border border-[#a855f7] py-1.5 px-3 rounded-2xl text-[10px] font-bold text-white whitespace-nowrap animate-pulse-glow-purple">
                                                🇺🇸 Great! How's this sound?
                                                <div className="absolute -top-1 right-4 w-2 h-2 bg-[#070619] border-l border-t border-[#a855f7] rotate-45" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Control Panel Footer */}
                                    <div className="flex items-center justify-center gap-3.5 mt-4 relative z-10 w-full">
                                        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 transition-all hover:text-white">
                                            <Mic className="h-4.5 w-4.5" />
                                        </button>
                                        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 transition-all hover:text-white">
                                            <Video className="h-4.5 w-4.5" />
                                        </button>
                                        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5">
                                                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                                                <path fillRule="evenodd" d="M1.372 18.364A3 3 0 0 0 4.5 22h15a3 3 0 0 0 3.128-3.636l-1.5-7.5A3 3 0 0 0 18 8.5H6a3 3 0 0 0-3.128 2.364l-1.5 7.5ZM6 10.5h12a1 1 0 0 1 1.043.788l1.5 7.5A1 1 0 0 1 19.5 20h-15a1 1 0 0 1-1.043-1.212l1.5-7.5A1 1 0 0 1 6 10.5Z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 transition-all hover:text-white">
                                            <MessageCircle className="h-4.5 w-4.5" />
                                        </button>
                                        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-500/20 hover:bg-rose-700 transition-all">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5 rotate-[135deg]">
                                                <path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c1.358 3.35 4.065 6.058 7.415 7.415l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Features Section ── */}
                <section id="features" className="relative py-20 lg:py-28">
                    <div className="pointer-events-none absolute top-0 right-0 h-[300px] w-[300px] rounded-full bg-brand-orange/5 blur-[100px]" />
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="space-y-4 text-center">
                            <h2 className="text-3xl font-black tracking-tight md:text-4xl lg:text-5xl">
                                {t('welcome.features_title')}{' '}
                                <span className="text-brand-orange">
                                    {t('welcome.features_title_highlight')}
                                </span>
                            </h2>
                            <p className="mx-auto max-w-2xl text-muted-foreground">
                                {t('welcome.features_subtitle')}
                            </p>
                        </div>

                        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {[
                                {
                                    icon: Video,
                                    title: t('welcome.feature_1_title'),
                                    desc: t('welcome.feature_1_desc'),
                                    color: 'from-brand-orange to-brand-button',
                                    shadow: 'shadow-brand-button/20',
                                },
                                {
                                    icon: Calendar,
                                    title: t('welcome.feature_2_title'),
                                    desc: t('welcome.feature_2_desc'),
                                    color: 'from-purple-500 to-pink-600',
                                    shadow: 'shadow-purple-500/20',
                                },
                                {
                                    icon: GraduationCap,
                                    title: t('welcome.feature_3_title'),
                                    desc: t('welcome.feature_3_desc'),
                                    color: 'from-emerald-500 to-teal-600',
                                    shadow: 'shadow-emerald-500/20',
                                },
                                {
                                    icon: MessageCircle,
                                    title: t('welcome.feature_4_title'),
                                    desc: t('welcome.feature_4_desc'),
                                    color: 'from-amber-500 to-orange-600',
                                    shadow: 'shadow-amber-500/20',
                                },
                                {
                                    icon: Sparkles,
                                    title: t('welcome.feature_5_title'),
                                    desc: t('welcome.feature_5_desc'),
                                    color: 'from-pink-500 to-rose-600',
                                    shadow: 'shadow-pink-500/20',
                                },
                                {
                                    icon: BookOpen,
                                    title: t('welcome.feature_6_title'),
                                    desc: t('welcome.feature_6_desc'),
                                    color: 'from-cyan-500 to-blue-600',
                                    shadow: 'shadow-cyan-500/20',
                                },
                            ].map((feature) => (
                                <div
                                    key={feature.title}
                                    className="group relative rounded-3xl border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:border-brand-orange/30 hover:shadow-xl hover:shadow-brand-button/5"
                                >
                                    <div
                                        className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} shadow-lg ${feature.shadow} transition-transform duration-300 group-hover:scale-110`}
                                    >
                                        <feature.icon className="h-6 w-6 text-white" />
                                    </div>
                                    <h3 className="mb-3 text-lg font-bold">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                        {feature.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── How It Works ── */}
                <section
                    id="how-it-works"
                    className="relative bg-gradient-to-b from-brand-yellow via-brand-cream/40 to-brand-yellow py-20 lg:py-28 dark:from-background dark:via-[#271406]/30 dark:to-background"
                >
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="space-y-4 text-center">
                            <h2 className="text-3xl font-black tracking-tight md:text-4xl lg:text-5xl">
                                {t('welcome.how_title')}{' '}
                                <span className="text-brand-orange">
                                    {t('welcome.how_title_highlight')}
                                </span>
                            </h2>
                            <p className="mx-auto max-w-2xl text-muted-foreground">
                                {t('welcome.how_subtitle')}
                            </p>
                        </div>

                        <div className="relative mt-16 grid gap-8 md:grid-cols-3">
                            {[
                                {
                                    step: '01',
                                    title: t('welcome.how_step_1_title'),
                                    desc: t('welcome.how_step_1_desc'),
                                },
                                {
                                    step: '02',
                                    title: t('welcome.how_step_2_title'),
                                    desc: t('welcome.how_step_2_desc'),
                                },
                                {
                                    step: '03',
                                    title: t('welcome.how_step_3_title'),
                                    desc: t('welcome.how_step_3_desc'),
                                },
                            ].map((item) => (
                                <div
                                    key={item.step}
                                    className="group relative rounded-3xl border border-transparent p-8 text-center transition-all duration-300 hover:border-brand-orange/20 hover:bg-brand-orange/5"
                                >
                                    <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
                                        <div className="animate-pulse-slow absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-orange/10 to-brand-button/10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6" />
                                        <span className="relative bg-gradient-to-br from-brand-orange to-brand-button bg-clip-text text-3xl font-black text-transparent">
                                            {item.step}
                                        </span>
                                    </div>
                                    <h3 className="mb-3 text-xl font-bold">
                                        {item.title}
                                    </h3>
                                    <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Teacher Showcase ── */}
                <section id="teachers" className="relative py-20 lg:py-28">
                    <div className="pointer-events-none absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-brand-orange/5 blur-[100px]" />
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="space-y-4 text-center">
                            <h2 className="text-3xl font-black tracking-tight md:text-4xl lg:text-5xl">
                                {t('welcome.teachers_title')}{' '}
                                <span className="text-brand-orange">
                                    {t('welcome.teachers_title_highlight')}
                                </span>
                            </h2>
                            <p className="mx-auto max-w-2xl text-muted-foreground">
                                {t('welcome.teachers_subtitle')}
                            </p>
                        </div>

                        <div className="mt-16 grid gap-8 md:grid-cols-3">
                            {[
                                {
                                    name: 'Sarah Thompson',
                                    level: 'IELTS 9.0 · Speaking 9.0',
                                    exp: 5,
                                    rating: 4.9,
                                    reviews: 142,
                                    initials: 'ST',
                                    gradient:
                                        'from-brand-orange via-brand-button to-brand-blue',
                                },
                                {
                                    name: 'James Wilson',
                                    level: 'CEFR C2 · IELTS 8.5',
                                    exp: 3,
                                    rating: 4.8,
                                    reviews: 98,
                                    initials: 'JW',
                                    gradient:
                                        'from-brand-blue via-brand-button to-brand-orange',
                                },
                                {
                                    name: 'Emma Davis',
                                    level: 'IELTS 8.5 · Speaking 8.5',
                                    exp: 7,
                                    rating: 5.0,
                                    reviews: 231,
                                    initials: 'ED',
                                    gradient:
                                        'from-emerald-400 via-emerald-500 to-teal-500',
                                },
                            ].map((teacher) => (
                                <div
                                    key={teacher.name}
                                    className="group rounded-3xl border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:border-brand-orange/30 hover:shadow-xl hover:shadow-brand-button/5"
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${teacher.gradient} text-lg font-bold text-white shadow-lg shadow-brand-button/10 transition-transform duration-300 group-hover:scale-105`}
                                        >
                                            {teacher.initials}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold">
                                                {teacher.name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {teacher.level}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-center justify-between border-t border-border pt-6 text-sm">
                                        <div className="flex items-center gap-1.5">
                                            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                                            <span className="font-bold">
                                                {teacher.rating}
                                            </span>
                                            <span className="text-muted-foreground">
                                                ({t('teachers.reviews_count', { count: teacher.reviews })})
                                            </span>
                                        </div>
                                        <span className="font-semibold text-muted-foreground">
                                            {t('teachers.years_experience', { count: teacher.exp })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA Section ── */}
                <section className="relative py-20 lg:py-28">
                    <div className="mx-auto max-w-4xl px-6 text-center">
                        <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e3a8a] via-[#1e40af] to-[#0d9488] p-12 shadow-2xl shadow-blue-900/40 md:p-16">
                            {/* Decorative glowing light overlays */}
                            <div className="absolute top-0 right-0 h-[200px] w-[200px] rounded-full bg-white/10 blur-[80px] transition-transform group-hover:scale-110" />
                            <div className="absolute bottom-0 left-0 h-[200px] w-[200px] rounded-full bg-white/10 blur-[80px] transition-transform group-hover:scale-110" />

                            <h2 className="relative z-10 text-3xl font-black text-white md:text-4xl lg:text-5xl">
                                {t('welcome.cta_ready')}
                            </h2>
                            <p className="relative z-10 mx-auto mt-4 max-w-lg text-lg text-white/90 font-medium">
                                {t('welcome.cta_sub')}
                            </p>
                            <Link
                                href={register()}
                                className="relative z-10 mt-8 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-[#ffe4a0] hover:bg-[#ffd77d] px-8 py-4 text-base font-extrabold text-[#1e3a8a] shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                            >
                                {t('welcome.cta_btn')}
                                <Zap className="h-4 w-4 fill-[#1e3a8a]" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ── Footer ── */}
                <footer className="border-t border-border bg-white py-12 dark:bg-background">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                            <div className="flex items-center gap-2">
                                <AppLogoIcon className="h-8 w-8" />
                                <span className="text-sm font-black tracking-tight">
                                    Convo<span className="text-yellow-500">Mate</span>
                                </span>
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">
                                © {new Date().getFullYear()} ConvoMate.{' '}
                                {t('welcome.footer_rights')}
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
