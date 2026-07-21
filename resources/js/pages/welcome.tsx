import { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';
import { Globe, Check, ShieldCheck, Video, Calendar, User, ArrowRight, Star, PhoneOff, Camera } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Realistic Teacher Profiles matching ConvoMate standards
const teachers = [
    {
        name: 'Kamola',
        title: 'IELTS Speaking Specialist',
        desc: 'Exam strategy and fluency coaching · 5 yrs experience',
        badge: 'IELTS teacher · ✔ Verified',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
        rating: '4.9',
        reviews: '128',
    },
    {
        name: 'Javohir',
        title: 'Conversational Fluency',
        desc: 'Accent reduction & everyday vocabulary · 4 yrs experience',
        badge: 'General English · ✔ Verified',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
        rating: '4.8',
        reviews: '94',
    },
    {
        name: 'Dilnoza',
        title: 'Business & Interview Prep',
        desc: 'Corporate English & interview simulations · 6 yrs experience',
        badge: 'Business English · ✔ Verified',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
        rating: '5.0',
        reviews: '210',
    },
];

export default function Welcome() {
    const { auth } = usePage<{ auth: { user: unknown } }>().props;
    const { t, locale, setLanguage } = useTranslation();

    return (
        <>
            <Head>
                <title>ConvoMate — Speak with humans, not bots</title>
                <meta
                    name="description"
                    content="Live 1-on-1 English speaking practice with IELTS-verified teachers. Real humans, real conversations — book your lesson on ConvoMate."
                />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Schibsted+Grotesk:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </Head>

            {/* Design Tokens & Custom CSS Styles */}
            <style dangerouslySetInnerHTML={{
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

                body {
                  font-family: 'Schibsted Grotesk', sans-serif;
                  color: var(--ink);
                  background: var(--white);
                  line-height: 1.6;
                }

                h1, h2, h3 {
                  font-family: 'Bricolage Grotesque', sans-serif;
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

                html { scroll-behavior: smooth; }
            `}} />

            <div className="min-h-screen bg-white text-[#232A45] antialiased">
                {/* ── Main Header ── */}
                <header className="sticky top-0 z-50 border-b border-[#EAE4D2] bg-white/95 backdrop-blur-md">
                    <div className="wrap flex h-[76px] items-center justify-between">
                        <Link href="/" className="font-['Bricolage_Grotesque'] text-[22px] font-extrabold text-[#1E2A5A]">
                            Convo<span className="text-[#D9B437]">Mate</span>
                        </Link>

                        <nav className="hidden items-center gap-[30px] text-[15px] font-semibold text-[#5C6480] md:flex">
                            <a href="#why" className="transition-colors hover:text-[#1E2A5A]">Why humans</a>
                            <a href="#how" className="transition-colors hover:text-[#1E2A5A]">How it works</a>
                            <a href="#teachers" className="transition-colors hover:text-[#1E2A5A]">Teachers</a>
                        </nav>

                        <div className="flex items-center gap-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="hidden cursor-pointer items-center gap-1 rounded-full border-2 border-[#EAE4D2] bg-white px-3 py-1.5 text-xs font-bold text-[#5C6480] sm:flex">
                                        <Globe className="h-3.5 w-3.5" />
                                        <span className="uppercase">{locale}</span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-2xl border border-[#EAE4D2] bg-white p-1.5 shadow-xl">
                                    <DropdownMenuItem onClick={() => setLanguage('en')} className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-1.5 text-xs font-bold">
                                        <span>English (EN)</span>
                                        {locale === 'en' && <Check className="h-3.5 w-3.5 text-[#1E2A5A]" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setLanguage('uz')} className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-1.5 text-xs font-bold">
                                        <span>O'zbek (UZ)</span>
                                        {locale === 'uz' && <Check className="h-3.5 w-3.5 text-[#1E2A5A]" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setLanguage('ru')} className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-1.5 text-xs font-bold">
                                        <span>Русский (RU)</span>
                                        {locale === 'ru' && <Check className="h-3.5 w-3.5 text-[#1E2A5A]" />}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {auth.user ? (
                                <Link
                                    href="/dashboard"
                                    className="btn-primary rounded-full px-5 py-2.5 text-[15px] font-bold transition-transform hover:-translate-y-0.5"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link href="/login" className="hidden text-[15px] font-bold text-[#1E2A5A] sm:block">
                                        Log in
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="btn-primary rounded-full px-5 py-2.5 text-[15px] font-bold transition-transform hover:-translate-y-0.5"
                                    >
                                        Book a lesson
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* ── Hero Section ── */}
                <section className="bg-[#FDF7E4] py-16 lg:py-24 overflow-hidden">
                    <div className="wrap grid items-center gap-12 lg:grid-cols-2">
                        <div>
                            <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#1E2A5A] shadow-sm">
                                ✦ Early access — lessons are free during beta
                            </span>
                            <h1 className="mb-5 text-4xl font-extrabold md:text-5xl lg:text-7xl">
                                Speak with <span className="hero-hum">humans</span>,<br />not <span className="hero-strike">bots</span>.
                            </h1>
                            <p className="mb-8 max-w-[470px] text-lg text-[#5C6480] md:text-xl">
                                An app can't hear your confidence shake. A real teacher can — and fixes it live. 1-on-1 speaking sessions with IELTS-verified teachers.
                            </p>
                            <div className="mb-6 flex flex-wrap gap-4">
                                <Link
                                    href={auth.user ? '/pupil/teachers' : '/register'}
                                    className="btn-primary rounded-full px-7 py-3.5 text-base font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg"
                                >
                                    Book a lesson
                                </Link>
                                <a
                                    href="#teachers"
                                    className="btn-outline rounded-full px-7 py-3.5 text-base font-bold transition-all hover:-translate-y-0.5 hover:bg-[#1E2A5A] hover:text-white"
                                >
                                    Meet the teachers
                                </a>
                            </div>
                            <p className="text-[15px] font-medium text-[#5C6480]">🛡 Every teacher's certificate is checked by ConvoMate.</p>
                        </div>

                        {/* Exact Hero Illustration Matchingconvomate_home_v3.html & Uploaded Image */}
                        <div className="naqsh relative p-2" data-purpose="hero-illustration">
                            {/* Live lesson badge */}
                            <span className="absolute top-[-14px] left-[10px] z-[30] flex items-center gap-2 rounded-full bg-[#1E2A5A] px-4 py-2 text-sm font-bold text-white shadow-md">
                                <span className="h-2 w-2 rounded-full bg-[#7BD98E] animate-pulse"></span> Live lesson
                            </span>

                            {/* Dialogue Callout 1 (Teacher - Top Right) */}
                            <div className="absolute top-[-6px] right-[-4px] z-[30] max-w-[230px] rotate-[2deg] rounded-2xl bg-white p-3 md:p-4 text-[14.5px] font-semibold text-[#1E2A5A] shadow-xl">
                                "Tell me about your weekend — past tense, full sentences."
                                <small className="mt-1 block text-xs font-medium text-[#5C6480]">Teacher</small>
                            </div>

                            {/* Dialogue Callout 2 (Student - Bottom Left) */}
                            <div className="absolute bottom-[-28px] left-[-10px] z-[30] max-w-[230px] -rotate-[2deg] rounded-2xl bg-white p-3 md:p-4 text-[14.5px] font-semibold text-[#1E2A5A] shadow-xl">
                                "I visited my grandmother and we cooked plov together."
                                <small className="mt-1 block text-xs font-medium text-[#5C6480]">Student · speaking 90% of the lesson</small>
                            </div>

                            {/* Teacher & Student Video Tiles */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Student tile (Left) */}
                                <div className="tile relative bg-gradient-to-br from-[#A9C6E8] to-[#C9DCF2]">
                                    <img
                                        alt="Student portrait"
                                        className="absolute bottom-12 left-1/2 aspect-square w-[76%] max-w-[170px] -translate-x-1/2 rounded-full object-cover shadow-lg"
                                        src="/hero_avatar_1.jpg"
                                    />
                                    <span className="relative z-[2] rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-[#1E2A5A]">Student</span>
                                </div>

                                {/* Teacher tile (Right) */}
                                <div className="tile relative translate-y-[26px] bg-gradient-to-br from-[#F7DE8B] to-[#FBEDBC]">
                                    <img
                                        alt="Teacher portrait"
                                        className="absolute bottom-12 left-1/2 aspect-square w-[76%] max-w-[170px] -translate-x-1/2 rounded-full object-cover shadow-lg"
                                        src="/hero_avatar_2.jpg"
                                    />
                                    <span className="relative z-[2] rounded-full bg-[#1E2A5A] px-3 py-1.5 text-xs font-bold text-white">Teacher</span>
                                </div>
                            </div>

                            {/* Call Control Buttons (Floating Bottom Center) */}
                            <div className="absolute bottom-[-16px] left-1/2 z-[30] flex -translate-x-1/2 items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#1E2A5A] shadow-lg">
                                    <Video className="h-5 w-5 fill-[#1E2A5A]" />
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E54D42] text-white shadow-lg">
                                    <PhoneOff className="h-5 w-5 fill-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Why Humans Section ── */}
                <section className="py-20 md:py-28" id="why">
                    <div className="wrap">
                        <div className="mb-14 text-center">
                            <h2 className="mb-4 text-3xl font-extrabold md:text-[46px]">AI can generate text. It can't feel awkwardness.</h2>
                            <p className="mx-auto max-w-[580px] text-lg text-[#5C6480]">Here is why real human practice beats every language app on your phone.</p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="rounded-[22px] border-[1.5px] border-[#FBEDBC] bg-[#FDF7E4] p-8 transition-colors hover:border-[#F7DE8B]">
                                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FBEDBC] text-2xl">⚡</div>
                                <h3 className="mb-3 text-xl font-bold">Real feedback, mid-sentence</h3>
                                <p className="text-[15.5px] text-[#5C6480]">Your pronunciation gets fixed the second it slips — not summarized in a report you'll never open again.</p>
                            </div>
                            <div className="rounded-[22px] border-[1.5px] border-[#E3EDF8] bg-[#E3EDF8] p-8 transition-colors hover:border-[#F7DE8B]">
                                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FBEDBC] text-2xl">🎓</div>
                                <h3 className="mb-3 text-xl font-bold">The exam is a human, too</h3>
                                <p className="text-[15.5px] text-[#5C6480]">IELTS Speaking is an interview with a person. The only realistic rehearsal is with a person who knows how it's scored.</p>
                            </div>
                            <div className="rounded-[22px] border-[1.5px] border-[#EAE4D2] bg-white p-8 transition-colors hover:border-[#F7DE8B]">
                                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FBEDBC] text-2xl">🤝</div>
                                <h3 className="mb-3 text-xl font-bold">Personalized Adaptability</h3>
                                <p className="text-[15.5px] text-[#5C6480]">A human tutor notices when you get hesitant or confused, adjusting the topic pace dynamically.</p>
                            </div>
                        </div>

                        <div className="mt-10 flex flex-col items-center gap-6 rounded-[22px] bg-[#F7DE8B] p-8 sm:flex-row">
                            <ShieldCheck className="h-10 w-10 shrink-0 text-[#1E2A5A]" />
                            <div>
                                <b className="font-['Bricolage_Grotesque'] block mb-1 text-lg text-[#1E2A5A]">Verified means verified</b>
                                <p className="text-[15px] text-[#1E2A5A]/80">Before any teacher appears here, we check their IELTS certificate ourselves. The badge is our word, not theirs.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Steps Section ── */}
                <section className="bg-[#FBFAF6] py-20 md:py-28" id="how">
                    <div className="wrap">
                        <div className="mb-14 text-center">
                            <h2 className="mb-4 text-3xl font-extrabold md:text-[46px]">Three steps to your first conversation</h2>
                            <p className="mx-auto max-w-[560px] text-lg text-[#5C6480]">From sign-up to speaking in under ten minutes.</p>
                        </div>

                        <div className="grid items-stretch gap-6 lg:grid-cols-3">
                            {/* Step 1 */}
                            <div className="flex h-full flex-col rounded-[22px] border border-[#EAE4D2] bg-white p-6">
                                <div className="mb-6 flex h-[248px] flex-col justify-center gap-3 overflow-hidden rounded-2xl border border-[#EAE4D2] bg-[#FBFAF6] p-5">
                                    <div className="rounded-xl border border-[#EAE4D2] bg-white px-3.5 py-2.5 text-[13px] text-[#5C6480]">
                                        <b className="text-[#1E2A5A]">Name</b> · Aziza
                                    </div>
                                    <div className="text-[11px] font-bold tracking-widest uppercase text-[#5C6480]">Your level</div>
                                    <div className="flex gap-2">
                                        <span className="rounded-lg border border-[#EAE4D2] bg-white px-2.5 py-1.5 text-xs font-semibold">A2</span>
                                        <span className="rounded-lg border border-[#F7DE8B] bg-[#F7DE8B] px-2.5 py-1.5 text-xs font-semibold text-[#1E2A5A]">B1</span>
                                        <span className="rounded-lg border border-[#EAE4D2] bg-white px-2.5 py-1.5 text-xs font-semibold">B2</span>
                                    </div>
                                    <div className="rounded-xl bg-[#1E2A5A] py-2.5 text-center text-[13px] font-bold text-white">Create account</div>
                                </div>
                                <div className="mb-3 flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7DE8B] font-['Bricolage_Grotesque'] text-lg font-extrabold text-[#1E2A5A]">1</div>
                                    <h3 className="text-xl font-bold">Create your account</h3>
                                </div>
                                <p className="text-[15.5px] text-[#5C6480]">Two minutes. Tell us your level and your goal — IELTS band, job interview, or just confidence.</p>
                            </div>

                            {/* Step 2 */}
                            <div className="flex h-full flex-col rounded-[22px] border border-[#EAE4D2] bg-white p-6">
                                <div className="mb-6 flex h-[248px] flex-col justify-center gap-3 overflow-hidden rounded-2xl border border-[#EAE4D2] bg-[#FBFAF6] p-5">
                                    <div className="flex items-center gap-3">
                                        <img alt="Kamola" className="h-11 w-11 shrink-0 rounded-full object-cover" src="/hero_avatar_3.jpg" />
                                        <div>
                                            <div className="text-[15px] font-bold leading-tight text-[#1E2A5A]">Kamola</div>
                                            <div className="text-[12px] text-[#5C6480]">IELTS teacher · ✔ Verified</div>
                                        </div>
                                    </div>
                                    <p className="text-[12.5px] leading-snug text-[#232A45]">IELTS Speaking specialist — exam strategy and fluency coaching · 5 yrs experience</p>
                                    <div className="flex gap-2">
                                        <span className="rounded-lg border border-[#EAE4D2] bg-white px-2.5 py-1.5 text-xs font-semibold">15:00</span>
                                        <span className="rounded-lg border border-[#F7DE8B] bg-[#F7DE8B] px-2.5 py-1.5 text-xs font-semibold text-[#1E2A5A]">17:30</span>
                                    </div>
                                    <div className="rounded-xl bg-[#1E2A5A] py-2.5 text-center text-[13px] font-bold text-white">Book · 17:30</div>
                                </div>
                                <div className="mb-3 flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7DE8B] font-['Bricolage_Grotesque'] text-lg font-extrabold text-[#1E2A5A]">2</div>
                                    <h3 className="text-xl font-bold">Choose a teacher and time</h3>
                                </div>
                                <p className="text-[15.5px] text-[#5C6480]">Real profiles, checked certificates, live availability. Book the slot that fits your day.</p>
                            </div>

                            {/* Step 3 */}
                            <div className="flex h-full flex-col rounded-[22px] border border-[#EAE4D2] bg-white p-6">
                                <div className="mb-6 flex h-[248px] flex-col justify-center gap-3 overflow-hidden rounded-2xl border border-[#EAE4D2] bg-[#FBFAF6] p-5">
                                    <div className="flex items-center justify-between gap-2 rounded-xl border border-[#EAE4D2] bg-white p-3">
                                        <div className="min-w-0">
                                            <b className="block text-[13px] leading-tight text-[#1E2A5A]">Lesson starts in 5 min</b>
                                            <small className="block text-[11px] leading-tight text-[#5C6480]">Freestyle conversation · Dilnoza · 1 h · 🕐 17:30</small>
                                        </div>
                                        <span className="shrink-0 rounded-full bg-[#F7DE8B] px-3.5 py-2 text-[12px] font-extrabold text-[#1E2A5A]">Join now</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <div className="h-[118px] overflow-hidden rounded-xl bg-gradient-to-br from-[#A9C6E8] to-[#C9DCF2]">
                                            <img alt="Student" className="h-full w-full object-cover" src="/hero_avatar_4.jpg" />
                                        </div>
                                        <div className="h-[118px] overflow-hidden rounded-xl bg-gradient-to-br from-[#F7DE8B] to-[#FBEDBC]">
                                            <img alt="Teacher" className="h-full w-full object-cover" src="/hero_avatar_5.jpg" />
                                        </div>
                                    </div>
                                </div>
                                <div className="mb-3 flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7DE8B] font-['Bricolage_Grotesque'] text-lg font-extrabold text-[#1E2A5A]">3</div>
                                    <h3 className="text-xl font-bold">Join the call and speak</h3>
                                </div>
                                <p className="text-[15.5px] text-[#5C6480]">One click to join. No software downloads. Speak for 30 or 60 minutes and leave with feedback.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Teachers Section ── */}
                <section className="py-20 md:py-28" id="teachers">
                    <div className="wrap">
                        <div className="mb-14 text-center">
                            <h2 className="mb-4 text-3xl font-extrabold md:text-[46px]">Certified teachers, ready to talk</h2>
                            <p className="mx-auto max-w-[560px] text-lg text-[#5C6480]">Every profile is verified before it goes live. Here are a few who have slots open this week.</p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            {teachers.map((teacher, index) => (
                                <div key={index} className="flex h-full flex-col rounded-[22px] border border-[#EAE4D2] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                                    <div className="mb-4 flex items-center gap-4">
                                        <img alt={teacher.name} className="h-16 w-16 shrink-0 rounded-full object-cover" src={teacher.avatar} />
                                        <div>
                                            <h3 className="text-xl font-bold text-[#1E2A5A]">{teacher.name}</h3>
                                            <span className="inline-block rounded-full bg-[#FDF7E4] px-2.5 py-1 text-xs font-semibold text-[#854F0B]">
                                                {teacher.badge}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="mb-4 text-sm font-medium text-[#5C6480] flex-1">{teacher.desc}</p>
                                    <div className="mb-4 flex items-center justify-between border-t border-[#EAE4D2] pt-3 text-xs font-semibold text-[#5C6480]">
                                        <span className="flex items-center gap-1 text-[#1E2A5A] font-bold">
                                            <Star className="h-3.5 w-3.5 fill-[#F7DE8B] text-[#F7DE8B]" /> {teacher.rating} ({teacher.reviews} reviews)
                                        </span>
                                        <span className="text-[#1D9E75] font-bold">Slots available</span>
                                    </div>
                                    <Link
                                        href={auth.user ? '/pupil/teachers' : '/register'}
                                        className="btn-primary rounded-xl py-2.5 text-center text-xs font-bold transition-transform hover:scale-[1.02]"
                                    >
                                        Book lesson with {teacher.name}
                                    </Link>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 text-center">
                            <Link
                                href={auth.user ? '/pupil/teachers' : '/register'}
                                className="btn-outline inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-bold transition-all hover:bg-[#1E2A5A] hover:text-white"
                            >
                                Browse all verified teachers <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ── Bottom CTA ── */}
                <section className="bg-[#1E2A5A] py-16 text-white md:py-20">
                    <div className="wrap text-center">
                        <h2 className="mb-4 text-3xl font-extrabold text-white md:text-5xl">Ready to speak with confidence?</h2>
                        <p className="mx-auto mb-8 max-w-[500px] text-lg text-[#A9C6E8]">Book your lesson in under 2 minutes. Free during early access beta.</p>
                        <Link
                            href={auth.user ? '/pupil/teachers' : '/register'}
                            className="btn-butter inline-block rounded-full px-9 py-4 text-lg font-extrabold transition-transform hover:scale-105"
                        >
                            Book a lesson now
                        </Link>
                    </div>
                </section>

                {/* ── Footer ── */}
                <footer className="border-t border-[#EAE4D2] bg-white py-10">
                    <div className="wrap flex flex-col items-center justify-between gap-4 text-xs font-semibold text-[#5C6480] sm:flex-row">
                        <p>© {new Date().getFullYear()} ConvoMate. All rights reserved. Real humans, real results.</p>
                        <div className="flex gap-6">
                            <a href="#why" className="hover:text-[#1E2A5A]">Why humans</a>
                            <a href="#how" className="hover:text-[#1E2A5A]">How it works</a>
                            <a href="#teachers" className="hover:text-[#1E2A5A]">Teachers</a>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
