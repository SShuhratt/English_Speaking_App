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

            <div className="min-h-screen overflow-x-hidden bg-[#FAFAFA] font-sans text-[#1A1A2E] transition-colors duration-300 dark:bg-[#080811] dark:text-[#E8E8F0]">
                {/* ── Navbar ── */}
                <nav className="fixed top-0 right-0 left-0 z-50 border-b border-white/5 bg-white/70 shadow-sm backdrop-blur-xl dark:bg-[#080811]/75">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                        <Link
                            href="/"
                            className="group flex items-center gap-2.5"
                        >
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 shadow-md shadow-indigo-500/20 transition-transform group-hover:scale-105">
                                <Mic className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-lg font-black tracking-tight">
                                Speak
                                <span className="text-indigo-500">Flow</span>
                            </span>
                        </Link>

                        <div className="hidden items-center gap-8 text-sm font-semibold text-[#555] md:flex dark:text-[#A0A0B0]">
                            <a
                                href="#features"
                                className="transition-colors hover:text-indigo-500"
                            >
                                {t('welcome.nav_features')}
                            </a>
                            <a
                                href="#how-it-works"
                                className="transition-colors hover:text-indigo-500"
                            >
                                {t('welcome.nav_how_it_works')}
                            </a>
                            <a
                                href="#teachers"
                                className="transition-colors hover:text-indigo-500"
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
                                        className="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl px-3 font-semibold text-[#555] hover:bg-indigo-500/5 hover:text-indigo-500 dark:text-[#A0A0B0]"
                                    >
                                        <Globe className="h-4 w-4 text-indigo-500" />
                                        <span className="text-xs font-bold uppercase">
                                            {locale}
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="rounded-2xl border border-white/10 p-1.5 shadow-xl dark:bg-[#0F0F1E]"
                                >
                                    <DropdownMenuItem
                                        onClick={() => setLanguage('en')}
                                        className="flex cursor-pointer items-center justify-between rounded-xl px-3.5 py-2 hover:bg-indigo-500/10 focus:bg-indigo-500/10"
                                    >
                                        <span className="text-sm font-medium">
                                            English
                                        </span>
                                        {locale === 'en' && (
                                            <span className="h-2 w-2 rounded-full bg-indigo-600" />
                                        )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setLanguage('uz')}
                                        className="flex cursor-pointer items-center justify-between rounded-xl px-3.5 py-2 hover:bg-indigo-500/10 focus:bg-indigo-500/10"
                                    >
                                        <span className="text-sm font-medium">
                                            O'zbek
                                        </span>
                                        {locale === 'uz' && (
                                            <span className="h-2 w-2 rounded-full bg-indigo-600" />
                                        )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setLanguage('ru')}
                                        className="flex cursor-pointer items-center justify-between rounded-xl px-3.5 py-2 hover:bg-indigo-500/10 focus:bg-indigo-500/10"
                                    >
                                        <span className="text-sm font-medium">
                                            Русский
                                        </span>
                                        {locale === 'ru' && (
                                            <span className="h-2 w-2 rounded-full bg-indigo-600" />
                                        )}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-indigo-500/10 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/20"
                                >
                                    {t('nav.dashboard')}
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="rounded-xl px-4 py-2 text-sm font-semibold text-[#555] transition-colors hover:text-indigo-500 dark:text-[#A0A0B0]"
                                    >
                                        {t('auth.login')}
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-indigo-500/10 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/20"
                                    >
                                        {t('welcome.get_started')}
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                {/* ── Hero Section ── */}
                <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
                    {/* Decorative blurs */}
                    <div className="pointer-events-none absolute top-20 -left-32 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[128px] dark:bg-indigo-500/10" />
                    <div className="pointer-events-none absolute top-40 -right-32 h-[400px] w-[400px] rounded-full bg-purple-500/15 blur-[128px] dark:bg-purple-500/5" />
                    <div className="pointer-events-none absolute bottom-0 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-[100px] dark:bg-cyan-500/5" />

                    <div className="relative mx-auto max-w-7xl px-6">
                        <div className="grid items-center gap-12 lg:grid-cols-12">
                            {/* Left Side: Content */}
                            <div className="space-y-6 text-left lg:col-span-7">
                                {/* Badge */}
                                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/50 px-4 py-1.5 text-sm font-semibold text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400">
                                    <Sparkles className="h-4 w-4 animate-pulse text-indigo-500" />
                                    <span>{t('welcome.badge')}</span>
                                </div>

                                <h1 className="text-4xl leading-[1.15] font-black tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                                    {t('welcome.title')}{' '}
                                    <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                                        {t('welcome.title_fluently')}
                                    </span>
                                    <br />
                                    {t('welcome.title_with_teachers')}{' '}
                                    <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                                        {t('welcome.one_on_one')}
                                    </span>
                                </h1>

                                <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                                    {t('welcome.subtitle')}
                                </p>

                                <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                                    <Link
                                        href={register()}
                                        className="group flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-indigo-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-indigo-500/35"
                                    >
                                        {t('welcome.cta_start')}
                                        <Zap className="h-4 w-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                                    </Link>
                                    <a
                                        href="#how-it-works"
                                        className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-8 py-4 text-base font-bold text-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-500/30 hover:bg-accent"
                                    >
                                        <Video className="h-4 w-4 animate-pulse text-indigo-500" />
                                        {t('welcome.cta_how_it_works')}
                                    </a>
                                </div>

                                {/* Trust Badges */}
                                <div className="flex flex-wrap items-center gap-8 border-t border-border pt-8 text-sm text-[#888] dark:text-[#999]">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-indigo-500" />
                                        <span>
                                            {t('welcome.trust_learners')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                                        <span>{t('welcome.trust_rating')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Globe2 className="h-4 w-4 text-emerald-500" />
                                        <span>
                                            {t('welcome.trust_experts')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Graphic Visual */}
                            <div className="relative mt-12 flex items-center justify-center lg:col-span-5 lg:mt-0">
                                {/* Floating glowing background blobs */}
                                <div className="animate-pulse-slow pointer-events-none absolute -inset-4 rounded-full bg-gradient-to-r from-indigo-500/30 to-purple-500/30 blur-3xl" />

                                {/* Main Graphic Container */}
                                <div className="animate-float relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white/5 p-4 shadow-2xl shadow-indigo-500/15 backdrop-blur-md md:max-w-lg lg:max-w-none">
                                    {/* Glowing border overlay */}
                                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-purple-500/10" />

                                    {/* Main image */}
                                    <img
                                        src="/images/online-lesson.png"
                                        alt="1-on-1 Online Lesson"
                                        className="relative z-10 h-auto w-full rounded-2xl border border-white/10 shadow-inner"
                                    />

                                    {/* Floating badge 1 */}
                                    <div className="animate-float-delayed absolute top-8 left-8 z-20 flex items-center gap-2 rounded-2xl border border-white/20 bg-white/80 px-4 py-2.5 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-[#0B0B1A]/80">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500">
                                            <Mic className="h-4 w-4 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                                Active Practice
                                            </p>
                                            <p className="text-xs font-extrabold">
                                                Speak Freely
                                            </p>
                                        </div>
                                    </div>

                                    {/* Floating badge 2 */}
                                    <div className="animate-float absolute right-8 bottom-8 z-20 flex items-center gap-2 rounded-2xl border border-white/20 bg-white/80 px-4 py-2.5 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-[#0B0B1A]/80">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500">
                                            <CheckCircle2 className="h-4 w-4 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                                Expert Feedback
                                            </p>
                                            <p className="text-xs font-extrabold">
                                                CEFR / IELTS
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Features Section ── */}
                <section id="features" className="relative py-20 lg:py-28">
                    <div className="pointer-events-none absolute top-0 right-0 h-[300px] w-[300px] rounded-full bg-indigo-500/5 blur-[100px]" />
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="space-y-4 text-center">
                            <h2 className="text-3xl font-black tracking-tight md:text-4xl lg:text-5xl">
                                {t('welcome.features_title')}{' '}
                                <span className="text-indigo-500">
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
                                    className="group relative rounded-3xl border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5"
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
                    className="relative bg-gradient-to-b from-white via-indigo-50/30 to-white py-20 lg:py-28 dark:from-[#080811] dark:via-[#0E0E25]/30 dark:to-[#080811]"
                >
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="space-y-4 text-center">
                            <h2 className="text-3xl font-black tracking-tight md:text-4xl lg:text-5xl">
                                {t('welcome.how_title')}{' '}
                                <span className="text-indigo-500">
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
                                    className="group relative rounded-3xl border border-transparent p-8 text-center transition-all duration-300 hover:border-indigo-500/20 hover:bg-indigo-500/5"
                                >
                                    <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
                                        <div className="animate-pulse-slow absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6" />
                                        <span className="relative bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-3xl font-black text-transparent">
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
                    <div className="pointer-events-none absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-purple-500/5 blur-[100px]" />
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="space-y-4 text-center">
                            <h2 className="text-3xl font-black tracking-tight md:text-4xl lg:text-5xl">
                                {t('welcome.teachers_title')}{' '}
                                <span className="text-indigo-500">
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
                                    exp: '5 years',
                                    rating: 4.9,
                                    reviews: 142,
                                    initials: 'ST',
                                    gradient:
                                        'from-indigo-400 via-indigo-500 to-blue-500',
                                },
                                {
                                    name: 'James Wilson',
                                    level: 'CEFR C2 · IELTS 8.5',
                                    exp: '3 years',
                                    rating: 4.8,
                                    reviews: 98,
                                    initials: 'JW',
                                    gradient:
                                        'from-purple-400 via-purple-500 to-pink-500',
                                },
                                {
                                    name: 'Emma Davis',
                                    level: 'IELTS 8.5 · Speaking 8.5',
                                    exp: '7 years',
                                    rating: 5.0,
                                    reviews: 231,
                                    initials: 'ED',
                                    gradient:
                                        'from-emerald-400 via-emerald-500 to-teal-500',
                                },
                            ].map((teacher) => (
                                <div
                                    key={teacher.name}
                                    className="group rounded-3xl border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5"
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${teacher.gradient} text-lg font-bold text-white shadow-lg shadow-indigo-500/10 transition-transform duration-300 group-hover:scale-105`}
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
                                                ({teacher.reviews} reviews)
                                            </span>
                                        </div>
                                        <span className="font-semibold text-muted-foreground">
                                            {teacher.exp}{' '}
                                            {t('welcome.teachers_experience')}
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
                        <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-12 shadow-2xl shadow-indigo-500/20 md:p-16">
                            {/* Decorative glowing light overlays */}
                            <div className="absolute top-0 right-0 h-[200px] w-[200px] rounded-full bg-white/10 blur-[80px] transition-transform group-hover:scale-110" />
                            <div className="absolute bottom-0 left-0 h-[200px] w-[200px] rounded-full bg-white/10 blur-[80px] transition-transform group-hover:scale-110" />

                            <h2 className="relative z-10 text-3xl font-black text-white md:text-4xl lg:text-5xl">
                                {t('welcome.cta_ready')}
                            </h2>
                            <p className="relative z-10 mx-auto mt-4 max-w-lg text-lg text-indigo-100">
                                {t('welcome.cta_sub')}
                            </p>
                            <Link
                                href={register()}
                                className="relative z-10 mt-8 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold text-indigo-600 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                            >
                                {t('welcome.cta_btn')}
                                <Zap className="h-4 w-4 fill-indigo-600" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ── Footer ── */}
                <footer className="border-t border-border bg-white py-12 dark:bg-[#080811]">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                                    <Mic className="h-4 w-4 text-white" />
                                </div>
                                <span className="text-sm font-black tracking-tight">
                                    Speak
                                    <span className="text-indigo-500">
                                        Flow
                                    </span>
                                </span>
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">
                                © {new Date().getFullYear()} SpeakFlow.{' '}
                                {t('welcome.footer_rights')}
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
