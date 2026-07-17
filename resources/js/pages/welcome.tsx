import { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';
import { useTranslation } from '@/hooks/use-translation';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    Mic,
    Sparkles,
    Star,
    Video,
    Calendar,
    BookOpen,
    MessageCircle,
    Users,
    Search,
    SlidersHorizontal,
    Globe,
    Zap,
    GraduationCap,
    Check,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

// Teacher profiles array with specialties, tags, realistic images, and localization keys
const teachers = [
    {
        name: 'Sarah Thompson',
        level: 'IELTS 9.0 • Speaking 9.0',
        exp: '5 years',
        rating: 4.9,
        reviews: 142,
        specialty: 'IELTS Preparation',
        tags: ['Native Speaker', 'Cambridge Cert.'],
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCP6KzU0g88x74eYlZupQlTr4r6Dv61ALDlXgFBOe6zjKF-_MavmbjsELNbj7YIhrgRDSrJHj5MEh-qsrNp6MRFdh0t6qOkYFzSu23BUDQmDWDnG5LRdEtztOlrtjR26oP_Rfb-Vb6DqGlL9V3hpDBVFZIK3oocHjS1nZNZffuFILAamHaOems0riUpZ9OYymFeyi18stuJFZdM1oJGz-nbYzFLqUUn7aVVglr-TLtIPetoS9h_7fRPAg',
        descKey: 'welcome.teachers_sarah_desc',
        tag1Key: 'welcome.teachers_sarah_tag_1',
        tag2Key: 'welcome.teachers_sarah_tag_2',
    },
    {
        name: 'James Wilson',
        level: 'CEFR C2 • IELTS 8.5',
        exp: '3 years',
        rating: 4.8,
        reviews: 98,
        specialty: 'Business English',
        tags: ['Business English', 'TOEFL Prep'],
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFi4QKp6n6_j28XeDoQ_U3N2hiOXEzWvPlnzomio0pdEJBN7hHjNLXSs1XYj7PA7SIx8sM-IcDj6x8xd7XOwNZpmATS6mgodbxAM89fTxX-Jbgu2EE8RZQjIl-KW5h11kmkwnv-Pyh0-9DiVTUV2uTOFPqxVIFXBuZMk1yFic_SdpIns1fXijpXPRN-Bska3rMHFq9u8ekOptujySX2QS1VCggcTN3LdPx2wQzlz2S19oy0ljFdg-IPw',
        descKey: 'welcome.teachers_james_desc',
        tag1Key: 'welcome.teachers_james_tag_1',
        tag2Key: 'welcome.teachers_james_tag_2',
    },
    {
        name: 'Emma Davis',
        level: 'IELTS 8.5 • Speaking 8.5',
        exp: '7 years',
        rating: 5.0,
        reviews: 231,
        specialty: 'Kids & Teens',
        tags: ['Kids & Teens', 'TESOL Cert.'],
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgOv4ov2fPY8-bxY_eaeRe-RpgfhIMMpSqo80QI2nChpo-zmZ6PlOGsWWX_uTXkHwpGIzh_AQ2D9hCA6O8AKKwq3JvktJDO_HtBcTIgVy-9lbg3ib1RrNtMhYK81PNCQNArAzNUJTp3NfALZzeUraagaktMi0W_uYx3per0sQ5ur99r4tMdXcUliSD6ByjgEb5eZ_Ay8SDvSEhZO1lKeQKCcnniADF3SNLmVO4ln3D2SFfu40tRcIEFw',
        descKey: 'welcome.teachers_emma_desc',
        tag1Key: 'welcome.teachers_emma_tag_1',
        tag2Key: 'welcome.teachers_emma_tag_2',
    }
];

// Inline localization helpers to ensure complete translation of marketplace controls
const specialtyLabels: Record<string, Record<string, string>> = {
    All: {
        en: 'All Specialties',
        uz: 'Barcha mutaxassisliklar',
        ru: 'Все специализации'
    },
    'IELTS Preparation': {
        en: 'IELTS Preparation',
        uz: 'IELTSga tayyorgarlik',
        ru: 'Подготовка к IELTS'
    },
    'Business English': {
        en: 'Business English',
        uz: 'Biznes ingliz tili',
        ru: 'Бизнес-английский'
    },
    'Kids & Teens': {
        en: 'Kids & Teens',
        uz: 'Bolalar va o‘smirlar',
        ru: 'Дети и подростки'
    }
};

const searchPlaceholder: Record<string, string> = {
    en: 'Search by name or specialty...',
    uz: 'Ism yoki mutaxassislik bo‘yicha qidirish...',
    ru: 'Поиск по имени или специализации...'
};

const becomeTeacherTitle: Record<string, string> = {
    en: 'Become a Teacher',
    uz: 'O‘qituvchi bo‘ling',
    ru: 'Стать преподавателем'
};

const becomeTeacherDesc: Record<string, string> = {
    en: 'Join our network of elite educators and earn on your schedule.',
    uz: 'Bizning elita o‘qituvchilar tarmog‘imizga qo‘shiling va o‘z jadvalingiz bo‘yicha daromad oling.',
    ru: 'Присоединяйтесь к нашей сети элитных преподавателей и зарабатывайте по своему расписанию.'
};

const becomeTeacherBtn: Record<string, string> = {
    en: 'Apply Now',
    uz: 'Hozir ro‘yxatdan o‘ting',
    ru: 'Подать заявку'
};

const bookNowBtn: Record<string, string> = {
    en: 'Book Now',
    uz: 'Bron qilish',
    ru: 'Забронировать'
};

export default function Welcome() {
    const { auth } = usePage<{ auth: { user: unknown } }>().props;
    const { t, locale, setLanguage } = useTranslation();

    // Marketplace search and category filter state
    const [selectedSpecialty, setSelectedSpecialty] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const currentLang = (locale as 'en' | 'uz' | 'ru') || 'en';

    // Dynamic filtering logic
    const filteredTeachers = teachers.filter((teacher) => {
        const matchesSpecialty = selectedSpecialty === 'All' || teacher.specialty === selectedSpecialty;
        const matchesSearch = teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            teacher.specialty.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSpecialty && matchesSearch;
    });

    return (
        <>
            <Head title={`ConvoMate - ${t('welcome.title')}`} />
            
            {/* Inject smooth scrolling layout rule */}
            <style dangerouslySetInnerHTML={{ __html: `html { scroll-behavior: smooth; }` }} />

            <div className="min-h-screen overflow-x-hidden bg-[#FAFAFA] font-sans text-[#061445] transition-colors duration-300 dark:bg-[#080811] dark:text-[#E8E8F0]">
                
                {/* ── Navbar ── */}
                <header className="fixed top-0 right-0 left-0 z-50 border-b border-white/5 bg-white/80 shadow-sm backdrop-blur-md dark:bg-[#080811]/80">
                    <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                        <Link href="/" className="group flex items-center gap-2.5">
                            <AppLogoIcon className="h-9 w-9 border-2 border-[#061445]/10 transition-transform group-hover:scale-105" />
                            <span className="text-lg font-black tracking-tight text-[#061445] dark:text-[#E8E8F0]">
                                Convo<span className="text-[#f5c518] dark:text-[#f5c518]">Mate</span>
                            </span>
                        </Link>

                        {/* Anchors with smooth scroll functionality */}
                        <div className="hidden items-center gap-8 text-sm font-semibold text-[#555] md:flex dark:text-[#A0A0B0]">
                            <a href="#features" className="transition-colors hover:text-[#061445] dark:hover:text-[#d0e4ff]">
                                {t('welcome.nav_features')}
                            </a>
                            <a href="#how-it-works" className="transition-colors hover:text-[#061445] dark:hover:text-[#d0e4ff]">
                                {t('welcome.nav_how_it_works')}
                            </a>
                            <a href="#teachers" className="transition-colors hover:text-[#061445] dark:hover:text-[#d0e4ff]">
                                {t('welcome.nav_teachers')}
                            </a>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Localized navigation locale toggle */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl px-3 font-semibold text-[#061445] hover:bg-[#061445]/5 hover:text-[#061445] dark:text-[#A0A0B0] dark:hover:bg-[#d0e4ff]/10 dark:hover:text-[#d0e4ff]"
                                    >
                                        <Globe className="h-4 w-4 text-[#061445] dark:text-[#d0e4ff]" />
                                        <span className="text-xs font-bold uppercase">{locale}</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="rounded-2xl border border-white/10 p-1.5 shadow-xl dark:bg-[#0F0F1E]"
                                >
                                    <DropdownMenuItem
                                        onClick={() => setLanguage('en')}
                                        className="flex cursor-pointer items-center justify-between rounded-xl px-3.5 py-2 hover:bg-[#d0e4ff]/20 focus:bg-[#d0e4ff]/20"
                                    >
                                        <span className="text-sm font-medium">English</span>
                                        {locale === 'en' && <Check className="h-4 w-4 text-[#061445] dark:text-[#d0e4ff]" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setLanguage('uz')}
                                        className="flex cursor-pointer items-center justify-between rounded-xl px-3.5 py-2 hover:bg-[#d0e4ff]/20 focus:bg-[#d0e4ff]/20"
                                    >
                                        <span className="text-sm font-medium">O'zbek</span>
                                        {locale === 'uz' && <Check className="h-4 w-4 text-[#061445] dark:text-[#d0e4ff]" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setLanguage('ru')}
                                        className="flex cursor-pointer items-center justify-between rounded-xl px-3.5 py-2 hover:bg-[#d0e4ff]/20 focus:bg-[#d0e4ff]/20"
                                    >
                                        <span className="text-sm font-medium">Русский</span>
                                        {locale === 'ru' && <Check className="h-4 w-4 text-[#061445] dark:text-[#d0e4ff]" />}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="rounded-xl bg-[#061445] px-5 py-2 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg dark:bg-[#d0e4ff] dark:text-[#061445]"
                                >
                                    {t('nav.dashboard')}
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="rounded-xl px-4 py-2 text-sm font-semibold text-[#555] transition-colors hover:text-[#061445] dark:text-[#A0A0B0] dark:hover:text-[#d0e4ff]"
                                    >
                                        {t('auth.login')}
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="rounded-xl bg-[#fae18e] px-5 py-2 text-sm font-bold text-[#061445] shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg hover:bg-[#fae18e]/95"
                                    >
                                        {t('welcome.get_started')}
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>
                </header>

                <main className="pt-16">
                    {/* ── Hero Section (Pale Blue Background Band) ── */}
                    <section className="relative px-6 py-16 md:py-24 max-w-7xl mx-auto">
                        {/* Background Band shaped panel */}
                        <div className="absolute inset-0 top-0 h-[92%] bg-[#d0e4ff]/30 -z-10 rounded-[3rem] mx-4 md:mx-0 dark:bg-[#d0e4ff]/5"></div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                            {/* Left Content Column */}
                            <div className="lg:col-span-6 space-y-8">
                                <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm dark:bg-[#080811] dark:border dark:border-white/10">
                                    <Sparkles className="text-[#061445] dark:text-[#d0e4ff] h-5 w-5" />
                                    <span className="text-sm font-bold tracking-tight text-[#061445] dark:text-[#d0e4ff]">
                                        {t('welcome.badge')}
                                    </span>
                                </div>
                                
                                <h1 className="font-sans text-5xl font-black tracking-tight text-[#061445] dark:text-white sm:text-6xl md:text-7xl leading-[1.1] mb-6">
                                    {t('welcome.title')}{' '}
                                    <span className="relative inline-block z-10 whitespace-nowrap">
                                        {t('welcome.title_fluently')}
                                        {/* Yellow Highlight Line */}
                                        <span className="absolute bottom-1 left-0 w-full h-3 bg-[#fae18e] -z-10 rounded-full dark:bg-[#fae18e]/70"></span>
                                    </span>
                                    {t('welcome.title_today') && t('welcome.title_today') !== 'welcome.title_today' && <> {t('welcome.title_today')}</>}
                                </h1>

                                <p className="font-sans text-lg text-[#45464f] dark:text-[#cbd5e1] max-w-lg">
                                    {t('welcome.subtitle')}
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                    <Link
                                        href={register()}
                                        className="bg-[#061445] text-white h-14 px-8 rounded-lg flex items-center justify-center gap-2 font-bold hover:bg-[#061445]/90 transition-all active:scale-95 shadow-md dark:bg-[#d0e4ff] dark:text-[#061445] dark:hover:bg-[#d0e4ff]/90"
                                    >
                                        {t('welcome.cta_start')}
                                        <Zap className="h-5 w-5 fill-current" />
                                    </Link>
                                    <a
                                        href="#teachers"
                                        className="bg-white border-2 border-[#061445]/10 text-[#061445] h-14 px-8 rounded-lg flex items-center justify-center gap-2 font-bold hover:bg-[#d0e4ff]/20 transition-all dark:bg-[#080811] dark:border-white/10 dark:text-[#E8E8F0] dark:hover:bg-white/5"
                                    >
                                        {t('welcome.cta_how_it_works')}
                                    </a>
                                </div>

                                <div className="flex flex-wrap gap-8 pt-6">
                                    <div className="flex items-center gap-2">
                                        <Users className="text-[#061445] dark:text-[#d0e4ff] h-5 w-5" />
                                        <span className="text-sm font-semibold text-[#45464f] dark:text-[#A0A0B0]">
                                            {t('welcome.trust_learners')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Star className="text-[#061445] fill-[#fae18e] h-5 w-5" />
                                        <span className="text-sm font-semibold text-[#45464f] dark:text-[#A0A0B0]">
                                            {t('welcome.trust_rating')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Video Call Visual Column */}
                            <div className="lg:col-span-6 relative">
                                <div className="relative bg-white p-4 rounded-3xl shadow-xl border border-[#d0e4ff]/50 overflow-hidden dark:bg-[#0c0c16] dark:border-white/10">
                                    {/* Mock Video Feed Container */}
                                    <div className="grid grid-cols-2 gap-3 aspect-video">
                                        
                                        {/* Teacher Feed */}
                                        <div className="relative rounded-2xl overflow-hidden bg-[#d0e4ff]/20 aspect-square">
                                            <img
                                                className="w-full h-full object-cover"
                                                alt="Sarah M."
                                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2XLftemZ5TAP_21DqZkHVpVLWepGEfQ00ARVxd9B7YKdWvmgxsoALkGQ2oUmOkMWv5c_rGxgDH_ws_pnU9BhzLnHjWpIqr5B9LdSMDEL872u9nO10wfUr_YIx7XFltYgXrHEaOKPy2UyrXzPv2sb4-RS58HvR0226wiUSSvm9dEg_T76Bc7Ta_QZCMb5ztLyLmBm8d7x5H9DkUxE4GIsoWuJq43xyawaALSSVmfoqxdYYMyZNZ7U5zw"
                                            />
                                            <div className="absolute bottom-3 left-3 bg-[#061445]/80 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs flex items-center gap-1">
                                                <Globe className="h-3.5 w-3.5 text-[#d0e4ff]" />
                                                Sarah M. (UK)
                                            </div>
                                        </div>

                                        {/* Student Feed */}
                                        <div className="relative rounded-2xl overflow-hidden bg-[#d0e4ff]/20 aspect-square">
                                            <img
                                                className="w-full h-full object-cover"
                                                alt="David L."
                                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhujsEFUDvRAaFMwwWE_B7_HZbSZhuomMvsCA2kNw38-q1C56nEdPKa1Y6HSOnExpxOG9spZFt93oBoqD69ywneJ0Aal-sge2gIUw3TCdrCIlWULKSVyanKWGHCWbWfCunIRWU5PV5fiRcRfWUIk7OPcJ-IDK9MbBhDKDSxDNx3VJEnYu0wzao_4PZSJZNEqoU0kI0FbMbZFgWzoeOKUmr2Fhzk9CqDw0YP69BGiAeRE6bU-KmVsbVXQ"
                                            />
                                            <div className="absolute bottom-3 left-3 bg-[#061445]/80 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs flex items-center gap-1">
                                                <Users className="h-3.5 w-3.5 text-[#fae18e]" />
                                                David L. (US)
                                            </div>
                                        </div>
                                    </div>

                                    {/* Live Badge UI Overlay */}
                                    <div className="absolute top-8 right-8 flex flex-col gap-3">
                                        <div className="bg-[#fae18e] text-[#061445] px-4 py-2 rounded-lg font-bold text-sm shadow-md animate-pulse">
                                            Live Practice
                                        </div>
                                    </div>

                                    {/* Feedback Floating Panel */}
                                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/90 border border-[#d0e4ff] p-4 rounded-xl flex items-center gap-4 shadow-lg min-w-[280px] dark:bg-[#080811]/90 dark:border-white/10">
                                        <div className="w-10 h-10 rounded-full bg-[#fae18e] flex items-center justify-center text-[#061445]">
                                            <Sparkles className="w-5 h-5 fill-current" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted-foreground">Real-time Feedback</div>
                                            <div className="text-sm font-bold text-[#061445] dark:text-[#E8E8F0]">CEFR Level: B2 Advanced</div>
                                        </div>
                                    </div>

                                    {/* Mock Call Control Buttons */}
                                    <div className="flex justify-center gap-4 mt-6">
                                        <div className="w-12 h-12 rounded-full bg-[#d0e4ff]/30 flex items-center justify-center text-[#061445] cursor-pointer hover:bg-[#fae18e] transition-all dark:text-[#d0e4ff] dark:hover:bg-[#fae18e] dark:hover:text-[#061445]">
                                            <Mic className="w-5 h-5" />
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-[#d0e4ff]/30 flex items-center justify-center text-[#061445] cursor-pointer hover:bg-[#fae18e] transition-all dark:text-[#d0e4ff] dark:hover:bg-[#fae18e] dark:hover:text-[#061445]">
                                            <Video className="w-5 h-5" />
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center text-white cursor-pointer hover:bg-rose-600 transition-all">
                                            <Zap className="w-5 h-5 rotate-180" />
                                        </div>
                                    </div>
                                </div>

                                {/* Decorative floaters */}
                                <div className="absolute -top-6 -left-6 bg-white p-4 rounded-xl shadow-lg border border-[#d0e4ff]/50 hidden md:block dark:bg-[#0c0c16] dark:border-white/10">
                                    <div className="flex gap-2 items-start max-w-[150px]">
                                        <div className="w-6 h-6 bg-[#fae18e] rounded-full flex-shrink-0 flex items-center justify-center text-[#061445]">
                                            <MessageCircle className="w-3.5 h-3.5" />
                                        </div>
                                        <p className="text-xs leading-tight font-semibold text-[#061445] dark:text-[#E8E8F0]">"Focus on word stress here."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── Features Bento Grid Section ── */}
                    <section id="features" className="px-6 py-24 max-w-7xl mx-auto">
                        <div className="text-center mb-16 space-y-4">
                            <h2 className="font-sans text-4xl font-black text-[#061445] dark:text-white">
                                {t('welcome.home_bento_title_1')}{' '}
                                <span className="relative inline-block z-10 whitespace-nowrap">
                                    {t('welcome.home_bento_title_highlight')}
                                    {/* Yellow Highlight Line */}
                                    <span className="absolute bottom-1 left-0 w-full h-2 bg-[#fae18e] -z-10 rounded-full dark:bg-[#fae18e]/70"></span>
                                </span>
                                {t('welcome.home_bento_title_2')}
                            </h2>
                            <p className="text-[#45464f] max-w-2xl mx-auto dark:text-[#A0A0B0]">
                                {t('welcome.home_bento_subtitle')}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* Card 1: AI-Powered Analysis (Desktop 2-Col Span) */}
                            <div className="md:col-span-2 bg-white p-8 rounded-3xl border border-[#d0e4ff]/30 shadow-md group hover:border-[#fae18e] transition-all duration-300 dark:bg-[#0c0c16] dark:border-white/5 dark:hover:border-[#fae18e]/50">
                                <div className="flex flex-col md:flex-row gap-8 items-center">
                                    <div className="space-y-4 flex-1">
                                        <div className="w-12 h-12 bg-[#d0e4ff]/50 rounded-xl flex items-center justify-center text-[#061445] dark:bg-[#d0e4ff]/10 dark:text-[#d0e4ff]">
                                            <MessageCircle className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-[#061445] dark:text-white">
                                            {t('welcome.home_bento_1_title')}
                                        </h3>
                                        <p className="text-sm text-[#45464f] leading-relaxed dark:text-[#A0A0B0]">
                                            {t('welcome.home_bento_1_desc')}
                                        </p>
                                    </div>
                                    <div className="flex-1 w-full bg-[#d0e4ff]/20 rounded-2xl p-6 relative overflow-hidden dark:bg-[#1a2d47]/20">
                                        <div className="space-y-3">
                                            <div className="h-2 w-3/4 bg-[#061445]/10 rounded dark:bg-white/10"></div>
                                            <div className="h-2 w-1/2 bg-[#fae18e] rounded"></div>
                                            <div className="h-2 w-2/3 bg-[#061445]/10 rounded dark:bg-white/10"></div>
                                        </div>
                                        <div className="absolute top-2 right-2 bg-white px-2.5 py-1 rounded-md text-[10px] font-bold text-[#061445] shadow-sm dark:bg-[#080811] dark:text-[#d0e4ff] dark:border dark:border-white/10">
                                            ACCURACY 94%
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Flexible Scheduling */}
                            <div className="bg-[#fae18e] p-8 rounded-3xl shadow-md text-[#061445] flex flex-col justify-between hover:scale-[1.01] transition-transform">
                                <div className="space-y-4">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#061445]">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold">
                                        {t('welcome.home_bento_2_title')}
                                    </h3>
                                    <p className="text-sm text-[#061445]/85 leading-relaxed">
                                        {t('welcome.home_bento_2_desc')}
                                    </p>
                                </div>
                                <div className="mt-8 flex -space-x-2">
                                    <div className="w-9 h-9 rounded-full border-2 border-[#fae18e] bg-indigo-500"></div>
                                    <div className="w-9 h-9 rounded-full border-2 border-[#fae18e] bg-purple-500"></div>
                                    <div className="w-9 h-9 rounded-full border-2 border-[#fae18e] bg-emerald-500"></div>
                                </div>
                            </div>

                            {/* Card 3: Topic Discovery */}
                            <div className="bg-white p-8 rounded-3xl border border-[#d0e4ff]/30 shadow-md hover:border-[#fae18e] transition-all duration-300 dark:bg-[#0c0c16] dark:border-white/5 dark:hover:border-[#fae18e]/50">
                                <div className="space-y-4">
                                    <div className="w-12 h-12 bg-[#d0e4ff]/50 rounded-xl flex items-center justify-center text-[#061445] dark:bg-[#d0e4ff]/10 dark:text-[#d0e4ff]">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-[#061445] dark:text-white">
                                        {t('welcome.home_bento_3_title')}
                                    </h3>
                                    <p className="text-sm text-[#45464f] leading-relaxed dark:text-[#A0A0B0]">
                                        {t('welcome.home_bento_3_desc')}
                                    </p>
                                </div>
                            </div>

                            {/* Card 4: Google Meet Integration (Desktop 2-Col Span) */}
                            <div className="md:col-span-2 bg-[#d0e4ff]/40 p-8 rounded-3xl flex items-center justify-between overflow-hidden relative border border-[#d0e4ff]/20 dark:bg-[#d0e4ff]/5 dark:border-white/5">
                                <div className="space-y-4 z-10">
                                    <h3 className="text-xl font-bold text-[#061445] dark:text-white">
                                        {t('welcome.home_bento_4_title')}
                                    </h3>
                                    <p className="text-sm text-[#45464f] max-w-sm leading-relaxed dark:text-[#A0A0B0]">
                                        {t('welcome.home_bento_4_desc')}
                                    </p>
                                </div>
                                <div className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-20 text-[#061445] dark:text-[#d0e4ff]">
                                    <Video className="w-48 h-48 stroke-1" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── How It Works Section ── */}
                    <section id="how-it-works" className="relative py-24 bg-gradient-to-b from-white via-[#d0e4ff]/10 to-white dark:from-[#080811] dark:via-[#1a2d47]/5 dark:to-[#080811]">
                        <div className="max-w-7xl mx-auto px-6 text-center">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-[#fae18e] text-[#061445] text-xs font-bold tracking-wider mb-6">
                                SIMPLE JOURNEY
                            </span>
                            <h2 className="font-sans text-4xl font-black text-[#061445] dark:text-white mb-6">
                                {t('welcome.how_title')}{' '}
                                <span className="relative inline-block z-10 whitespace-nowrap">
                                    {t('welcome.how_title_highlight')}
                                    {/* Yellow Highlight Line */}
                                    <span className="absolute bottom-1 left-0 w-full h-2 bg-[#fae18e] -z-10 rounded-full dark:bg-[#fae18e]/70"></span>
                                </span>
                            </h2>
                            <p className="text-lg text-[#45464f] max-w-2xl mx-auto opacity-90 dark:text-[#A0A0B0]">
                                {t('welcome.how_subtitle')}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
                                {/* Timeline Step 1 */}
                                <div className="bg-white p-10 rounded-3xl border border-[#d0e4ff]/30 shadow-md flex flex-col items-center text-center hover:-translate-y-1 transition-all duration-300 dark:bg-[#0c0c16] dark:border-white/5">
                                    <div className="w-16 h-16 mb-6 rounded-full bg-[#fae18e] flex items-center justify-center border-2 border-[#061445] dark:border-[#fae18e]">
                                        <Users className="text-[#061445] w-7 h-7" />
                                    </div>
                                    <div className="text-xs font-bold text-[#fae18e] tracking-widest mb-3 uppercase">STEP 01</div>
                                    <h3 className="text-lg font-bold text-[#061445] mb-3 dark:text-white">{t('welcome.how_step_1_title')}</h3>
                                    <p className="text-xs text-[#45464f] leading-relaxed dark:text-[#A0A0B0]">{t('welcome.how_step_1_desc')}</p>
                                </div>

                                {/* Timeline Step 2 */}
                                <div className="bg-white p-10 rounded-3xl border border-[#d0e4ff]/30 shadow-md flex flex-col items-center text-center hover:-translate-y-1 transition-all duration-300 dark:bg-[#0c0c16] dark:border-white/5">
                                    <div className="w-16 h-16 mb-6 rounded-full bg-[#d0e4ff] flex items-center justify-center border-2 border-[#061445] dark:border-[#d0e4ff]">
                                        <Search className="text-[#061445] w-7 h-7" />
                                    </div>
                                    <div className="text-xs font-bold text-[#fae18e] tracking-widest mb-3 uppercase">STEP 02</div>
                                    <h3 className="text-lg font-bold text-[#061445] mb-3 dark:text-white">{t('welcome.how_step_2_title')}</h3>
                                    <p className="text-xs text-[#45464f] leading-relaxed dark:text-[#A0A0B0]">{t('welcome.how_step_2_desc')}</p>
                                </div>

                                {/* Timeline Step 3 */}
                                <div className="bg-white p-10 rounded-3xl border border-[#d0e4ff]/30 shadow-md flex flex-col items-center text-center hover:-translate-y-1 transition-all duration-300 dark:bg-[#0c0c16] dark:border-white/5">
                                    <div className="w-16 h-16 mb-6 rounded-full bg-[#fae18e] flex items-center justify-center border-2 border-[#061445] dark:border-[#fae18e]">
                                        <MessageCircle className="text-[#061445] w-7 h-7" />
                                    </div>
                                    <div className="text-xs font-bold text-[#fae18e] tracking-widest mb-3 uppercase">STEP 03</div>
                                    <h3 className="text-lg font-bold text-[#061445] mb-3 dark:text-white">{t('welcome.how_step_3_title')}</h3>
                                    <p className="text-xs text-[#45464f] leading-relaxed dark:text-[#A0A0B0]">{t('welcome.how_step_3_desc')}</p>
                                </div>
                            </div>

                            {/* Intermediate CTA Banner (Pale Blue Container) */}
                            <div className="mt-20 bg-[#d0e4ff]/30 rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 text-left dark:bg-[#1a2d47]/20 border border-[#d0e4ff]/10">
                                <div className="max-w-xl">
                                    <h3 className="text-2xl font-black text-[#061445] dark:text-white mb-2">
                                        {t('welcome.journey_cta_ready')}
                                    </h3>
                                    <p className="text-sm text-[#45464f] dark:text-[#A0A0B0]">
                                        {t('welcome.journey_cta_desc')}
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                    <Link
                                        href={register()}
                                        className="bg-[#061445] text-white px-8 py-4 rounded-xl font-bold shadow-md hover:bg-[#061445]/90 transition-all text-center dark:bg-[#d0e4ff] dark:text-[#061445] dark:hover:bg-[#d0e4ff]/90"
                                    >
                                        {t('welcome.journey_cta_btn_start')}
                                    </Link>
                                    <a
                                        href="#teachers"
                                        className="bg-white border-2 border-[#061445]/15 text-[#061445] px-8 py-4 rounded-xl font-bold hover:bg-[#d0e4ff]/20 transition-all text-center dark:bg-[#080811] dark:border-white/10 dark:text-[#E8E8F0]"
                                    >
                                        {t('welcome.journey_cta_btn_teachers')}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── Teacher Directory Section with Live Filtering ── */}
                    <section id="teachers" className="px-6 py-24 max-w-7xl mx-auto">
                        <div className="text-center mb-16 space-y-4">
                            <h2 className="font-sans text-4xl font-black text-[#061445] dark:text-white">
                                {t('welcome.teachers_title')}{' '}
                                <span className="relative inline-block z-10 whitespace-nowrap">
                                    {t('welcome.teachers_title_highlight')}
                                    {/* Yellow Highlight Line */}
                                    <span className="absolute bottom-1 left-0 w-full h-2 bg-[#fae18e] -z-10 rounded-full dark:bg-[#fae18e]/70"></span>
                                </span>
                            </h2>
                            <p className="text-lg text-[#45464f] max-w-2xl mx-auto dark:text-[#A0A0B0]">
                                {t('welcome.teachers_subtitle')}
                            </p>
                        </div>

                        {/* Interactive Filter Bar */}
                        <div className="mb-10 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                            {/* specialty filter buttons */}
                            <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
                                {Object.keys(specialtyLabels).map((key) => (
                                    <button
                                        key={key}
                                        onClick={() => setSelectedSpecialty(key)}
                                        className={`px-6 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                                            selectedSpecialty === key
                                                ? 'bg-[#fae18e] text-[#061445] border-2 border-[#061445] dark:border-[#fae18e]'
                                                : 'bg-[#d0e4ff]/30 text-[#061445] hover:bg-[#d0e4ff]/50 dark:bg-white/5 dark:text-[#A0A0B0] dark:hover:bg-white/10'
                                        }`}
                                    >
                                        {specialtyLabels[key][currentLang]}
                                    </button>
                                ))}
                            </div>

                            {/* Search Box */}
                            <div className="flex items-center gap-3 w-full md:w-80">
                                <div className="relative w-full">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#061445]/40 dark:text-[#A0A0B0] w-4 h-4" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={searchPlaceholder[currentLang]}
                                        className="w-full bg-[#d0e4ff]/10 border border-[#d0e4ff]/30 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#061445] focus:outline-none dark:bg-white/5 dark:border-white/10 dark:text-white"
                                    />
                                </div>
                                <button className="flex items-center justify-center p-3 rounded-xl bg-[#d0e4ff]/30 text-[#061445] hover:bg-[#d0e4ff]/50 transition-colors dark:bg-white/5 dark:text-white">
                                    <SlidersHorizontal className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Marketplace Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            
                            {/* Dynamically Filtered Teacher Cards */}
                            {filteredTeachers.map((teacher) => (
                                <div
                                    key={teacher.name}
                                    className="group bg-white rounded-3xl p-6 border border-[#d0e4ff]/30 shadow-md hover:shadow-xl hover:border-[#fae18e] transition-all duration-300 flex flex-col justify-between dark:bg-[#0c0c16] dark:border-white/5 dark:hover:border-[#fae18e]/50"
                                >
                                    <div>
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="relative">
                                                <img
                                                    className="w-20 h-20 rounded-xl object-cover border border-[#d0e4ff]/50"
                                                    alt={teacher.name}
                                                    src={teacher.image}
                                                />
                                                <div className="absolute -bottom-2 -right-2 bg-[#fae18e] text-[#061445] px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm border border-[#061445]">
                                                    Top Pro
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <h3 className="font-bold text-lg text-[#061445] dark:text-white">
                                                    {teacher.name}
                                                </h3>
                                                <div className="text-xs font-semibold text-[#45464f] dark:text-[#A0A0B0]">
                                                    {teacher.level}
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-sm text-[#45464f] leading-relaxed mb-6 dark:text-[#A0A0B0] line-clamp-2">
                                            {t(teacher.descKey)}
                                        </p>

                                        <div className="flex gap-2 mb-6">
                                            <span className="bg-[#d0e4ff]/30 text-[#061445] text-xs px-3 py-1 rounded-full font-bold dark:bg-white/5 dark:text-[#d0e4ff]">
                                                {t(teacher.tag1Key)}
                                            </span>
                                            <span className="bg-[#d0e4ff]/30 text-[#061445] text-xs px-3 py-1 rounded-full font-bold dark:bg-white/5 dark:text-[#d0e4ff]">
                                                {t(teacher.tag2Key)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-[#d0e4ff]/25 dark:border-white/5">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 fill-[#fae18e] text-[#061445] dark:text-[#fae18e]" />
                                                <span className="font-bold text-[#061445] dark:text-white">
                                                    {teacher.rating}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    ({teacher.reviews})
                                                </span>
                                            </div>
                                            <span className="text-[11px] font-semibold text-muted-foreground mt-0.5">
                                                {teacher.exp} {t('welcome.teachers_experience')}
                                            </span>
                                        </div>

                                        <Link
                                            href={register()}
                                            className="bg-[#061445] text-white px-5 py-2.5 rounded-full font-bold text-xs hover:shadow-md transition-all active:scale-95 dark:bg-[#d0e4ff] dark:text-[#061445]"
                                        >
                                            {bookNowBtn[currentLang]}
                                        </Link>
                                    </div>
                                </div>
                            ))}

                            {/* "Become a Teacher" Bento Variant Card */}
                            <div className="group bg-[#fae18e]/10 rounded-3xl p-8 border-2 border-dashed border-[#fae18e] flex flex-col items-center justify-center text-center space-y-4 hover:bg-[#fae18e]/20 transition-all duration-300">
                                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md dark:bg-[#0c0c16]">
                                    <GraduationCap className="text-[#061445] w-7 h-7 dark:text-[#fae18e]" />
                                </div>
                                <h3 className="font-bold text-lg text-[#061445] dark:text-white">
                                    {becomeTeacherTitle[currentLang]}
                                </h3>
                                <p className="text-xs text-[#45464f] dark:text-[#A0A0B0] max-w-[220px] leading-relaxed">
                                    {becomeTeacherDesc[currentLang]}
                                </p>
                                <button className="bg-[#fae18e] text-[#061445] border border-[#061445] px-6 py-2.5 rounded-full font-bold text-xs shadow-md transition-transform active:scale-95 hover:bg-[#fae18e]/95">
                                    {becomeTeacherBtn[currentLang]}
                                </button>
                            </div>
                        </div>

                        {/* Final CTA Card (Navy Background / Yellow Button) */}
                        <div className="mt-24 bg-[#061445] text-white rounded-3xl p-12 relative overflow-hidden shadow-2xl dark:bg-[#0c1f60]">
                            {/* Decorative graphic SVG lines overlay */}
                            <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
                                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <circle cx="80" cy="20" fill="white" r="40"></circle>
                                    <circle cx="100" cy="80" fill="white" r="30"></circle>
                                </svg>
                            </div>
                            <div className="relative z-10 md:flex items-center justify-between">
                                <div className="max-w-xl mb-8 md:mb-0">
                                    <h2 className="text-3xl font-black mb-4">
                                        {t('welcome.features_cta_ready')}
                                    </h2>
                                    <p className="text-sm text-[#d0e4ff] leading-relaxed opacity-95">
                                        {t('welcome.features_cta_sub')}
                                    </p>
                                </div>
                                <Link
                                    href={register()}
                                    className="bg-[#fae18e] text-[#061445] px-8 py-4 rounded-xl font-bold shadow-lg hover:scale-105 transition-all text-center inline-block whitespace-nowrap"
                                >
                                    {t('welcome.features_cta_btn')}
                                </Link>
                            </div>
                        </div>
                    </section>
                </main>

                {/* ── Footer ── */}
                <footer className="border-t border-[#d0e4ff]/30 bg-white py-12 dark:bg-[#080811] dark:border-white/5">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                            <div className="flex items-center gap-2.5">
                                <AppLogoIcon className="h-8 w-8 border-2 border-[#061445]/10" />
                                <span className="text-sm font-black tracking-tight text-[#061445] dark:text-[#E8E8F0]">
                                    Convo<span className="text-[#f5c518] dark:text-[#f5c518]">Mate</span>
                                </span>
                            </div>
                            <p className="text-xs font-semibold text-muted-foreground">
                                © {new Date().getFullYear()} ConvoMate. {t('welcome.footer_rights')}
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
