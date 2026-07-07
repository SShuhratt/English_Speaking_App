import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';
import { useTranslation } from '@/hooks/use-translation';
import { useState, useEffect } from 'react';
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
    const [activeTab, setActiveTab] = useState<
        'home' | 'features' | 'how-it-works' | 'teachers'
    >('home');

    // Filter states for Teachers view
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState<
        'all' | 'ielts' | 'business' | 'kids'
    >('all');

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            if (
                hash === 'features' ||
                hash === 'how-it-works' ||
                hash === 'teachers'
            ) {
                setActiveTab(hash);
            } else {
                setActiveTab('home');
            }
        };

        handleHashChange();
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const handleTabClick = (
        tab: 'home' | 'features' | 'how-it-works' | 'teachers',
        e: React.MouseEvent,
    ) => {
        e.preventDefault();
        setActiveTab(tab);
        if (tab === 'home') {
            window.history.pushState(null, '', '/');
        } else {
            window.location.hash = tab;
        }
    };

    const teachers = [
        {
            name: 'Sarah Thompson',
            level: 'IELTS 9.0 • Speaking 9.0',
            desc: t('welcome.teachers_sarah_desc'),
            specialties: ['ielts'],
            tags: [
                t('welcome.teachers_sarah_tag_1') || 'Native Speaker',
                t('welcome.teachers_sarah_tag_2') || 'Cambridge Cert.',
            ],
            rating: 4.9,
            reviews: 142,
            experience: '5 y experience',
            img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCP6KzU0g88x74eYlZupQlTr4r6Dv61ALDlXgFBOe6zjKF-_MavmbjsELNbj7YIhrgRDSrJHj5MEh-qsrNp6MRFdh0t6qOkYFzSu23BUDQmDWDnG5LRdEtztOlrtjR26oP_Rfb-Vb6DqGlL9V3hpDBVFZIK3oocHjS1nZNZffuFILAamHaOems0riUpZ9OYymFeyi18stuJFZdM1oJGz-nbYzFLqUUn7aVVglr-TLtIPetoS9h_7fRPAg',
        },
        {
            name: 'James Wilson',
            level: 'CEFR C2 • IELTS 8.5',
            desc: t('welcome.teachers_james_desc'),
            specialties: ['business'],
            tags: [
                t('welcome.teachers_james_tag_1') || 'Business English',
                t('welcome.teachers_james_tag_2') || 'TOEFL Prep',
            ],
            rating: 4.8,
            reviews: 98,
            experience: '3 y experience',
            img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFi4QKp6n6_j28XeDoQ_U3N2hiOXEzWvPlnzomio0pdEJBN7hHjNLXSs1XYj7PA7SIx8sM-IcDj6x8xd7XOwNZpmATS6mgodbxAM89fTxX-Jbgu2EE8RZQjIl-KW5h11kmkwnv-Pyh0-9DiVTUV2uTOFPqxVIFXBuZMk1yFic_SdpIns1fXijpXPRN-Bska3rMHFq9u8ekOptujySX2QS1VCggcTN3LdPx2wQzlz2S19oy0ljFdg-IPw',
        },
        {
            name: 'Emma Davis',
            level: 'IELTS 8.5 • Speaking 8.5',
            desc: t('welcome.teachers_emma_desc'),
            specialties: ['kids'],
            tags: [
                t('welcome.teachers_emma_tag_1') || 'Kids & Teens',
                t('welcome.teachers_emma_tag_2') || 'TESOL Cert.',
            ],
            rating: 5.0,
            reviews: 231,
            experience: '7 y experience',
            img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgOv4ov2fPY8-bxY_eaeRe-RpgfhIMMpSqo80QI2nChpo-zmZ6PlOGsWWX_uTXkHwpGIzh_AQ2D9hCA6O8AKKwq3JvktJDO_HtBcTIgVy-9lbg3ib1RrNtMhYK81PNCQNArAzNUJTp3NfALZzeUraagaktMi0W_uYx3per0sQ5ur99r4tMdXcUliSD6ByjgEb5eZ_Ay8SDvSEhZO1lKeQKCcnniADF3SNLmVO4ln3D2SFfu40tRcIEFw',
        },
    ];

    const filteredTeachers = teachers.filter((teacher) => {
        const matchesSpecialty =
            selectedSpecialty === 'all' ||
            teacher.specialties.includes(selectedSpecialty);
        const matchesSearch =
            teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            teacher.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
            teacher.tags.some((tag) =>
                tag.toLowerCase().includes(searchQuery.toLowerCase()),
            );
        return matchesSpecialty && matchesSearch;
    });

    return (
        <>
            <Head title={t('welcome.title') + ' - ConvoMate'} />

            <div className="min-h-screen bg-white font-sans text-[#1b1b1f] selection:bg-[#fae18e] selection:text-[#061445]">
                {/* ── Navbar ── */}
                <header className="fixed top-0 right-0 left-0 z-50 border-b border-[#c6c5d0]/30 bg-white/80 backdrop-blur-lg transition-all duration-300">
                    <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 md:px-12">
                        <Link
                            href="/"
                            onClick={(e) => handleTabClick('home', e)}
                            className="group flex items-center gap-3"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#061445] transition-transform group-hover:scale-105">
                                <AppLogoIcon className="h-5 w-5 text-[#fae18e]" />
                            </div>
                            <span className="text-2xl font-extrabold tracking-tight text-[#061445]">
                                Convo
                                <span
                                    className="text-[#fae18e]"
                                    style={{
                                        WebkitTextStroke: '0.5px #d4a900',
                                    }}
                                >
                                    Mate
                                </span>
                            </span>
                        </Link>

                        <nav className="hidden items-center gap-10 md:flex">
                            <a
                                href="#features"
                                onClick={(e) => handleTabClick('features', e)}
                                className={`pb-1 text-[15px] font-semibold transition-all ${
                                    activeTab === 'features'
                                        ? 'border-b-2 border-[#fae18e] font-bold text-[#061445]'
                                        : 'text-[#45464f] hover:text-[#061445]'
                                }`}
                            >
                                {t('welcome.nav_features')}
                            </a>
                            <a
                                href="#how-it-works"
                                onClick={(e) =>
                                    handleTabClick('how-it-works', e)
                                }
                                className={`pb-1 text-[15px] font-semibold transition-all ${
                                    activeTab === 'how-it-works'
                                        ? 'border-b-2 border-[#fae18e] font-bold text-[#061445]'
                                        : 'text-[#45464f] hover:text-[#061445]'
                                }`}
                            >
                                {t('welcome.nav_how_it_works')}
                            </a>
                            <a
                                href="#teachers"
                                onClick={(e) => handleTabClick('teachers', e)}
                                className={`pb-1 text-[15px] font-semibold transition-all ${
                                    activeTab === 'teachers'
                                        ? 'border-b-2 border-[#fae18e] font-bold text-[#061445]'
                                        : 'text-[#45464f] hover:text-[#061445]'
                                }`}
                            >
                                {t('welcome.nav_teachers')}
                            </a>
                        </nav>

                        <div className="flex items-center gap-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex h-10 cursor-pointer items-center gap-2 rounded-xl px-3 font-semibold text-[#45464f] hover:bg-[#d0e4ff]/40 hover:text-[#061445]"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">
                                            globe
                                        </span>
                                        <span className="text-xs font-bold uppercase">
                                            {locale}
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="rounded-2xl border border-[#c6c5d0]/50 bg-white p-1.5 shadow-xl"
                                >
                                    {(['en', 'uz', 'ru'] as const).map(
                                        (lang) => (
                                            <DropdownMenuItem
                                                key={lang}
                                                onClick={() =>
                                                    setLanguage(lang)
                                                }
                                                className="flex cursor-pointer items-center justify-between rounded-xl px-4 py-2.5 hover:bg-[#d0e4ff]/40"
                                            >
                                                <span className="text-sm font-semibold text-[#061445]">
                                                    {lang === 'en'
                                                        ? 'English'
                                                        : lang === 'uz'
                                                          ? "O'zbek"
                                                          : 'Русский'}
                                                </span>
                                                {locale === lang && (
                                                    <span className="h-2 w-2 rounded-full bg-[#fae18e]" />
                                                )}
                                            </DropdownMenuItem>
                                        ),
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="rounded-full bg-[#061445] px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-105 active:scale-95"
                                >
                                    {t('nav.dashboard')}
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#45464f] transition-colors hover:text-[#061445]"
                                    >
                                        {t('auth.login')}
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="rounded-full bg-[#fae18e] px-6 py-3 text-sm font-bold text-[#061445] shadow-md transition-all hover:scale-105 hover:bg-[#f0d070] active:scale-95"
                                    >
                                        {t('welcome.get_started')}
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* ── Main Content Views ── */}
                <main className="pt-20">
                    {activeTab === 'home' && (
                        <>
                            {/* ── Home Hero Section ── */}
                            <section className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-28">
                                {/* Pale Blue background band */}
                                <div className="absolute inset-x-4 top-0 -z-10 h-[85%] rounded-[3rem] bg-[#d0e4ff]/30 md:inset-x-8" />

                                <div className="mx-auto max-w-7xl px-6 md:px-12">
                                    <div className="grid items-center gap-12 lg:grid-cols-12">
                                        {/* Left: Content */}
                                        <div className="space-y-8 lg:col-span-6">
                                            <div className="inline-flex items-center gap-2 rounded-full border border-[#c6c5d0]/30 bg-white px-4 py-2 shadow-sm">
                                                <span
                                                    className="material-symbols-outlined text-[20px] text-[#061445]"
                                                    style={{
                                                        fontVariationSettings:
                                                            "'FILL' 1",
                                                    }}
                                                >
                                                    verified
                                                </span>
                                                <span className="text-xs font-bold tracking-wider text-[#061445] uppercase">
                                                    {t('welcome.badge')}
                                                </span>
                                            </div>

                                            <h1 className="text-5xl leading-[1.1] font-extrabold tracking-tight text-[#061445] sm:text-6xl lg:text-[68px]">
                                                {t('welcome.title')}
                                                <br />
                                                <span className="butter-underline">
                                                    {t(
                                                        'welcome.title_fluently',
                                                    )}
                                                </span>{' '}
                                                {t('welcome.title_today')}
                                            </h1>

                                            <p className="max-w-lg text-lg leading-relaxed text-[#45464f]">
                                                {t('welcome.subtitle')}
                                            </p>

                                            <div className="flex flex-col gap-4 pt-2 sm:flex-row">
                                                <Link
                                                    href={register()}
                                                    className="flex h-14 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#061445] px-8 font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
                                                >
                                                    {t('welcome.cta_start')}
                                                    <span
                                                        className="material-symbols-outlined text-[20px] text-white"
                                                        style={{
                                                            fontVariationSettings:
                                                                "'FILL' 1",
                                                        }}
                                                    >
                                                        bolt
                                                    </span>
                                                </Link>
                                                <a
                                                    href="#teachers"
                                                    onClick={(e) =>
                                                        handleTabClick(
                                                            'teachers',
                                                            e,
                                                        )
                                                    }
                                                    className="flex h-14 cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-[#061445]/15 bg-white px-8 font-bold text-[#061445] transition-all hover:bg-[#d0e4ff]/30 active:scale-95"
                                                >
                                                    {t('welcome.view_teachers')}
                                                </a>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-8 border-t border-[#c6c5d0]/30 pt-6 text-sm text-[#45464f]">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[20px] text-[#44617e]">
                                                        group
                                                    </span>
                                                    <span>
                                                        {t(
                                                            'welcome.trust_learners',
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="material-symbols-outlined text-[20px] text-[#fae18e]"
                                                        style={{
                                                            fontVariationSettings:
                                                                "'FILL' 1",
                                                        }}
                                                    >
                                                        star
                                                    </span>
                                                    <span>
                                                        {t(
                                                            'welcome.trust_rating',
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Video Call Mock visual */}
                                        <div className="relative lg:col-span-6">
                                            <div className="shadow-ambient-md relative rounded-[2rem] border border-[#c6c5d0]/40 bg-white p-4">
                                                <div className="grid aspect-video grid-cols-2 gap-3 overflow-hidden rounded-xl bg-[#d0e4ff]/10">
                                                    <div className="relative overflow-hidden rounded-xl">
                                                        <img
                                                            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400"
                                                            alt="Sarah M."
                                                            className="h-full w-full object-cover"
                                                        />
                                                        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-[#061445]/80 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                                                            🇬🇧 Sarah M. (UK)
                                                        </div>
                                                    </div>
                                                    <div className="relative overflow-hidden rounded-xl">
                                                        <img
                                                            src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400"
                                                            alt="David L."
                                                            className="h-full w-full object-cover"
                                                        />
                                                        <div className="absolute top-2 right-2 rounded-full bg-[#fae18e] px-2.5 py-1 text-[10px] font-bold text-[#061445]">
                                                            Live Practice
                                                        </div>
                                                        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-[#061445]/80 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                                                            🇺🇸 David L. (US)
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Feedback pill */}
                                                <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#c6c5d0]/30 bg-[#f5f3f7] p-3">
                                                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#fae18e] text-[#061445]">
                                                        <span className="material-symbols-outlined text-[20px]">
                                                            auto_awesome
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold tracking-wider text-[#45464f] uppercase">
                                                            Real-time Feedback
                                                        </p>
                                                        <p className="text-sm font-bold text-[#061445]">
                                                            CEFR Level: B2
                                                            Advanced
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Controls */}
                                                <div className="mt-3 flex justify-center gap-3">
                                                    {['mic', 'videocam'].map(
                                                        (icon, i) => (
                                                            <div
                                                                key={i}
                                                                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#d0e4ff] text-[#061445] transition-all hover:bg-[#fae18e]"
                                                            >
                                                                <span className="material-symbols-outlined text-[20px]">
                                                                    {icon}
                                                                </span>
                                                            </div>
                                                        ),
                                                    )}
                                                    <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#ba1a1a] text-white transition-all hover:opacity-90">
                                                        <span className="material-symbols-outlined text-[20px]">
                                                            call_end
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Floating lesson chip */}
                                            <div className="shadow-ambient absolute -right-4 -bottom-4 hidden rounded-[1.5rem] border border-[#c6c5d0]/50 bg-white p-4 md:block">
                                                <p className="text-[10px] font-bold tracking-wider text-[#45464f] uppercase">
                                                    Lesson Topic
                                                </p>
                                                <p className="text-lg font-bold text-[#061445]">
                                                    Business English
                                                </p>
                                                <div className="mt-1 flex gap-1.5">
                                                    <span className="rounded bg-[#d0e4ff]/60 px-2 py-0.5 text-[9px] font-bold text-[#061445]">
                                                        NEGOTIATION
                                                    </span>
                                                    <span className="rounded bg-[#d0e4ff]/60 px-2 py-0.5 text-[9px] font-bold text-[#061445]">
                                                        STRATEGY
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* ── Bento Grid Section ── */}
                            <section className="mx-auto max-w-7xl px-6 py-24 md:px-12">
                                <div className="mb-16 space-y-4 text-center">
                                    <h2 className="text-3xl font-extrabold tracking-tight text-[#061445] md:text-4xl lg:text-5xl">
                                        {t('welcome.home_bento_title').replace(
                                            'master',
                                            '',
                                        )}
                                        <span className="butter-underline">
                                            master
                                        </span>{' '}
                                        English
                                    </h2>
                                    <p className="mx-auto max-w-2xl text-lg text-[#45464f]">
                                        {t('welcome.home_bento_subtitle')}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    {/* Card 1: AI-Powered (2-column on md) */}
                                    <div className="shadow-ambient hover:shadow-ambient-md flex flex-col items-start justify-between gap-8 rounded-2xl bg-[#f5f3f7] p-8 transition-shadow md:col-span-2 md:flex-row">
                                        <div className="max-w-md space-y-4">
                                            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#fae18e]/35 px-3.5 py-1 text-xs font-bold tracking-wider text-[#061445] uppercase">
                                                {t(
                                                    'welcome.home_bento_1_accuracy',
                                                )}
                                            </div>
                                            <h3 className="text-2xl font-bold text-[#061445]">
                                                {t(
                                                    'welcome.home_bento_1_title',
                                                )}
                                            </h3>
                                            <p className="text-sm leading-relaxed text-[#45464f]">
                                                {t('welcome.home_bento_1_desc')}
                                            </p>
                                        </div>
                                        <div className="w-full space-y-3 rounded-xl border border-[#c6c5d0]/30 bg-white p-4 shadow-sm md:w-64">
                                            <div className="flex items-center gap-2 border-b border-[#c6c5d0]/20 pb-2 text-xs text-[#45464f]">
                                                <span className="material-symbols-outlined text-[16px] text-green-600">
                                                    check_circle
                                                </span>
                                                <span className="font-bold">
                                                    Pronunciation Check
                                                </span>
                                            </div>
                                            <p className="text-xs font-medium text-[#061445] italic">
                                                "I want to{' '}
                                                <span className="text-red-500 line-through">
                                                    improve
                                                </span>{' '}
                                                my vocabulary."
                                            </p>
                                            <p className="rounded-lg bg-[#d0e4ff]/30 p-2 text-[11px] leading-relaxed text-[#45464f]">
                                                💡{' '}
                                                <strong className="text-[#061445]">
                                                    AI Tip:
                                                </strong>{' '}
                                                Replace "improve" with{' '}
                                                <strong className="text-[#061445]">
                                                    "expand"
                                                </strong>{' '}
                                                for professional settings.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Card 2: Flexible Scheduling (Yellow card) */}
                                    <div className="shadow-ambient hover:shadow-ambient-md flex flex-col items-start justify-between rounded-2xl bg-[#fae18e]/30 p-8 transition-shadow">
                                        <div className="space-y-4">
                                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#fae18e] text-[#061445]">
                                                <span className="material-symbols-outlined text-[24px]">
                                                    calendar_today
                                                </span>
                                            </div>
                                            <h3 className="text-2xl font-bold text-[#061445]">
                                                {t(
                                                    'welcome.home_bento_2_title',
                                                )}
                                            </h3>
                                            <p className="text-sm leading-relaxed text-[#45464f]">
                                                {t('welcome.home_bento_2_desc')}
                                            </p>
                                        </div>
                                        <div className="mt-8 flex -space-x-3 overflow-hidden">
                                            {['JW', 'ED', 'ST'].map(
                                                (initials, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#061445] text-xs font-bold text-white"
                                                    >
                                                        {initials}
                                                    </div>
                                                ),
                                            )}
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#d0e4ff] text-xs font-bold text-[#061445]">
                                                +9
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card 3: Topic Discovery */}
                                    <div className="shadow-ambient hover:shadow-ambient-md flex flex-col items-start justify-between rounded-2xl bg-[#f5f3f7] p-8 transition-shadow">
                                        <div className="space-y-4">
                                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#d0e4ff] text-[#061445]">
                                                <span className="material-symbols-outlined text-[24px]">
                                                    explore
                                                </span>
                                            </div>
                                            <h3 className="text-2xl font-bold text-[#061445]">
                                                {t(
                                                    'welcome.home_bento_3_title',
                                                )}
                                            </h3>
                                            <p className="text-sm leading-relaxed text-[#45464f]">
                                                {t('welcome.home_bento_3_desc')}
                                            </p>
                                        </div>
                                        <div className="mt-8 flex flex-wrap gap-2">
                                            {[
                                                'Tech Talk',
                                                'Job Interview',
                                                'Travel Idioms',
                                            ].map((topic) => (
                                                <span
                                                    key={topic}
                                                    className="rounded-full border border-[#c6c5d0]/30 bg-white px-3 py-1 text-xs font-bold text-[#061445] shadow-sm"
                                                >
                                                    {topic}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Card 4: Google Meet Integration (2-column on md) */}
                                    <div className="shadow-ambient hover:shadow-ambient-md flex flex-col items-start justify-between gap-8 rounded-2xl bg-[#d0e4ff]/20 p-8 transition-shadow md:col-span-2 md:flex-row">
                                        <div className="max-w-md space-y-4">
                                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#d0e4ff] text-[#061445]">
                                                <span className="material-symbols-outlined text-[24px]">
                                                    video_call
                                                </span>
                                            </div>
                                            <h3 className="text-2xl font-bold text-[#061445]">
                                                {t(
                                                    'welcome.home_bento_4_title',
                                                )}
                                            </h3>
                                            <p className="text-sm leading-relaxed text-[#45464f]">
                                                {t('welcome.home_bento_4_desc')}
                                            </p>
                                        </div>
                                        <div className="flex aspect-[2/1] w-full items-center justify-center rounded-xl border border-[#c6c5d0]/30 bg-white p-4 shadow-sm md:w-64">
                                            <span className="material-symbols-outlined text-[48px] text-green-600">
                                                videocam
                                            </span>
                                            <span className="ml-2 text-lg font-bold text-[#061445]">
                                                Google Meet
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* ── Home Footer ── */}
                            <footer className="rounded-t-[3rem] border-t border-[#c6c5d0]/30 bg-[#f5f3f7] py-16">
                                <div className="mx-auto max-w-7xl px-6 md:px-12">
                                    <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#061445]">
                                                <AppLogoIcon className="h-5 w-5 text-[#fae18e]" />
                                            </div>
                                            <span className="text-xl font-extrabold tracking-tight text-[#061445]">
                                                Convo
                                                <span className="text-[#d4a900]">
                                                    Mate
                                                </span>
                                            </span>
                                        </div>
                                        <p className="text-sm text-[#45464f]">
                                            © {new Date().getFullYear()}{' '}
                                            ConvoMate.{' '}
                                            {t('welcome.footer_rights')}
                                        </p>
                                        <div className="flex flex-wrap justify-center gap-6 text-sm text-[#45464f]">
                                            {[
                                                'About Us',
                                                'Privacy Policy',
                                                'Terms of Service',
                                                'Help Center',
                                            ].map((label) => (
                                                <a
                                                    key={label}
                                                    href="#"
                                                    className="transition-colors hover:text-[#061445]"
                                                >
                                                    {label}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </footer>
                        </>
                    )}

                    {activeTab === 'features' && (
                        <>
                            {/* ── Features Header Section ── */}
                            <section className="mx-auto max-w-4xl space-y-6 px-6 py-20 text-center">
                                <h1 className="text-4xl font-extrabold tracking-tight text-[#061445] md:text-5xl lg:text-6xl">
                                    {t('welcome.features_hero_title').replace(
                                        'Improve',
                                        '',
                                    )}
                                    <span className="butter-underline">
                                        Improve
                                    </span>
                                </h1>
                                <p className="text-lg leading-relaxed text-[#45464f]">
                                    {t('welcome.features_hero_subtitle')}
                                </p>
                            </section>

                            {/* ── 6-Card Bento Grid ── */}
                            <section className="mx-auto max-w-7xl px-6 py-12 md:px-12">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    {[
                                        {
                                            icon: 'videocam',
                                            title: t('welcome.feature_1_title'),
                                            desc: t('welcome.feature_1_desc'),
                                            color: 'bg-[#d0e4ff]',
                                        },
                                        {
                                            icon: 'calendar_today',
                                            title: t('welcome.feature_2_title'),
                                            desc: t('welcome.feature_2_desc'),
                                            color: 'bg-[#fae18e]/55',
                                        },
                                        {
                                            icon: 'school',
                                            title: t('welcome.feature_3_title'),
                                            desc: t('welcome.feature_3_desc'),
                                            color: 'bg-[#d0e4ff]',
                                        },
                                        {
                                            icon: 'psychology',
                                            title: t('welcome.feature_4_title'),
                                            desc: t('welcome.feature_4_desc'),
                                            color: 'bg-[#fae18e]/55',
                                        },
                                        {
                                            icon: 'trending_up',
                                            title: t('welcome.feature_5_title'),
                                            desc: t('welcome.feature_5_desc'),
                                            color: 'bg-[#d0e4ff]',
                                        },
                                        {
                                            icon: 'menu_book',
                                            title: t('welcome.feature_6_title'),
                                            desc: t('welcome.feature_6_desc'),
                                            color: 'bg-[#fae18e]/55',
                                        },
                                    ].map((feat, idx) => (
                                        <div
                                            key={idx}
                                            className="shadow-ambient hover:shadow-ambient-md group flex flex-col items-start rounded-2xl border border-[#c6c5d0]/30 bg-white p-10 transition-all"
                                        >
                                            <div
                                                className={`h-14 w-14 rounded-xl ${feat.color} mb-8 flex items-center justify-center text-[#061445] transition-transform group-hover:scale-110`}
                                            >
                                                <span className="material-symbols-outlined text-3xl">
                                                    {feat.icon}
                                                </span>
                                            </div>
                                            <h3 className="mb-4 text-xl font-bold text-[#061445]">
                                                {feat.title}
                                            </h3>
                                            <p className="text-sm leading-relaxed text-[#45464f]">
                                                {feat.desc}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* ── Personalized Learning Section ── */}
                            <section className="mx-auto max-w-7xl px-6 py-24 md:px-12">
                                <div className="flex flex-col items-center gap-16 md:flex-row">
                                    <div className="flex-1 space-y-8">
                                        <div className="inline-block rounded-full bg-[#fae18e] px-6 py-2 text-xs font-bold tracking-wider text-[#061445] uppercase">
                                            {t(
                                                'welcome.features_pers_learning',
                                            )}
                                        </div>
                                        <h2 className="text-4xl font-extrabold text-[#061445] md:text-5xl">
                                            {t(
                                                'welcome.features_journey_title',
                                            )}
                                        </h2>
                                        <p className="text-lg leading-relaxed text-[#45464f]">
                                            {t('welcome.features_journey_desc')}
                                        </p>
                                        <div className="flex flex-col gap-4">
                                            {[
                                                t(
                                                    'welcome.features_journey_item_1',
                                                ),
                                                t(
                                                    'welcome.features_journey_item_2',
                                                ),
                                                t(
                                                    'welcome.features_journey_item_3',
                                                ),
                                            ].map((item, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center gap-4 rounded-xl border border-[#c6c5d0]/20 bg-[#f5f3f7] p-4"
                                                >
                                                    <span className="material-symbols-outlined text-[#061445]">
                                                        check_circle
                                                    </span>
                                                    <span className="text-sm font-semibold text-[#061445]">
                                                        {item}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="relative aspect-square w-full flex-1">
                                        <div className="absolute inset-0 scale-105 -rotate-3 rounded-2xl bg-[#d0e4ff] opacity-20"></div>
                                        <div className="shadow-ambient-md relative h-full w-full overflow-hidden rounded-2xl border border-[#c6c5d0]/30 bg-white">
                                            <img
                                                className="h-full w-full object-cover"
                                                alt="Workspace"
                                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPQTu3UjiXn2Xwbw-HsmNTFmvyT8bXfqLhP2hkdgSNOCJuUDG2NvOZi_9o7URHG-HAzY1SADXHCAOjI2LV4rPfbmD9k9GdvqqRbaUXkcHmcpowgm0tqFb-WYruGiXj7tmTZdtIoMZEpY6R1W-ibp18KLULZV92Nz7HJpl-mWcaGIr5tgrewH8UM9g24iBZSPZ5nYWNrXhTHL1xqWEM4u9B4ozauPdjvk9DAeadmuIq5tMVlJatBDetQw"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* ── Features CTA & Footer ── */}
                            <section className="bg-[#061445] py-24 text-center text-white">
                                <div className="mx-auto max-w-3xl space-y-8 px-6">
                                    <h2 className="text-4xl font-extrabold md:text-5xl">
                                        {t('welcome.features_cta_ready')}
                                    </h2>
                                    <p className="mx-auto max-w-xl text-lg text-white/80">
                                        {t('welcome.features_cta_sub')}
                                    </p>
                                    <Link
                                        href={register()}
                                        className="inline-block rounded-full bg-[#fae18e] px-12 py-5 font-bold text-[#061445] shadow-xl transition-all hover:scale-105 active:scale-95"
                                    >
                                        {t('welcome.features_cta_btn')}
                                    </Link>
                                </div>
                            </section>

                            <footer className="bg-[#f5f3f7] py-12">
                                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 md:flex-row md:px-12">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="material-symbols-outlined text-2xl text-[#061445]"
                                            style={{
                                                fontVariationSettings:
                                                    "'FILL' 1",
                                            }}
                                        >
                                            forum
                                        </span>
                                        <span className="text-xl font-extrabold text-[#061445]">
                                            ConvoMate
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-[#45464f]">
                                        {[
                                            'About Us',
                                            'Privacy Policy',
                                            'Terms of Service',
                                            'Help Center',
                                            'Careers',
                                        ].map((link) => (
                                            <a
                                                key={link}
                                                className="transition-colors hover:text-[#061445]"
                                                href="#"
                                            >
                                                {link}
                                            </a>
                                        ))}
                                    </div>
                                    <div className="text-sm text-[#45464f] opacity-60">
                                        © {new Date().getFullYear()} ConvoMate.{' '}
                                        {t('welcome.footer_rights')}
                                    </div>
                                </div>
                            </footer>
                        </>
                    )}

                    {activeTab === 'how-it-works' && (
                        <>
                            {/* ── How It Works Header & Bands ── */}
                            <section className="relative overflow-hidden pt-12 pb-24">
                                <div className="absolute inset-0 z-0 flex flex-col">
                                    <div className="h-1/3 bg-white"></div>
                                    <div className="h-1/4 bg-[#fae18e]/35"></div>
                                    <div className="h-1/4 bg-[#d0e4ff]/35"></div>
                                    <div className="h-1/6 bg-white"></div>
                                </div>
                                <div className="relative z-10 mx-auto max-w-7xl px-6 pt-12 pb-20 text-center md:px-12">
                                    <span className="mb-6 inline-block rounded-full bg-[#fae18e] px-4 py-1.5 text-xs font-bold tracking-wider text-[#061445] uppercase">
                                        {t('welcome.how_badge')}
                                    </span>
                                    <h1 className="mb-6 text-4xl font-extrabold text-[#061445] md:text-5xl lg:text-6xl">
                                        {t('welcome.how_title_new') ||
                                            'Start Speaking in 3 Steps'}
                                    </h1>
                                    <p className="mx-auto max-w-2xl text-lg leading-relaxed font-medium text-[#061445] opacity-90">
                                        {t('welcome.how_subtitle')}
                                    </p>
                                </div>

                                {/* Steps Grid */}
                                <div className="relative z-20 mx-auto -mt-8 max-w-7xl px-6 md:px-12">
                                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                                        {[
                                            {
                                                step: 'STEP 01',
                                                icon: 'person_add',
                                                title: t(
                                                    'welcome.how_step_1_title_new',
                                                ),
                                                desc: t(
                                                    'welcome.how_step_1_desc_new',
                                                ),
                                                bandColor: 'bg-[#fae18e]/40',
                                            },
                                            {
                                                step: 'STEP 02',
                                                icon: 'search',
                                                title: t(
                                                    'welcome.how_step_2_title_new',
                                                ),
                                                desc: t(
                                                    'welcome.how_step_2_desc_new',
                                                ),
                                                bandColor: 'bg-[#d0e4ff]/40',
                                            },
                                            {
                                                step: 'STEP 03',
                                                icon: 'chat',
                                                title: t(
                                                    'welcome.how_step_3_title_new',
                                                ),
                                                desc: t(
                                                    'welcome.how_step_3_desc_new',
                                                ),
                                                bandColor: 'bg-[#fae18e]/40',
                                            },
                                        ].map((card, i) => (
                                            <div
                                                key={i}
                                                className="shadow-ambient flex flex-col items-center rounded-2xl border border-[#c6c5d0]/30 bg-white p-10 text-center transition-transform duration-300 hover:-translate-y-2"
                                            >
                                                <div
                                                    className={`mb-8 h-20 w-20 rounded-full ${card.bandColor} flex items-center justify-center border-2 border-[#061445]`}
                                                >
                                                    <span className="material-symbols-outlined text-3xl text-[#061445]">
                                                        {card.icon}
                                                    </span>
                                                </div>
                                                <div className="mb-3 text-xs font-bold tracking-wider text-[#44617e] uppercase">
                                                    {card.step}
                                                </div>
                                                <h3 className="mb-4 text-xl font-bold text-[#061445]">
                                                    {card.title}
                                                </h3>
                                                <p className="text-sm leading-relaxed text-[#45464f]">
                                                    {card.desc}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            {/* ── How It Works CTA & Footer ── */}
                            <section className="mx-auto max-w-7xl px-6 py-12 md:px-12">
                                <div className="flex flex-col items-center justify-between gap-12 rounded-3xl border border-[#c6c5d0]/20 bg-[#d0e4ff]/30 p-12 md:flex-row md:p-20">
                                    <div className="max-w-xl space-y-4">
                                        <h2 className="text-3xl font-extrabold text-[#061445] md:text-4xl">
                                            {t('welcome.how_cta_ready')}
                                        </h2>
                                        <p className="text-lg leading-relaxed font-medium text-[#061445]">
                                            {t('welcome.how_cta_sub')}
                                        </p>
                                    </div>
                                    <div className="flex w-full flex-col gap-4 sm:flex-row md:w-auto">
                                        <Link
                                            href={register()}
                                            className="flex items-center justify-center rounded-full bg-[#061445] px-10 py-5 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                                        >
                                            {t('welcome.features_cta_btn')}
                                        </Link>
                                        <a
                                            href="#teachers"
                                            onClick={(e) =>
                                                handleTabClick('teachers', e)
                                            }
                                            className="flex items-center justify-center rounded-full border-2 border-[#061445] bg-white px-10 py-5 text-sm font-bold text-[#061445] transition-all hover:scale-105 hover:bg-[#f5f3f7] active:scale-95"
                                        >
                                            {t('welcome.view_teachers')}
                                        </a>
                                    </div>
                                </div>
                            </section>

                            <footer className="mt-20 bg-[#f5f3f7] py-12">
                                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 md:flex-row md:px-12">
                                    <div className="text-xl font-extrabold text-[#061445]">
                                        ConvoMate
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-[#45464f]">
                                        {[
                                            'About Us',
                                            'Privacy Policy',
                                            'Terms of Service',
                                            'Help Center',
                                            'Careers',
                                        ].map((link) => (
                                            <a
                                                key={link}
                                                className="transition-colors hover:text-[#061445]"
                                                href="#"
                                            >
                                                {link}
                                            </a>
                                        ))}
                                    </div>
                                    <div className="text-sm text-[#45464f] opacity-60">
                                        © {new Date().getFullYear()} ConvoMate.
                                        All rights reserved.
                                    </div>
                                </div>
                            </footer>
                        </>
                    )}

                    {activeTab === 'teachers' && (
                        <>
                            {/* ── Teachers Directory Hero Section ── */}
                            <section className="mx-auto max-w-4xl space-y-6 px-6 py-16 text-center">
                                <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-[#061445] md:text-5xl lg:text-6xl">
                                    {t('welcome.teachers_hero_title').replace(
                                        'best teachers',
                                        '',
                                    )}
                                    <span className="rounded-xl bg-[#fae18e] px-4 py-1 text-[#061445]">
                                        {t(
                                            'welcome.teachers_title_highlight',
                                        ) || 'best teachers'}
                                    </span>
                                </h1>
                                <p className="mx-auto max-w-2xl text-lg text-[#45464f]">
                                    {t('welcome.teachers_hero_subtitle')}
                                </p>
                            </section>

                            {/* ── Filters Section ── */}
                            <section className="mx-auto mb-12 max-w-7xl px-6 md:px-12">
                                <div className="flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
                                    <div className="custom-scrollbar flex gap-2 overflow-x-auto pb-2">
                                        {[
                                            {
                                                id: 'all',
                                                label: t(
                                                    'welcome.teachers_all_specialties',
                                                ),
                                            },
                                            {
                                                id: 'ielts',
                                                label: t(
                                                    'welcome.teachers_ielts_prep',
                                                ),
                                            },
                                            {
                                                id: 'business',
                                                label: t(
                                                    'welcome.teachers_business_english',
                                                ),
                                            },
                                            {
                                                id: 'kids',
                                                label: t(
                                                    'welcome.teachers_kids_teens',
                                                ),
                                            },
                                        ].map((spec) => (
                                            <button
                                                key={spec.id}
                                                onClick={() =>
                                                    setSelectedSpecialty(
                                                        spec.id as any,
                                                    )
                                                }
                                                className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${
                                                    selectedSpecialty ===
                                                    spec.id
                                                        ? 'bg-[#fae18e] text-[#061445] shadow-sm'
                                                        : 'bg-[#d0e4ff]/35 text-[#061445] hover:bg-[#d0e4ff]/55'
                                                }`}
                                            >
                                                {spec.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="relative flex-grow md:max-w-xs">
                                        <span className="material-symbols-outlined absolute top-1/2 left-4 -translate-y-1/2 text-[20px] text-[#45464f]/70">
                                            search
                                        </span>
                                        <input
                                            value={searchQuery}
                                            onChange={(e) =>
                                                setSearchQuery(e.target.value)
                                            }
                                            className="w-full rounded-xl border-0 bg-[#f5f3f7] py-3 pr-4 pl-12 text-sm text-[#061445] placeholder-[#45464f]/60 outline-none focus:ring-2 focus:ring-[#061445]"
                                            placeholder={t(
                                                'welcome.teachers_search_placeholder',
                                            )}
                                            type="text"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* ── Teacher Grid Marketplace ── */}
                            <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 md:grid-cols-2 md:px-12 lg:grid-cols-3">
                                {filteredTeachers.map((teacher, i) => (
                                    <div
                                        key={i}
                                        className="group shadow-ambient hover:shadow-ambient-md relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#d0e4ff]/30 bg-white p-6 transition-all duration-300"
                                    >
                                        <div>
                                            <div className="mb-6 flex items-start justify-between">
                                                <div className="relative">
                                                    <img
                                                        className="h-20 w-20 rounded-xl object-cover"
                                                        alt={teacher.name}
                                                        src={teacher.img}
                                                    />
                                                    {i === 0 && (
                                                        <div className="absolute -right-2 -bottom-2 rounded-md bg-[#fae18e] px-2 py-0.5 text-[9px] font-black tracking-wider text-[#061445] uppercase">
                                                            Top Pro
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-1 text-right">
                                                    <h3 className="text-lg font-bold text-[#061445]">
                                                        {teacher.name}
                                                    </h3>
                                                    <p className="text-xs font-semibold text-[#45464f]">
                                                        {teacher.level}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mb-6 space-y-4">
                                                <p className="line-clamp-2 text-sm leading-relaxed text-[#45464f]">
                                                    {teacher.desc}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {teacher.tags.map(
                                                        (tag, tIdx) => (
                                                            <span
                                                                key={tIdx}
                                                                className="rounded-full bg-[#d0e4ff]/40 px-3 py-1 text-[11px] font-bold text-[#061445]"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between border-t border-[#c6c5d0]/30 pt-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1">
                                                    <span
                                                        className="material-symbols-outlined text-[18px] text-[#fae18e]"
                                                        style={{
                                                            fontVariationSettings:
                                                                "'FILL' 1",
                                                        }}
                                                    >
                                                        star
                                                    </span>
                                                    <span className="text-sm font-bold text-[#061445]">
                                                        {teacher.rating}
                                                    </span>
                                                    <span className="text-xs font-medium text-[#45464f]">
                                                        ({teacher.reviews}{' '}
                                                        reviews)
                                                    </span>
                                                </div>
                                                <span className="text-xs font-semibold text-[#45464f]/70">
                                                    {teacher.experience}
                                                </span>
                                            </div>
                                            <Link
                                                href={register()}
                                                className="rounded-full bg-[#061445] px-5 py-2.5 text-xs font-bold text-white transition-all hover:shadow-md active:scale-95"
                                            >
                                                Book Now
                                            </Link>
                                        </div>
                                    </div>
                                ))}

                                {/* Card 4 (Bento Variation) */}
                                <div className="group flex flex-col items-center justify-center space-y-4 rounded-2xl border-2 border-dashed border-[#fae18e] bg-[#fae18e]/15 p-8 text-center transition-all duration-300 hover:bg-[#fae18e]/25">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-md">
                                        <span className="material-symbols-outlined text-[32px] text-[#061445]">
                                            school
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-[#061445]">
                                        {t('welcome.teachers_become_teacher')}
                                    </h3>
                                    <p className="text-sm leading-relaxed text-[#45464f]">
                                        {t('welcome.teachers_become_desc')}
                                    </p>
                                    <Link
                                        href={register()}
                                        className="rounded-full bg-[#fae18e] px-8 py-3 text-xs font-bold text-[#061445] shadow-md transition-transform hover:scale-105 active:scale-95"
                                    >
                                        {t('welcome.teachers_apply_now')}
                                    </Link>
                                </div>
                            </section>

                            {/* ── Teachers CTA & Footer ── */}
                            <section className="mx-auto mt-24 max-w-7xl px-6 md:px-12">
                                <div className="shadow-ambient-md relative overflow-hidden rounded-3xl border border-[#c6c5d0]/20 bg-[#061445] p-12 text-white">
                                    <div className="pointer-events-none absolute top-0 right-0 h-full w-1/3 opacity-10">
                                        <svg
                                            className="h-full w-full"
                                            viewBox="0 0 100 100"
                                        >
                                            <circle
                                                cx="80"
                                                cy="20"
                                                fill="white"
                                                r="40"
                                            ></circle>
                                            <circle
                                                cx="100"
                                                cy="80"
                                                fill="white"
                                                r="30"
                                            ></circle>
                                        </svg>
                                    </div>
                                    <div className="relative z-10 flex flex-col items-center justify-between gap-8 md:flex-row">
                                        <div className="mb-6 max-w-xl space-y-4 md:mb-0">
                                            <h2 className="text-3xl font-extrabold md:text-4xl">
                                                {t(
                                                    'welcome.teachers_cta_ready',
                                                )}
                                            </h2>
                                            <p className="text-lg leading-relaxed text-white/80">
                                                {t('welcome.teachers_cta_sub')}
                                            </p>
                                        </div>
                                        <Link
                                            href={register()}
                                            className="rounded-full bg-[#fae18e] px-10 py-5 text-sm font-extrabold text-[#061445] shadow-lg transition-all hover:scale-105 active:scale-95"
                                        >
                                            {t('welcome.teachers_cta_btn')}
                                        </Link>
                                    </div>
                                </div>
                            </section>

                            <footer className="mt-24 w-full rounded-t-[3rem] border-t border-[#c6c5d0]/30 bg-[#f5f3f7] py-12">
                                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 md:flex-row md:px-12">
                                    <div className="flex flex-col items-center gap-4 md:items-start">
                                        <div className="text-xl font-extrabold text-[#061445]">
                                            ConvoMate
                                        </div>
                                        <p className="max-w-xs text-center text-sm leading-relaxed text-[#45464f] md:text-left">
                                            Connecting learners with global
                                            mentors for world-class language
                                            education.
                                        </p>
                                    </div>
                                    <nav className="flex flex-wrap justify-center gap-6 text-sm font-semibold text-[#45464f] md:gap-8">
                                        {[
                                            'About Us',
                                            'Privacy Policy',
                                            'Terms of Service',
                                            'Help Center',
                                            'Careers',
                                        ].map((link) => (
                                            <a
                                                key={link}
                                                className="transition-colors hover:text-[#061445]"
                                                href="#"
                                            >
                                                {link}
                                            </a>
                                        ))}
                                    </nav>
                                    <div className="mt-4 text-sm text-[#45464f] md:mt-0">
                                        © {new Date().getFullYear()} ConvoMate.
                                        All rights reserved.
                                    </div>
                                </div>
                            </footer>
                        </>
                    )}
                </main>
            </div>
        </>
    );
}
