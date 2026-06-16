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

export default function Welcome() {
    const { auth } = usePage<{ auth: { user: unknown } }>().props;
    const { t, locale, setLanguage } = useTranslation();

    return (
        <>
            <Head title={t('welcome.title')} />

            <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A2E] dark:bg-[#0B0B1A] dark:text-[#E8E8F0]">
                {/* ── Navbar ── */}
                <nav className="fixed top-0 right-0 left-0 z-50 border-b border-white/10 bg-white/80 backdrop-blur-xl dark:bg-[#0B0B1A]/80">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                        <Link href="/" className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                                <Mic className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-lg font-bold tracking-tight">
                                Speak<span className="text-indigo-500">Flow</span>
                            </span>
                        </Link>

                        <div className="flex items-center gap-3">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="rounded-xl flex items-center gap-1.5 font-medium h-9 px-3 text-[#555] dark:text-[#999] hover:text-indigo-500 cursor-pointer">
                                        <Globe className="h-4 w-4" />
                                        <span className="uppercase text-xs font-semibold">{locale}</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl">
                                    <DropdownMenuItem onClick={() => setLanguage('en')} className="rounded-lg flex items-center justify-between">
                                        <span className="text-sm">English</span>
                                        {locale === 'en' && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setLanguage('uz')} className="rounded-lg flex items-center justify-between">
                                        <span className="text-sm">O'zbek</span>
                                        {locale === 'uz' && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setLanguage('ru')} className="rounded-lg flex items-center justify-between">
                                        <span className="text-sm">Русский</span>
                                        {locale === 'ru' && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40"
                                >
                                    {t('nav.dashboard')}
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="rounded-xl px-4 py-2 text-sm font-medium text-[#555] transition-colors hover:text-indigo-500 dark:text-[#999]"
                                    >
                                        {t('auth.login')}
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40"
                                    >
                                        {t('welcome.get_started')}
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                {/* ── Hero Section ── */}
                <section className="relative overflow-hidden pt-32 pb-20 lg:pt-44 lg:pb-32">
                    {/* Decorative blurs */}
                    <div className="absolute top-20 -left-32 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[128px]" />
                    <div className="absolute top-40 -right-32 h-[400px] w-[400px] rounded-full bg-purple-500/15 blur-[128px]" />
                    <div className="absolute bottom-0 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-[100px]" />

                    <div className="relative mx-auto max-w-7xl px-6 text-center">
                        {/* Badge */}
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400">
                            <Sparkles className="h-4 w-4" />
                            <span>{t('welcome.feature_1_title')}</span>
                        </div>

                        <h1 className="mx-auto max-w-4xl text-4xl leading-[1.1] font-extrabold tracking-tight md:text-5xl lg:text-6xl">
                            {t('welcome.title')}{' '}
                            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                                {t('welcome.one_on_one')}
                            </span>
                        </h1>

                        <p className="mx-auto mt-6 max-w-2xl text-lg text-[#666] md:text-xl dark:text-[#999]">
                            {t('welcome.subtitle')}
                        </p>

                        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <Link
                                href={register()}
                                className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-indigo-500/30 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/40"
                            >
                                {t('welcome.get_started')}
                                <Zap className="h-4 w-4 transition-transform group-hover:rotate-12" />
                            </Link>
                        </div>

                        {/* Trust Badges */}
                        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-[#888]">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-indigo-400" />
                                <span>2,500+ Active Learners</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Star className="h-4 w-4 text-amber-400" />
                                <span>4.9/5 Average Rating</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Globe2 className="h-4 w-4 text-emerald-400" />
                                <span>Certified IELTS Experts</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Features Section ── */}
                <section id="features" className="py-20 lg:py-28 border-t">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                                {t('welcome.features_title')}
                            </h2>
                        </div>

                        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {[
                                {
                                    icon: Video,
                                    title: t('welcome.feature_1_title'),
                                    desc: t('welcome.feature_1_desc'),
                                    color: 'from-indigo-500 to-blue-600',
                                    shadow: 'shadow-indigo-500/20',
                                },
                                {
                                    icon: Calendar,
                                    title: t('welcome.feature_2_title'),
                                    desc: t('welcome.feature_2_desc'),
                                    color: 'from-purple-500 to-pink-600',
                                    shadow: 'shadow-purple-500/20',
                                },
                                {
                                    icon: Sparkles,
                                    title: t('welcome.feature_3_title'),
                                    desc: t('welcome.feature_3_desc'),
                                    color: 'from-pink-500 to-rose-600',
                                    shadow: 'shadow-pink-500/20',
                                },
                            ].map((feature) => (
                                <div
                                    key={feature.title}
                                    className="group rounded-2xl border border-[#E8E8E8] bg-white p-7 transition-all hover:border-indigo-200 hover:shadow-lg dark:border-[#222] dark:bg-[#12122A] dark:hover:border-indigo-500/30"
                                >
                                    <div
                                        className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-lg ${feature.shadow}`}
                                    >
                                        <feature.icon className="h-6 w-6 text-white" />
                                    </div>
                                    <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                                    <p className="text-sm leading-relaxed text-[#666] dark:text-[#999]">
                                        {feature.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Footer ── */}
                <footer className="border-t border-[#E8E8E8] bg-white py-12 dark:border-[#222] dark:bg-[#0B0B1A]">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                                    <Mic className="h-4 w-4 text-white" />
                                </div>
                                <span className="text-sm font-bold">
                                    Speak<span className="text-indigo-500">Flow</span>
                                </span>
                            </div>
                            <p className="text-sm text-[#888]">
                                © {new Date().getFullYear()} SpeakFlow. All rights reserved.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
