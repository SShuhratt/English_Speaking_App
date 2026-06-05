import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';
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
} from 'lucide-react';

export default function Welcome() {
    const { auth } = usePage<{ auth: { user: unknown } }>().props;

    return (
        <>
            <Head title="Master English Speaking" />

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
                            <a href="#features" className="transition-colors hover:text-indigo-500">Features</a>
                            <a href="#how-it-works" className="transition-colors hover:text-indigo-500">How It Works</a>
                            <a href="#teachers" className="transition-colors hover:text-indigo-500">Teachers</a>
                            <a href="#pricing" className="transition-colors hover:text-indigo-500">Pricing</a>
                        </div>

                        <div className="flex items-center gap-3">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="rounded-xl px-4 py-2 text-sm font-medium text-[#555] transition-colors hover:text-indigo-500 dark:text-[#999]"
                                    >
                                        Sign in
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40"
                                    >
                                        Get Started
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
                            <span>AI-Enhanced Speaking Practice</span>
                        </div>

                        <h1 className="mx-auto max-w-4xl text-5xl leading-[1.1] font-extrabold tracking-tight md:text-6xl lg:text-7xl">
                            Speak English{' '}
                            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                                Fluently
                            </span>
                            <br />
                            with Expert Teachers
                        </h1>

                        <p className="mx-auto mt-6 max-w-2xl text-lg text-[#666] md:text-xl dark:text-[#999]">
                            Book 1-on-1 speaking sessions with certified English teachers.
                            Practice conversations, get instant feedback, and track your progress — all via Google Meet.
                        </p>

                        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <Link
                                href={register()}
                                className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-indigo-500/30 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/40"
                            >
                                Start Speaking Today
                                <Zap className="h-4 w-4 transition-transform group-hover:rotate-12" />
                            </Link>
                            <a
                                href="#how-it-works"
                                className="flex items-center gap-2 rounded-2xl border border-[#E0E0E0] bg-white px-8 py-3.5 text-base font-semibold text-[#333] shadow-sm transition-all hover:border-indigo-300 hover:shadow-md dark:border-[#333] dark:bg-[#1A1A2E] dark:text-[#CCC]"
                            >
                                <Video className="h-4 w-4 text-indigo-500" />
                                See How It Works
                            </a>
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
                <section id="features" className="py-20 lg:py-28">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                                Everything You Need to{' '}
                                <span className="text-indigo-500">Improve</span>
                            </h2>
                            <p className="mx-auto mt-4 max-w-2xl text-[#666] dark:text-[#999]">
                                A complete platform designed for serious English learners who want real results
                            </p>
                        </div>

                        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {[
                                {
                                    icon: Video,
                                    title: 'Live 1-on-1 Sessions',
                                    desc: 'Connect with teachers via Google Meet for interactive speaking practice in real-time.',
                                    color: 'from-indigo-500 to-blue-600',
                                    shadow: 'shadow-indigo-500/20',
                                },
                                {
                                    icon: Calendar,
                                    title: 'Smart Scheduling',
                                    desc: 'Book sessions based on teacher availability. Calendar sync ensures no conflicts.',
                                    color: 'from-purple-500 to-pink-600',
                                    shadow: 'shadow-purple-500/20',
                                },
                                {
                                    icon: GraduationCap,
                                    title: 'Certified Teachers',
                                    desc: 'All teachers are IELTS/CEFR certified with verified speaking band scores.',
                                    color: 'from-emerald-500 to-teal-600',
                                    shadow: 'shadow-emerald-500/20',
                                },
                                {
                                    icon: MessageCircle,
                                    title: 'Instant Feedback',
                                    desc: 'Get detailed feedback on pronunciation, grammar, and fluency after each session.',
                                    color: 'from-amber-500 to-orange-600',
                                    shadow: 'shadow-amber-500/20',
                                },
                                {
                                    icon: Sparkles,
                                    title: 'Progress Tracking',
                                    desc: 'Monitor your improvement with detailed statistics and session recordings.',
                                    color: 'from-pink-500 to-rose-600',
                                    shadow: 'shadow-pink-500/20',
                                },
                                {
                                    icon: BookOpen,
                                    title: 'All Levels Welcome',
                                    desc: 'From beginner to advanced — teachers adapt to your level and learning goals.',
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
                                Start Speaking in{' '}
                                <span className="text-indigo-500">3 Steps</span>
                            </h2>
                            <p className="mx-auto mt-4 max-w-2xl text-[#666] dark:text-[#999]">
                                Getting started is quick and easy
                            </p>
                        </div>

                        <div className="mt-16 grid gap-8 md:grid-cols-3">
                            {[
                                {
                                    step: '01',
                                    title: 'Create Your Account',
                                    desc: 'Sign up as a pupil, choose your English level, and set your learning goals.',
                                    icon: Users,
                                },
                                {
                                    step: '02',
                                    title: 'Browse & Book',
                                    desc: 'Find certified teachers by rating, availability, and specialization. Book a session.',
                                    icon: Calendar,
                                },
                                {
                                    step: '03',
                                    title: 'Start Speaking',
                                    desc: 'Join the Google Meet session, practice speaking, and get feedback to improve.',
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
                                Meet Our{' '}
                                <span className="text-indigo-500">Expert Teachers</span>
                            </h2>
                            <p className="mx-auto mt-4 max-w-2xl text-[#666] dark:text-[#999]">
                                Experienced, certified, and passionate about helping you improve
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
                                        <span className="text-[#888]">{teacher.exp} experience</span>
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
                                Simple{' '}
                                <span className="text-indigo-500">Pricing</span>
                            </h2>
                            <p className="mx-auto mt-4 max-w-2xl text-[#666] dark:text-[#999]">
                                Choose the plan that fits your learning goals
                            </p>
                        </div>

                        <div className="mt-16 grid gap-8 md:grid-cols-3">
                            {[
                                {
                                    name: 'Starter',
                                    price: 'Free',
                                    period: '',
                                    desc: 'Perfect to try the platform',
                                    features: [
                                        '1 free session / month',
                                        'Browse teacher profiles',
                                        'Basic progress tracking',
                                    ],
                                    cta: 'Start Free',
                                    featured: false,
                                },
                                {
                                    name: 'Pro',
                                    price: '$19',
                                    period: '/month',
                                    desc: 'For serious learners',
                                    features: [
                                        '8 sessions / month',
                                        'Priority teacher booking',
                                        'Detailed feedback reports',
                                        'Session recordings',
                                        'Progress analytics',
                                    ],
                                    cta: 'Get Pro',
                                    featured: true,
                                },
                                {
                                    name: 'Unlimited',
                                    price: '$39',
                                    period: '/month',
                                    desc: 'Maximum practice time',
                                    features: [
                                        'Unlimited sessions',
                                        'All Pro features',
                                        'Priority support',
                                        'IELTS prep materials',
                                        'Group sessions access',
                                    ],
                                    cta: 'Go Unlimited',
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
                                            Most Popular
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
                                Ready to Start Speaking?
                            </h2>
                            <p className="mx-auto mt-4 max-w-lg text-lg text-indigo-100">
                                Join thousands of learners improving their English speaking skills every day.
                            </p>
                            <Link
                                href={register()}
                                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-base font-semibold text-indigo-600 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                            >
                                Create Free Account
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
                                © {new Date().getFullYear()} SpeakFlow. All rights reserved.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
