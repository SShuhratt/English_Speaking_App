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

                        <div className="hidden items-center gap-8 text-sm font-medium text-[#555] md:flex dark:text-[#999]">
                            <a href="#features" className="transition-colors hover:text-indigo-500">{t('welcome.nav_features')}</a>
                            <a href="#how-it-works" className="transition-colors hover:text-indigo-500">{t('welcome.nav_how_it_works')}</a>
                            <a href="#teachers" className="transition-colors hover:text-indigo-500">{t('welcome.nav_teachers')}</a>
                            <a href="#pricing" className="transition-colors hover:text-indigo-500">{t('welcome.nav_pricing')}</a>
                        </div>

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
                            <span>{t('welcome.badge')}</span>
                        </div>

                        <h1 className="mx-auto max-w-4xl text-5xl leading-[1.1] font-extrabold tracking-tight md:text-6xl lg:text-7xl">
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

                        <p className="mx-auto mt-6 max-w-2xl text-lg text-[#666] md:text-xl dark:text-[#999]">
                            {t('welcome.subtitle')}
                        </p>

                        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <Link
                                href={register()}
                                className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-indigo-500/30 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/40"
                            >
                                {t('welcome.cta_start')}
                                <Zap className="h-4 w-4 transition-transform group-hover:rotate-12" />
                            </Link>
                            <a
                                href="#how-it-works"
                                className="flex items-center gap-2 rounded-2xl border border-[#E0E0E0] bg-white px-8 py-3.5 text-base font-semibold text-[#333] shadow-sm transition-all hover:border-indigo-300 hover:shadow-md dark:border-[#333] dark:bg-[#1A1A2E] dark:text-[#CCC]"
                            >
                                <Video className="h-4 w-4 text-indigo-500" />
                                {t('welcome.cta_how_it_works')}
                            </a>
                        </div>

                        {/* Trust Badges */}
                        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-[#888]">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-indigo-400" />
                                <span>{t('welcome.trust_learners')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Star className="h-4 w-4 text-amber-400" />
                                <span>{t('welcome.trust_rating')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Globe2 className="h-4 w-4 text-emerald-400" />
                                <span>{t('welcome.trust_experts')}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Features Section ── */}
                <section id="features" className="py-20 lg:py-28">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                                {t('welcome.features_title')}{' '}
                                <span className="text-indigo-500">{t('welcome.features_title_highlight')}</span>
                            </h2>
                            <p className="mx-auto mt-4 max-w-2xl text-[#666] dark:text-[#999]">
                                {t('welcome.features_subtitle')}
                            </p>
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

                {/* ── How It Works ── */}
                <section id="how-it-works" className="bg-gradient-to-b from-white to-indigo-50/50 py-20 lg:py-28 dark:from-[#0B0B1A] dark:to-[#0F0F25]">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                                {t('welcome.how_title')}{' '}
                                <span className="text-indigo-500">{t('welcome.how_title_highlight')}</span>
                            </h2>
                            <p className="mx-auto mt-4 max-w-2xl text-[#666] dark:text-[#999]">
                                {t('welcome.how_subtitle')}
                            </p>
                        </div>

                        <div className="mt-16 grid gap-8 md:grid-cols-3">
                            {[
                                {
                                    step: '01',
                                    title: t('welcome.how_step_1_title'),
                                    desc: t('welcome.how_step_1_desc'),
                                    icon: Users,
                                },
                                {
                                    step: '02',
                                    title: t('welcome.how_step_2_title'),
                                    desc: t('welcome.how_step_2_desc'),
                                    icon: Calendar,
                                },
                                {
                                    step: '03',
                                    title: t('welcome.how_step_3_title'),
                                    desc: t('welcome.how_step_3_desc'),
                                    icon: Mic,
                                },
                            ].map((item) => (
                                <div key={item.step} className="group text-center">
                                    <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 transition-transform group-hover:scale-110" />
                                        <span className="relative text-3xl font-black text-indigo-500">{item.step}</span>
                                    </div>
                                    <h3 className="mb-3 text-xl font-bold">{item.title}</h3>
                                    <p className="mx-auto max-w-xs text-sm leading-relaxed text-[#666] dark:text-[#999]">
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Teacher Showcase ── */}
                <section id="teachers" className="py-20 lg:py-28">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                                {t('welcome.teachers_title')}{' '}
                                <span className="text-indigo-500">{t('welcome.teachers_title_highlight')}</span>
                            </h2>
                            <p className="mx-auto mt-4 max-w-2xl text-[#666] dark:text-[#999]">
                                {t('welcome.teachers_subtitle')}
                            </p>
                        </div>

                        <div className="mt-16 grid gap-6 md:grid-cols-3">
                            {[
                                {
                                    name: 'Sarah Thompson',
                                    level: 'IELTS 9.0 · Speaking 9.0',
                                    exp: '5 years',
                                    rating: 4.9,
                                    reviews: 142,
                                    initials: 'ST',
                                    gradient: 'from-indigo-400 to-blue-500',
                                },
                                {
                                    name: 'James Wilson',
                                    level: 'CEFR C2 · IELTS 8.5',
                                    exp: '3 years',
                                    rating: 4.8,
                                    reviews: 98,
                                    initials: 'JW',
                                    gradient: 'from-purple-400 to-pink-500',
                                },
                                {
                                    name: 'Emma Davis',
                                    level: 'IELTS 8.5 · Speaking 8.5',
                                    exp: '7 years',
                                    rating: 5.0,
                                    reviews: 231,
                                    initials: 'ED',
                                    gradient: 'from-emerald-400 to-teal-500',
                                },
                            ].map((teacher) => (
                                <div
                                    key={teacher.name}
                                    className="group rounded-2xl border border-[#E8E8E8] bg-white p-6 transition-all hover:border-indigo-200 hover:shadow-lg dark:border-[#222] dark:bg-[#12122A] dark:hover:border-indigo-500/30"
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${teacher.gradient} text-lg font-bold text-white shadow-lg`}
                                        >
                                            {teacher.initials}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{teacher.name}</h3>
                                            <p className="text-sm text-[#888]">{teacher.level}</p>
                                        </div>
                                    </div>

                                    <div className="mt-5 flex items-center justify-between border-t border-[#F0F0F0] pt-5 text-sm dark:border-[#222]">
                                        <div className="flex items-center gap-1.5">
                                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                            <span className="font-semibold">{teacher.rating}</span>
                                            <span className="text-[#888]">({teacher.reviews})</span>
                                        </div>
                                        <span className="text-[#888]">{teacher.exp} {t('welcome.teachers_experience')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Pricing ── */}
                <section id="pricing" className="bg-gradient-to-b from-indigo-50/50 to-white py-20 lg:py-28 dark:from-[#0F0F25] dark:to-[#0B0B1A]">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                                {t('welcome.pricing_title')}{' '}
                                <span className="text-indigo-500">{t('welcome.pricing_title_highlight')}</span>
                            </h2>
                            <p className="mx-auto mt-4 max-w-2xl text-[#666] dark:text-[#999]">
                                {t('welcome.pricing_subtitle')}
                            </p>
                        </div>

                        <div className="mt-16 grid gap-8 md:grid-cols-3">
                            {[
                                {
                                    name: 'Starter',
                                    price: t('welcome.pricing_free'),
                                    period: '',
                                    desc: t('welcome.pricing_plan_starter_desc'),
                                    features: [
                                        t('welcome.pricing_plan_starter_feat_1'),
                                        t('welcome.pricing_plan_starter_feat_2'),
                                        t('welcome.pricing_plan_starter_feat_3'),
                                    ],
                                    cta: t('welcome.pricing_plan_starter_cta'),
                                    featured: false,
                                },
                                {
                                    name: 'Pro',
                                    price: '$19',
                                    period: t('welcome.pricing_month'),
                                    desc: t('welcome.pricing_plan_pro_desc'),
                                    features: [
                                        t('welcome.pricing_plan_pro_feat_1'),
                                        t('welcome.pricing_plan_pro_feat_2'),
                                        t('welcome.pricing_plan_pro_feat_3'),
                                        t('welcome.pricing_plan_pro_feat_4'),
                                        t('welcome.pricing_plan_pro_feat_5'),
                                    ],
                                    cta: t('welcome.pricing_plan_pro_cta'),
                                    featured: true,
                                },
                                {
                                    name: 'Unlimited',
                                    price: '$39',
                                    period: t('welcome.pricing_month'),
                                    desc: t('welcome.pricing_plan_unlimited_desc'),
                                    features: [
                                        t('welcome.pricing_plan_unlimited_feat_1'),
                                        t('welcome.pricing_plan_unlimited_feat_2'),
                                        t('welcome.pricing_plan_unlimited_feat_3'),
                                        t('welcome.pricing_plan_unlimited_feat_4'),
                                        t('welcome.pricing_plan_unlimited_feat_5'),
                                    ],
                                    cta: t('welcome.pricing_plan_unlimited_cta'),
                                    featured: false,
                                },
                            ].map((plan) => (
                                <div
                                    key={plan.name}
                                    className={`relative rounded-2xl border p-8 transition-all ${
                                        plan.featured
                                            ? 'border-indigo-300 bg-white shadow-xl shadow-indigo-500/10 dark:border-indigo-500/40 dark:bg-[#12122A]'
                                            : 'border-[#E8E8E8] bg-white hover:border-indigo-200 hover:shadow-lg dark:border-[#222] dark:bg-[#12122A]'
                                    }`}
                                >
                                    {plan.featured && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-1 text-xs font-semibold text-white">
                                            {t('welcome.pricing_most_popular')}
                                        </div>
                                    )}
                                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                                    <div className="mt-3 flex items-baseline gap-1">
                                        <span className="text-4xl font-bold">{plan.price}</span>
                                        {plan.period && <span className="text-[#888]">{plan.period}</span>}
                                    </div>
                                    <p className="mt-2 text-sm text-[#888]">{plan.desc}</p>

                                    <ul className="mt-6 space-y-3">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-center gap-2.5 text-sm">
                                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Link
                                        href={register()}
                                        className={`mt-8 block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                                            plan.featured
                                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl'
                                                : 'border border-[#DDD] bg-[#FAFAFA] text-[#333] hover:border-indigo-300 hover:bg-indigo-50 dark:border-[#333] dark:bg-[#1A1A2E] dark:text-[#CCC]'
                                        }`}
                                    >
                                        {plan.cta}
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA Section ── */}
                <section className="py-20 lg:py-28">
                    <div className="mx-auto max-w-4xl px-6 text-center">
                        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-12 shadow-2xl shadow-indigo-500/30 md:p-16">
                            <h2 className="text-3xl font-bold text-white md:text-4xl">
                                {t('welcome.cta_ready')}
                            </h2>
                            <p className="mx-auto mt-4 max-w-lg text-lg text-indigo-100">
                                {t('welcome.cta_sub')}
                            </p>
                            <Link
                                href={register()}
                                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-base font-semibold text-indigo-600 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                            >
                                {t('welcome.cta_btn')}
                                <Zap className="h-4 w-4" />
                            </Link>
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
                                © {new Date().getFullYear()} SpeakFlow. {t('welcome.footer_rights')}
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
