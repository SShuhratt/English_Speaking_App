import { Head, Link, usePage } from '@inertiajs/react';
import {
    Globe,
    Check,
    ShieldCheck,
    ArrowRight,
    Star,
    Menu,
    X,
} from 'lucide-react';
import { useState } from 'react';
import AppLogo from '@/components/app-logo';
import { HeroIllustration3D } from '@/components/landing/HeroIllustration3D';
import { TiltCard3D, DepthLayer } from '@/components/landing/TiltCard3D';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/use-translation';

interface CertifiedTeacher {
    id: string;
    name: string;
    avatar?: string | null;
    speaking_band?: string | null;
    overall_level?: string | null;
    headline?: string | null;
    bio?: string | null;
    rating?: string;
    reviews?: string;
    price?: number | null;
}

interface WelcomeProps {
    certifiedTeachers?: CertifiedTeacher[];
}

export default function Welcome({ certifiedTeachers = [] }: WelcomeProps) {
    const { auth } = usePage<{ auth: { user: unknown } }>().props;
    const { t, locale, setLanguage } = useTranslation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const getBookLessonLink = (teacherId?: string) => {
        if (!auth.user) {
return teacherId ? `/register?teacher=${teacherId}` : '/register';
}

        if ((auth.user as any).role === 'teacher') {
return '/dashboard';
}

        if ((auth.user as any).role === 'admin') {
return '/admin/dashboard';
}

        return teacherId ? `/pupil/teachers/${teacherId}` : '/pupil/teachers';
    };

    return (
        <>
            <Head>
                <title>ConvoMate — 1-on-1 English Speaking Practice Platform</title>
                <meta
                    name="description"
                    content="ConvoMate is a live 1-on-1 English speaking practice platform connecting students with IELTS-verified teachers for real-time conversation simulations, fluency coaching, and exam preparation."
                />
            </Head>

            {/* Design Tokens & Custom CSS Styles */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                :root {
                  --butter: #F7DE8B;
                  --butter-tint: #FDF7E4;
                  --butter-soft: #FBEDBC;
                  --blue: #A9C6E8;
                  --blue-soft: #E3EDF8;
                  --navy: #1E2A5A;
                  --ink: #232A45;
                  --muted: #5C6480;
                  --line: #EAE4D2;
                  --white: #FFFFFF;
                  --radius: 22px;
                }

                html, body {
                  overflow-x: hidden;
                  max-width: 100vw;
                }

                body {
                  font-family: 'Schibsted Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  color: var(--ink);
                  background: var(--white);
                  line-height: 1.6;
                }

                h1, h2, h3 {
                  font-family: 'Bricolage Grotesque', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  color: var(--navy);
                  line-height: 1.08;
                }

                .wrap {
                  max-width: 1160px;
                  margin: 0 auto;
                  padding: 0 24px;
                }

                .naqsh {
                  position: relative;
                }
                .naqsh::before, .naqsh::after {
                  content: "";
                  position: absolute;
                  width: 34px;
                  height: 34px;
                  pointer-events: none;
                  background:
                    linear-gradient(var(--navy), var(--navy)) top left/14px 1.5px no-repeat,
                    linear-gradient(var(--navy), var(--navy)) top left/1.5px 14px no-repeat,
                    linear-gradient(var(--navy), var(--navy)) 6px 6px/14px 1.5px no-repeat,
                    linear-gradient(var(--navy), var(--navy)) 6px 6px/1.5px 14px no-repeat;
                  opacity: .5;
                }
                .naqsh::before { top: 12px; left: 12px; }
                .naqsh::after { bottom: 12px; right: 12px; transform: rotate(180deg); }

                .btn-primary { background: var(--navy); color: var(--white); }
                .btn-butter { background: var(--butter); color: var(--navy); }
                .btn-outline { background: transparent; color: var(--navy); border: 2px solid var(--navy); }

                .hero-strike {
                  position: relative;
                  white-space: nowrap;
                }
                .hero-strike::after {
                  content: "";
                  position: absolute;
                  left: -2%;
                  right: -2%;
                  top: 54%;
                  height: 5px;
                  background: var(--navy);
                  border-radius: 3px;
                  transform: rotate(-2deg);
                }

                .hero-hum {
                  background: linear-gradient(transparent 66%, var(--butter) 66%);
                }

                .tile {
                  border-radius: var(--radius);
                  aspect-ratio: 4/5;
                  position: relative;
                  box-shadow: 0 20px 50px rgba(30, 42, 90, .14);
                  display: flex;
                  align-items: flex-end;
                  padding: 16px;
                  overflow: hidden;
                }

                @keyframes audio-wave {
                  0% { transform: scale(1); opacity: 0.65; }
                  60%, 100% { transform: scale(1.65); opacity: 0; }
                }

                @keyframes float-3d {
                  0%, 100% { transform: perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px); }
                  50% { transform: perspective(1000px) rotateX(2deg) rotateY(-2deg) translateY(-6px); }
                }

                @media (prefers-reduced-motion: reduce) {
                  *, ::before, ::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                    scroll-behavior: auto !important;
                  }
                }

                html { scroll-behavior: smooth; }
            `,
                }}
            />

            <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-white text-[#232A45] antialiased">
                {/* ── Main Header ── */}
                <header className="sticky top-0 z-50 border-b border-[#EAE4D2] bg-white/95 backdrop-blur-md">
                    <div className="mx-auto flex h-[76px] w-full max-w-[1240px] items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:gap-8 lg:px-8">
                        <Link href="/" className="flex shrink-0 items-center transition-transform hover:scale-[1.02]">
                            <AppLogo size="lg" variant="navy" />
                        </Link>

                        <nav className="hidden items-center justify-center gap-6 text-[14px] font-semibold text-[#5C6480] whitespace-nowrap lg:flex xl:gap-8 xl:text-[15px]">
                            <a
                                href="#why"
                                className="transition-colors hover:text-[#1E2A5A]"
                            >
                                {t('welcome.nav_why_humans')}
                            </a>
                            <a
                                href="#how"
                                className="transition-colors hover:text-[#1E2A5A]"
                            >
                                {t('welcome.nav_how_it_works')}
                            </a>
                            <a
                                href="#teachers"
                                className="transition-colors hover:text-[#1E2A5A]"
                            >
                                {t('welcome.nav_teachers')}
                            </a>
                        </nav>

                        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5 md:gap-3 lg:gap-3.5">
                            {/* 1. Language Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex shrink-0 cursor-pointer items-center gap-1 rounded-full border-2 border-[#EAE4D2] bg-white px-2.5 py-1 text-[11px] font-bold text-[#5C6480] sm:px-3 sm:py-1.5 sm:text-xs">
                                        <Globe className="h-3.5 w-3.5 text-[#1E2A5A]" />
                                        <span className="font-extrabold uppercase">
                                            {locale}
                                        </span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="z-[60] rounded-2xl border border-[#EAE4D2] bg-white p-1.5 shadow-xl"
                                >
                                    <DropdownMenuItem
                                        onClick={() => setLanguage('en')}
                                        className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-1.5 text-xs font-bold"
                                    >
                                        <span>English (EN)</span>
                                        {locale === 'en' && (
                                            <Check className="h-3.5 w-3.5 text-[#1E2A5A]" />
                                        )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setLanguage('uz')}
                                        className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-1.5 text-xs font-bold"
                                    >
                                        <span>O'zbek (UZ)</span>
                                        {locale === 'uz' && (
                                            <Check className="h-3.5 w-3.5 text-[#1E2A5A]" />
                                        )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setLanguage('ru')}
                                        className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-1.5 text-xs font-bold"
                                    >
                                        <span>Русский (RU)</span>
                                        {locale === 'ru' && (
                                            <Check className="h-3.5 w-3.5 text-[#1E2A5A]" />
                                        )}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {auth.user ? (
                                <Link
                                    href="/dashboard"
                                    className="btn-primary shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-transform hover:-translate-y-0.5 sm:px-5 sm:py-2.5 sm:text-sm"
                                >
                                    {t('nav.dashboard')}
                                </Link>
                            ) : (
                                <>
                                    {/* 2. Text Link: Log In (Visible on mobile & desktop) */}
                                    <Link
                                        href="/login"
                                        className="shrink-0 px-1.5 py-1 text-xs font-bold text-[#1E2A5A] hover:underline sm:px-2.5 sm:text-sm"
                                    >
                                        {t('welcome.login')}
                                    </Link>

                                    {/* 3. Solid Primary CTA: Register (Visible on mobile & desktop) */}
                                    <Link
                                        href="/register"
                                        className="btn-primary shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-transform hover:-translate-y-0.5 sm:px-4 sm:py-2 sm:text-sm"
                                    >
                                        {t('welcome.register')}
                                    </Link>

                                    {/* 4. Outlined Secondary: Be a teacher (Desktop only; on mobile inside triple-line menu) */}
                                    <Link
                                        href="/register?role=teacher"
                                        className="hidden shrink-0 items-center rounded-full border border-[#1E2A5A]/30 px-3 py-2 text-xs font-bold text-[#1E2A5A] transition-all hover:bg-[#EEF4FB] sm:inline-flex md:text-sm"
                                    >
                                        {t('welcome.be_teacher')}
                                    </Link>

                                    {/* 5. Secondary Button: Find a tutor / Tutors (Desktop only; on mobile inside triple-line menu) */}
                                    <a
                                        href="#teachers"
                                        className="hidden shrink-0 items-center rounded-full border border-[#1E2A5A] bg-transparent px-3.5 py-2 text-xs font-bold text-[#1E2A5A] transition-all hover:bg-[#1E2A5A] hover:text-white sm:inline-flex md:text-sm"
                                    >
                                        {t('welcome.book_lesson')}
                                    </a>
                                </>
                            )}

                            {/* Mobile Drawer Hamburger Button */}
                            <button
                                onClick={() =>
                                    setMobileMenuOpen(!mobileMenuOpen)
                                }
                                className="flex shrink-0 rounded-xl p-1 text-[#1E2A5A] transition-colors hover:bg-[#EEF4FB] lg:hidden"
                                aria-label="Toggle Menu"
                            >
                                {mobileMenuOpen ? (
                                    <X className="h-5 w-5" />
                                ) : (
                                    <Menu className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Drawer Menu */}
                    {mobileMenuOpen && (
                        <div className="animate-in border-t border-[#EAE4D2] bg-white px-6 py-5 shadow-lg duration-200 slide-in-from-top lg:hidden">
                            <div className="flex flex-col gap-4 font-semibold text-[#5C6480]">
                                <a
                                    href="#teachers"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="py-1 text-base font-bold text-[#1E2A5A] transition-colors hover:text-[#D9B437]"
                                >
                                    {t('welcome.book_lesson')} →
                                </a>
                                <Link
                                    href="/register?role=teacher"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="inline-flex items-center gap-1.5 py-1 text-base font-bold text-[#1E2A5A]"
                                >
                                    {t('welcome.be_teacher')} →
                                </Link>
                                <a
                                    href="#why"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="py-1 text-base text-[#1E2A5A] transition-colors hover:text-[#D9B437]"
                                >
                                    {t('welcome.nav_why_humans')}
                                </a>
                                <a
                                    href="#how"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="py-1 text-base text-[#1E2A5A] transition-colors hover:text-[#D9B437]"
                                >
                                    {t('welcome.nav_how_it_works')}
                                </a>
                                <a
                                    href="#teachers"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="py-1 text-base text-[#1E2A5A] transition-colors hover:text-[#D9B437]"
                                >
                                    {t('welcome.nav_teachers')}
                                </a>
                                {!auth.user && (
                                    <div className="flex items-center gap-3 border-t border-[#EAE4D2] pt-4">
                                        <Link
                                            href="/login"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex-1 rounded-xl border border-[#1E2A5A]/20 py-2.5 text-center text-sm font-bold text-[#1E2A5A]"
                                        >
                                            {t('welcome.login')}
                                        </Link>
                                        <Link
                                            href="/register"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="btn-primary flex-1 rounded-xl py-2.5 text-center text-sm font-bold"
                                        >
                                            {t('welcome.register')}
                                        </Link>
                                    </div>
                                )}

                                <div className="flex items-center justify-between border-t border-[#EAE4D2] pt-4">
                                    <span className="text-xs font-bold text-[#6B7394]">
                                        {t('welcome.language')}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setLanguage('en');
                                                setMobileMenuOpen(false);
                                            }}
                                            className={`rounded-full px-3 py-1 text-xs font-bold ${locale === 'en' ? 'bg-[#1E2A5A] text-white' : 'bg-[#EEF4FB] text-[#1E2A5A]'}`}
                                        >
                                            EN
                                        </button>
                                        <button
                                            onClick={() => {
                                                setLanguage('uz');
                                                setMobileMenuOpen(false);
                                            }}
                                            className={`rounded-full px-3 py-1 text-xs font-bold ${locale === 'uz' ? 'bg-[#1E2A5A] text-white' : 'bg-[#EEF4FB] text-[#1E2A5A]'}`}
                                        >
                                            UZ
                                        </button>
                                        <button
                                            onClick={() => {
                                                setLanguage('ru');
                                                setMobileMenuOpen(false);
                                            }}
                                            className={`rounded-full px-3 py-1 text-xs font-bold ${locale === 'ru' ? 'bg-[#1E2A5A] text-white' : 'bg-[#EEF4FB] text-[#1E2A5A]'}`}
                                        >
                                            RU
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </header>

                {/* ── Hero Section ── */}
                <section className="overflow-hidden bg-[#FDF7E4] py-16 lg:py-24">
                    <div className="wrap grid items-center gap-12 lg:grid-cols-2">
                        <div>
                            <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#1E2A5A] shadow-sm">
                                {t('welcome.hero_badge')}
                            </span>
                            <h1 className="mb-5 text-4xl font-extrabold md:text-5xl lg:text-7xl">
                                {t('welcome.hero_title_prefix')}
                                <span className="hero-hum">{t('welcome.hero_title_highlight1')}</span>
                                {t('welcome.hero_title_mid')}
                                <span className="hero-strike">{t('welcome.hero_title_highlight2')}</span>
                                {t('welcome.hero_title_suffix')}
                            </h1>
                            <p className="mb-8 max-w-[500px] text-lg text-[#5C6480] md:text-xl">
                                {t('welcome.hero_subtitle')}
                            </p>
                            <div className="mb-6 flex flex-wrap gap-4">
                                <Link
                                    href={getBookLessonLink()}
                                    className="btn-primary rounded-full px-7 py-3.5 text-base font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg"
                                >
                                    {t('welcome.book_lesson')}
                                </Link>
                                <a
                                    href="#teachers"
                                    className="btn-outline rounded-full px-7 py-3.5 text-base font-bold transition-all hover:-translate-y-0.5 hover:bg-[#1E2A5A] hover:text-white"
                                >
                                    {t('welcome.meet_teachers')}
                                </a>
                            </div>
                            <p className="text-[15px] font-medium text-[#5C6480]">
                                {t('welcome.hero_trust')}
                            </p>
                        </div>

                        {/* 3D Interactive Hero Illustration with Multi-layer Parallax & Audio Waves */}
                        <HeroIllustration3D
                            liveLessonText={t('welcome.live_lesson')}
                            teacherDialogueText={t('welcome.hero_dialogue_teacher')}
                            teacherLabelText={t('welcome.teacher_label')}
                            studentDialogueText={t('welcome.hero_dialogue_student')}
                            studentCalloutLabelText={t('welcome.hero_student_callout_label')}
                            studentLabelText={t('welcome.student_label')}
                        />
                    </div>
                </section>

                {/* ── About ConvoMate Platform Purpose & Integration ── */}
                <section className="border-y border-[#EAE4D2] bg-white py-10 md:py-14">
                    <div className="wrap">
                        <div className="rounded-3xl border border-[#EAE4D2] bg-[#FDFBF7] p-7 md:p-10 shadow-xs">
                            <div className="max-w-3xl">
                                <span className="mb-3 inline-block rounded-full bg-[#1E2A5A]/10 px-3.5 py-1 text-xs font-extrabold tracking-wider text-[#1E2A5A] uppercase">
                                    {t('welcome.about_badge')}
                                </span>
                                <h2 className="mb-4 text-2xl font-extrabold text-[#1E2A5A] md:text-3xl">
                                    {t('welcome.about_title')}
                                </h2>
                                <p className="mb-4 text-base leading-relaxed text-[#5C6480] md:text-lg">
                                    {t('welcome.about_desc1')}
                                </p>
                                <p className="text-sm leading-relaxed text-[#5C6480] md:text-base">
                                    {t('welcome.about_desc2')}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="py-20 md:py-28" id="why">
                    <div className="wrap">
                        <div className="mb-14 text-center">
                            <h2 className="mb-4 text-3xl font-extrabold md:text-[46px]">
                                {t('welcome.why_title')}
                            </h2>
                            <p className="mx-auto max-w-[580px] text-lg text-[#5C6480]">
                                {t('welcome.why_subtitle')}
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            <TiltCard3D
                                glare={true}
                                className="rounded-[22px] border-[1.5px] border-[#FBEDBC] bg-[#FDF7E4] p-8 shadow-xs hover:shadow-xl hover:border-[#F7DE8B] transition-all"
                            >
                                <DepthLayer z={22} className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FBEDBC] text-2xl shadow-xs">
                                    ⚡
                                </DepthLayer>
                                <DepthLayer z={14}>
                                    <h3 className="mb-3 text-xl font-bold">
                                        {t('welcome.why_f1_title')}
                                    </h3>
                                    <p className="text-[15.5px] text-[#5C6480]">
                                        {t('welcome.why_f1_desc')}
                                    </p>
                                </DepthLayer>
                            </TiltCard3D>
                            <TiltCard3D
                                glare={true}
                                className="rounded-[22px] border-[1.5px] border-[#E3EDF8] bg-[#E3EDF8] p-8 shadow-xs hover:shadow-xl hover:border-[#F7DE8B] transition-all"
                            >
                                <DepthLayer z={22} className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FBEDBC] text-2xl shadow-xs">
                                    🎓
                                </DepthLayer>
                                <DepthLayer z={14}>
                                    <h3 className="mb-3 text-xl font-bold">
                                        {t('welcome.why_f2_title')}
                                    </h3>
                                    <p className="text-[15.5px] text-[#5C6480]">
                                        {t('welcome.why_f2_desc')}
                                    </p>
                                </DepthLayer>
                            </TiltCard3D>
                            <TiltCard3D
                                glare={true}
                                className="rounded-[22px] border-[1.5px] border-[#EAE4D2] bg-white p-8 shadow-xs hover:shadow-xl hover:border-[#F7DE8B] transition-all"
                            >
                                <DepthLayer z={22} className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FBEDBC] text-2xl shadow-xs">
                                    🤝
                                </DepthLayer>
                                <DepthLayer z={14}>
                                    <h3 className="mb-3 text-xl font-bold">
                                        {t('welcome.why_f3_title')}
                                    </h3>
                                    <p className="text-[15.5px] text-[#5C6480]">
                                        {t('welcome.why_f3_desc')}
                                    </p>
                                </DepthLayer>
                            </TiltCard3D>
                        </div>

                        <TiltCard3D
                            glare={false}
                            className="mt-10 flex flex-col items-center gap-6 rounded-[22px] bg-[#F7DE8B] p-8 sm:flex-row shadow-sm hover:shadow-md transition-all"
                        >
                            <DepthLayer z={18}>
                                <ShieldCheck className="h-10 w-10 shrink-0 text-[#1E2A5A]" />
                            </DepthLayer>
                            <DepthLayer z={12}>
                                <b className="mb-1 block font-['Bricolage_Grotesque'] text-lg text-[#1E2A5A]">
                                    {t('welcome.verified_title')}
                                </b>
                                <p className="text-[15px] text-[#1E2A5A]/80">
                                    {t('welcome.verified_desc')}
                                </p>
                            </DepthLayer>
                        </TiltCard3D>
                    </div>
                </section>

                {/* ── Steps Section ── */}
                <section className="bg-[#FBFAF6] py-20 md:py-28" id="how">
                    <div className="wrap">
                        <div className="mb-14 text-center">
                            <h2 className="mb-4 text-3xl font-extrabold md:text-[46px]">
                                {t('welcome.how_title')}
                            </h2>
                            <p className="mx-auto max-w-[560px] text-lg text-[#5C6480]">
                                {t('welcome.how_subtitle')}
                            </p>
                        </div>

                        <div className="grid items-stretch gap-6 lg:grid-cols-3">
                            {/* Step 1 */}
                            <TiltCard3D
                                glare={true}
                                className="flex h-full flex-col rounded-[22px] border border-[#EAE4D2] bg-white p-6 shadow-xs hover:shadow-xl transition-all"
                            >
                                <DepthLayer z={16} className="mb-6 flex h-[248px] flex-col justify-center gap-3 overflow-hidden rounded-2xl border border-[#EAE4D2] bg-[#FBFAF6] p-5 shadow-xs">
                                    <div className="rounded-xl border border-[#EAE4D2] bg-white px-3.5 py-2.5 text-[13px] text-[#5C6480] shadow-2xs">
                                        <b className="text-[#1E2A5A]">{t('welcome.mock_name')}</b> ·
                                        Aziza
                                    </div>
                                    <div className="text-[11px] font-bold tracking-widest text-[#5C6480] uppercase">
                                        {t('welcome.mock_level')}
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="rounded-lg border border-[#EAE4D2] bg-white px-2.5 py-1.5 text-xs font-semibold shadow-2xs">
                                            A2
                                        </span>
                                        <span className="rounded-lg border border-[#F7DE8B] bg-[#F7DE8B] px-2.5 py-1.5 text-xs font-semibold text-[#1E2A5A] shadow-2xs">
                                            B1
                                        </span>
                                        <span className="rounded-lg border border-[#EAE4D2] bg-white px-2.5 py-1.5 text-xs font-semibold shadow-2xs">
                                            B2
                                        </span>
                                    </div>
                                    <div className="rounded-xl bg-[#1E2A5A] py-2.5 text-center text-[13px] font-bold text-white shadow-xs">
                                        {t('welcome.mock_create_acc')}
                                    </div>
                                </DepthLayer>
                                <DepthLayer z={22} className="mb-3 flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7DE8B] font-['Bricolage_Grotesque'] text-lg font-extrabold text-[#1E2A5A] shadow-xs">
                                        1
                                    </div>
                                    <h3 className="text-xl font-bold">
                                        {t('welcome.how_step_1_title')}
                                    </h3>
                                </DepthLayer>
                                <DepthLayer z={10}>
                                    <p className="text-[15.5px] text-[#5C6480]">
                                        {t('welcome.how_step_1_desc')}
                                    </p>
                                </DepthLayer>
                            </TiltCard3D>

                            {/* Step 2 */}
                            <TiltCard3D
                                glare={true}
                                className="flex h-full flex-col rounded-[22px] border border-[#EAE4D2] bg-white p-6 shadow-xs hover:shadow-xl transition-all"
                            >
                                <DepthLayer z={16} className="mb-6 flex h-[248px] flex-col justify-center gap-3 overflow-hidden rounded-2xl border border-[#EAE4D2] bg-[#FBFAF6] p-5 shadow-xs">
                                    <div className="flex items-center gap-3">
                                        <img
                                            alt="Kamola"
                                            className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
                                            src="/hero_avatar_3.jpg"
                                        />
                                        <div>
                                            <div className="text-[15px] leading-tight font-bold text-[#1E2A5A]">
                                                Kamola
                                            </div>
                                            <div className="text-[12px] text-[#5C6480]">
                                                {t('welcome.teacher_kamola_badge')}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[12.5px] leading-snug text-[#232A45]">
                                        {t('welcome.teacher_kamola_desc')}
                                    </p>
                                    <div className="flex gap-2">
                                        <span className="rounded-lg border border-[#EAE4D2] bg-white px-2.5 py-1.5 text-xs font-semibold shadow-2xs">
                                            15:00
                                        </span>
                                        <span className="rounded-lg border border-[#F7DE8B] bg-[#F7DE8B] px-2.5 py-1.5 text-xs font-semibold text-[#1E2A5A] shadow-2xs">
                                            17:30
                                        </span>
                                    </div>
                                    <div className="rounded-xl bg-[#1E2A5A] py-2.5 text-center text-[13px] font-bold text-white shadow-xs">
                                        {t('welcome.mock_book_btn')}
                                    </div>
                                </DepthLayer>
                                <DepthLayer z={22} className="mb-3 flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7DE8B] font-['Bricolage_Grotesque'] text-lg font-extrabold text-[#1E2A5A] shadow-xs">
                                        2
                                    </div>
                                    <h3 className="text-xl font-bold">
                                        {t('welcome.how_step_2_title')}
                                    </h3>
                                </DepthLayer>
                                <DepthLayer z={10}>
                                    <p className="text-[15.5px] text-[#5C6480]">
                                        {t('welcome.how_step_2_desc')}
                                    </p>
                                </DepthLayer>
                            </TiltCard3D>

                            {/* Step 3 */}
                            <TiltCard3D
                                glare={true}
                                className="flex h-full flex-col rounded-[22px] border border-[#EAE4D2] bg-white p-6 shadow-xs hover:shadow-xl transition-all"
                            >
                                <DepthLayer z={16} className="mb-6 flex h-[248px] flex-col justify-center gap-3 overflow-hidden rounded-2xl border border-[#EAE4D2] bg-[#FBFAF6] p-5 shadow-xs">
                                    <div className="flex items-center justify-between gap-2 rounded-xl border border-[#EAE4D2] bg-white p-3 shadow-2xs">
                                        <div className="min-w-0">
                                            <b className="block text-[13px] leading-tight text-[#1E2A5A]">
                                                {t('welcome.mock_starts_in')}
                                            </b>
                                            <small className="block text-[11px] leading-tight text-[#5C6480]">
                                                {t('welcome.mock_freestyle')}
                                            </small>
                                        </div>
                                        <span className="shrink-0 rounded-full bg-[#F7DE8B] px-3.5 py-2 text-[12px] font-extrabold text-[#1E2A5A] shadow-xs">
                                            {t('welcome.mock_join')}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <div className="h-[118px] overflow-hidden rounded-xl bg-gradient-to-br from-[#A9C6E8] to-[#C9DCF2] shadow-sm">
                                            <img
                                                alt="Student"
                                                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                                                src="/hero_avatar_4.jpg"
                                            />
                                        </div>
                                        <div className="h-[118px] overflow-hidden rounded-xl bg-gradient-to-br from-[#F7DE8B] to-[#FBEDBC] shadow-sm">
                                            <img
                                                alt="Teacher"
                                                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                                                src="/hero_avatar_5.jpg"
                                            />
                                        </div>
                                    </div>
                                </DepthLayer>
                                <DepthLayer z={22} className="mb-3 flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7DE8B] font-['Bricolage_Grotesque'] text-lg font-extrabold text-[#1E2A5A] shadow-xs">
                                        3
                                    </div>
                                    <h3 className="text-xl font-bold">
                                        {t('welcome.how_step_3_title')}
                                    </h3>
                                </DepthLayer>
                                <DepthLayer z={10}>
                                    <p className="text-[15.5px] text-[#5C6480]">
                                        {t('welcome.how_step_3_desc')}
                                    </p>
                                </DepthLayer>
                            </TiltCard3D>
                        </div>
                    </div>
                </section>

                {/* ── Teachers Section ── */}
                <section className="py-20 md:py-28" id="teachers">
                    <div className="wrap">
                        <div className="mb-14 text-center">
                            <h2 className="mb-4 text-3xl font-extrabold md:text-[46px]">
                                {t('welcome.teachers_section_title')}
                            </h2>
                            <p className="mx-auto max-w-[560px] text-lg text-[#5C6480]">
                                {t('welcome.teachers_section_subtitle')}
                            </p>
                        </div>

                        <div
                            className={`grid gap-6 ${
                                certifiedTeachers.length === 1
                                    ? 'max-w-md mx-auto grid-cols-1'
                                    : certifiedTeachers.length === 2
                                    ? 'max-w-3xl mx-auto md:grid-cols-2'
                                    : 'md:grid-cols-2 lg:grid-cols-3'
                            }`}
                        >
                            {certifiedTeachers.length === 0 ? (
                                <div className="col-span-full rounded-2xl border border-dashed border-[#EAE4D2] bg-[#FAF8F5] p-8 text-center">
                                    <p className="text-base font-semibold text-[#1E2A5A]">
                                        {t('welcome.no_teachers_yet')}
                                    </p>
                                    <Link
                                        href="/register?role=teacher"
                                        className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#1E2A5A] px-5 py-2 text-xs font-bold text-[#1E2A5A] hover:bg-[#1E2A5A] hover:text-white transition-all"
                                    >
                                        {t('welcome.be_teacher')}
                                    </Link>
                                </div>
                            ) : (
                                certifiedTeachers.map((teacher) => (
                                    <TiltCard3D
                                        key={teacher.id}
                                        glare={true}
                                        className="flex h-full flex-col rounded-[22px] border border-[#EAE4D2] bg-white p-6 shadow-xs hover:shadow-xl transition-all"
                                    >
                                        <DepthLayer z={20} className="mb-4 flex items-center gap-4">
                                            {teacher.avatar ? (
                                                <img
                                                    alt={teacher.name}
                                                    className="h-16 w-16 shrink-0 rounded-full object-cover shadow-sm ring-2 ring-[#EAE4D2]"
                                                    src={teacher.avatar}
                                                />
                                            ) : (
                                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#1E2A5A] text-xl font-bold text-white shadow-inner">
                                                    {teacher.name ? teacher.name.charAt(0).toUpperCase() : 'T'}
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="text-xl font-bold text-[#1E2A5A]">
                                                    {teacher.name}
                                                </h3>
                                                <span className="inline-block rounded-full bg-[#FDF7E4] px-2.5 py-1 text-xs font-semibold text-[#854F0B]">
                                                    {teacher.speaking_band
                                                        ? `IELTS Speaking Band ${teacher.speaking_band}`
                                                        : teacher.overall_level || t('welcome.certified_teacher')}
                                                </span>
                                            </div>
                                        </DepthLayer>
                                        <DepthLayer z={10} className="mb-4 flex-1">
                                            <p className="text-sm font-medium text-[#5C6480] line-clamp-3">
                                                {teacher.headline || teacher.bio || t('welcome.default_teacher_desc')}
                                            </p>
                                        </DepthLayer>
                                        <DepthLayer z={15} className="mb-4 flex items-center justify-between border-t border-[#EAE4D2] pt-3 text-xs font-semibold text-[#5C6480]">
                                            <span className="flex items-center gap-1 font-bold text-[#1E2A5A]">
                                                <Star className="h-3.5 w-3.5 fill-[#F7DE8B] text-[#F7DE8B]" />{' '}
                                                {teacher.rating || '5.0'} ({teacher.reviews || '12'}{' '}
                                                {t('welcome.reviews')})
                                            </span>
                                            <span className="font-bold text-[#1D9E75]">
                                                {t('welcome.slots_available')}
                                            </span>
                                        </DepthLayer>
                                        <DepthLayer z={22}>
                                            <Link
                                                href={getBookLessonLink(teacher.id)}
                                                className="btn-primary block w-full rounded-xl py-2.5 text-center text-xs font-bold transition-all hover:scale-[1.02] shadow-xs hover:shadow-md"
                                            >
                                                {t('welcome.book_with_teacher', {
                                                    name: teacher.name,
                                                })}
                                            </Link>
                                        </DepthLayer>
                                    </TiltCard3D>
                                ))
                            )}
                        </div>

                        <div className="mt-12 text-center">
                            <Link
                                href={getBookLessonLink()}
                                className="btn-outline inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-bold transition-all hover:bg-[#1E2A5A] hover:text-white"
                            >
                                {t('welcome.browse_all_teachers')}{' '}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ── Bottom CTA ── */}
                <section className="bg-[#1E2A5A] py-16 text-white md:py-20">
                    <div className="wrap text-center">
                        <h2 className="mb-4 text-3xl font-extrabold text-white md:text-5xl">
                            {t('welcome.bottom_cta_title')}
                        </h2>
                        <p className="mx-auto mb-8 max-w-[500px] text-lg text-[#A9C6E8]">
                            {t('welcome.bottom_cta_subtitle')}
                        </p>
                        <Link
                            href={getBookLessonLink()}
                            className="btn-butter inline-block rounded-full px-9 py-4 text-lg font-extrabold transition-transform hover:scale-105"
                        >
                            {t('welcome.book_now')}
                        </Link>
                    </div>
                </section>

                {/* ── Footer ── */}
                <footer className="border-t border-[#EAE4D2] bg-white py-10">
                    <div className="wrap flex flex-col items-center justify-between gap-4 text-xs font-semibold text-[#5C6480] sm:flex-row">
                        <p>
                            © {new Date().getFullYear()} ConvoMate.{' '}
                            {t('welcome.footer_rights_text')}
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-6">
                            <a href="#why" className="hover:text-[#1E2A5A]">
                                {t('welcome.nav_why_humans')}
                            </a>
                            <a href="#how" className="hover:text-[#1E2A5A]">
                                {t('welcome.nav_how_it_works')}
                            </a>
                            <a
                                href="#teachers"
                                className="hover:text-[#1E2A5A]"
                            >
                                {t('welcome.nav_teachers')}
                            </a>
                            <Link
                                href="/privacy"
                                className="hover:text-[#1E2A5A]"
                            >
                                {t('welcome.footer_privacy')}
                            </Link>
                            <Link
                                href="/terms"
                                className="hover:text-[#1E2A5A]"
                            >
                                {t('welcome.footer_terms')}
                            </Link>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
