import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Globe,
    Lock,
    Mail,
    Scale,
    Shield,
    Trash2,
    UserCheck,
} from 'lucide-react';
import React, { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/use-translation';

export default function PrivacyPolicy() {
    const { setLanguage, locale } = useTranslation();
    const [activeSection, setActiveSection] = useState('overview');

    const sections = [
        { id: 'overview', title: '1. Overview & Scope' },
        { id: 'data-collected', title: '2. Information We Collect' },
        { id: 'google-oauth', title: '3. Google User Data & Calendar Scope' },
        { id: 'limited-use', title: '4. Google Limited Use Disclosure' },
        { id: 'data-usage', title: '5. How We Use Information' },
        { id: 'data-sharing', title: '6. Information Sharing & Disclosure' },
        { id: 'data-retention', title: '7. Data Retention & Deletion Rights' },
        { id: 'security', title: '8. Data Security' },
        { id: 'contact', title: '9. Contact Us' },
    ];

    const currentLangLabel =
        locale === 'uz' ? "O'zbekcha" : locale === 'ru' ? 'Русский' : 'English';

    return (
        <>
            <Head>
                <title>Privacy Policy — ConvoMate</title>
                <meta
                    name="description"
                    content="ConvoMate Privacy Policy: Learn how we protect your personal data, handle Google OAuth, and comply with Google API Services User Data Policy."
                />
            </Head>

            <div className="min-h-screen bg-[#FDFBF7] text-[#232A45] antialiased selection:bg-[#F7DE8B] selection:text-[#1E2A5A]">
                {/* ── Top Navigation Bar ── */}
                <header className="sticky top-0 z-40 border-b border-[#EAE4D2] bg-white/90 backdrop-blur-md">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/"
                                className="group flex items-center gap-2 text-sm font-bold text-[#5C6480] transition-colors hover:text-[#1E2A5A]"
                            >
                                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                                <span>Back to Home</span>
                            </Link>
                            <div className="hidden h-5 w-px bg-[#EAE4D2] sm:block" />
                            <Link href="/" className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[#1E2A5A]/10 bg-white p-0.5 shadow-sm">
                                    <img
                                        src="/images/logo.png"
                                        alt="ConvoMate"
                                        className="h-full w-full object-contain"
                                    />
                                </div>
                                <span className="text-lg font-black tracking-tight text-[#1E2A5A]">
                                    Convo<span className="text-[#FF9F43]">Mate</span>
                                </span>
                            </Link>
                        </div>

                        <div className="flex items-center gap-3">
                            <DropdownMenu>
                                <DropdownMenuTrigger className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[#EAE4D2] bg-white px-3 py-1.5 text-xs font-bold text-[#5C6480] shadow-sm transition-colors hover:border-[#1E2A5A] hover:text-[#1E2A5A]">
                                    <Globe className="h-3.5 w-3.5 text-[#5C6480]" />
                                    <span>{currentLangLabel}</span>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl border-[#EAE4D2] bg-white p-1 shadow-lg">
                                    <DropdownMenuItem
                                        onClick={() => setLanguage('en')}
                                        className="cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold hover:bg-[#FDF7E4]"
                                    >
                                        English
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setLanguage('uz')}
                                        className="cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold hover:bg-[#FDF7E4]"
                                    >
                                        O'zbekcha
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setLanguage('ru')}
                                        className="cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold hover:bg-[#FDF7E4]"
                                    >
                                        Русский
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Link
                                href="/terms"
                                className="hidden rounded-full border border-[#EAE4D2] px-3.5 py-1.5 text-xs font-bold text-[#1E2A5A] transition hover:bg-[#F7DE8B]/30 sm:inline-block"
                            >
                                Terms of Service
                            </Link>
                        </div>
                    </div>
                </header>

                {/* ── Hero Banner ── */}
                <div className="border-b border-[#EAE4D2] bg-white py-12">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#1E2A5A]/10 bg-[#FDF7E4] px-3.5 py-1.5 text-xs font-bold text-[#1E2A5A]">
                            <Shield className="h-3.5 w-3.5 text-[#FF9F43]" />
                            <span>Privacy & Data Protection</span>
                        </div>
                        <h1 className="mt-4 text-3xl font-black tracking-tight text-[#1E2A5A] sm:text-4xl">
                            ConvoMate Privacy Policy
                        </h1>
                        <p className="mt-2 text-sm text-[#5C6480]">
                            Last updated: August 19, 2026 · Effective immediately
                        </p>
                    </div>
                </div>

                {/* ── Content Layout ── */}
                <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
                        {/* Table of Contents Sticky Sidebar */}
                        <aside className="hidden lg:col-span-4 lg:block">
                            <div className="sticky top-24 rounded-2xl border border-[#EAE4D2] bg-white p-5 shadow-sm">
                                <h2 className="text-xs font-black tracking-wider text-[#5C6480] uppercase">
                                    Table of Contents
                                </h2>
                                <nav className="mt-4 space-y-1">
                                    {sections.map((sec) => (
                                        <a
                                            key={sec.id}
                                            href={`#${sec.id}`}
                                            onClick={() => setActiveSection(sec.id)}
                                            className={`block rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                                                activeSection === sec.id
                                                    ? 'bg-[#1E2A5A] text-white shadow-sm'
                                                    : 'text-[#5C6480] hover:bg-[#FDF7E4] hover:text-[#1E2A5A]'
                                            }`}
                                        >
                                            {sec.title}
                                        </a>
                                    ))}
                                </nav>

                                <div className="mt-6 border-t border-[#EAE4D2] pt-4">
                                    <div className="flex items-center gap-2 text-xs font-bold text-[#1E2A5A]">
                                        <Lock className="h-3.5 w-3.5 text-[#2E7D32]" />
                                        <span>SSL 256-bit Encrypted</span>
                                    </div>
                                    <p className="mt-1 text-[11px] text-[#5C6480]">
                                        Your information is always transmitted securely.
                                    </p>
                                </div>
                            </div>
                        </aside>

                        {/* Legal Body */}
                        <div className="space-y-10 lg:col-span-8">
                            {/* Section 1: Overview */}
                            <section id="overview" className="rounded-3xl border border-[#EAE4D2] bg-white p-6 shadow-sm sm:p-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDF7E4] text-[#1E2A5A]">
                                        <Shield className="h-5 w-5 text-[#FF9F43]" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[#1E2A5A]">
                                        1. Overview & Scope
                                    </h2>
                                </div>
                                <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#5C6480]">
                                    <p>
                                        Welcome to <strong>ConvoMate</strong> ("we", "our", or "us"). ConvoMate is an online language learning and speaking platform designed to connect English learners with verified teachers and conversation partners for real-time video lessons, matchmaking, and fluency coaching.
                                    </p>
                                    <p>
                                        This Privacy Policy explains what personal data we collect, why we collect it, how it is used and protected, and what rights you have regarding your personal data when you use our website (convomate.uz), applications, and services.
                                    </p>
                                    <p>
                                        By creating an account, accessing, or using ConvoMate, you acknowledge that you have read and understood this Privacy Policy.
                                    </p>
                                </div>
                            </section>

                            {/* Section 2: Data Collected */}
                            <section id="data-collected" className="rounded-3xl border border-[#EAE4D2] bg-white p-6 shadow-sm sm:p-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDF7E4] text-[#1E2A5A]">
                                        <UserCheck className="h-5 w-5 text-[#FF9F43]" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[#1E2A5A]">
                                        2. Information We Collect
                                    </h2>
                                </div>
                                <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#5C6480]">
                                    <p>We collect information that you directly provide to us, including:</p>
                                    <ul className="list-inside list-disc space-y-1.5 pl-2 text-[#232A45]">
                                        <li><strong>Account Profile Data:</strong> Full name, email address, password hash (if registering via email/password), phone number, age, gender, and avatar picture.</li>
                                        <li><strong>Role & Learning Preferences:</strong> Account role (Pupil or Teacher), target English proficiency level (e.g. Beginner, Intermediate, IELTS, CEFR Band), and target goals.</li>
                                        <li><strong>Teacher Credentials:</strong> Hourly rate, teaching specializations, and uploaded language certificates (e.g., IELTS, CEFR, TOEFL test reports).</li>
                                        <li><strong>Communications:</strong> Messages submitted via ConvoMate support tickets, session feedback, and lesson notes.</li>
                                    </ul>
                                </div>
                            </section>

                            {/* Section 3: Google OAuth & Calendar Scope */}
                            <section id="google-oauth" className="rounded-3xl border-2 border-[#A9C6E8] bg-[#FDFBF7] p-6 shadow-sm sm:p-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#1E2A5A] shadow-xs">
                                        <Calendar className="h-5 w-5 text-[#4285F4]" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[#1E2A5A]">
                                        3. Google User Data & Calendar Scope
                                    </h2>
                                </div>
                                <div className="mt-4 space-y-4 text-sm leading-relaxed text-[#5C6480]">
                                    <p>
                                        ConvoMate allows users to sign in with Google OAuth and connect their Google Calendar to streamline lesson scheduling and video conferencing.
                                    </p>

                                    <div className="rounded-2xl border border-[#EAE4D2] bg-white p-4">
                                        <h3 className="font-bold text-[#1E2A5A]">
                                            Google Data We Access:
                                        </h3>
                                        <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-[#232A45]">
                                            <li><strong>Basic Profile & Email:</strong> Your Google user identifier, primary email address, full name, and avatar picture.</li>
                                            <li><strong>Google Calendar Events Scope (<code className="rounded bg-slate-100 px-1 py-0.5 text-xs text-blue-700">https://www.googleapis.com/auth/calendar.events</code>):</strong> Authorized permission to create, update, and manage calendar events for confirmed ConvoMate lessons.</li>
                                        </ul>
                                    </div>

                                    <div className="rounded-2xl border border-[#EAE4D2] bg-white p-4">
                                        <h3 className="font-bold text-[#1E2A5A]">
                                            Why We Use Google Calendar Access:
                                        </h3>
                                        <p className="mt-1 text-xs text-[#5C6480]">
                                            We request Google Calendar permissions for the explicit purpose of educational lesson scheduling:
                                        </p>
                                        <ul className="mt-2 list-inside list-disc space-y-1.5 text-xs text-[#232A45]">
                                            <li><strong>Automatic Booking Synchronization:</strong> When a pupil books a speaking session with a teacher, ConvoMate automatically creates a calendar event on both the student’s and teacher’s Google Calendars.</li>
                                            <li><strong>Google Meet Video Integration:</strong> ConvoMate automatically generates an official Google Meet conference link inside the calendar event so both participants can join their speaking lesson seamlessly.</li>
                                            <li><strong>Schedule Adjustments & Cancellations:</strong> If an appointment is rescheduled or cancelled, ConvoMate updates or removes the corresponding event in your Google Calendar in real time.</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            {/* Section 4: Google Limited Use Disclosure */}
                            <section id="limited-use" className="rounded-3xl border-2 border-[#1E2A5A] bg-[#1E2A5A] p-6 text-white shadow-md sm:p-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
                                        <Scale className="h-5 w-5 text-[#F7DE8B]" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">
                                        4. Google API Services User Data Policy (Limited Use Disclosure)
                                    </h2>
                                </div>
                                <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-200">
                                    <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-xs">
                                        <p className="font-medium text-white">
                                            ConvoMate's use and transfer to any other app of information received from Google APIs will adhere to the{' '}
                                            <a
                                                href="https://developers.google.com/terms/api-services-user-data-policy"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-bold text-[#F7DE8B] underline decoration-[#F7DE8B] underline-offset-4 hover:text-white"
                                            >
                                                Google API Services User Data Policy
                                            </a>
                                            , including the Limited Use requirements.
                                        </p>
                                    </div>

                                    <div className="space-y-2 text-xs text-slate-300">
                                        <div className="flex items-start gap-2">
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F7DE8B]" />
                                            <span><strong>No Advertising:</strong> We do NOT use, sell, or transfer your Google user data to third parties for advertising or retargeting.</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F7DE8B]" />
                                            <span><strong>No Data Brokering:</strong> We do NOT sell Google user data or transfer it to data brokers under any circumstance.</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F7DE8B]" />
                                            <span><strong>Strict Human Access Restrictions:</strong> No human is permitted to read your Google Calendar data unless you explicitly give consent for technical support troubleshooting, or where required for security investigation or compliance with law.</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section 5: How We Use Information */}
                            <section id="data-usage" className="rounded-3xl border border-[#EAE4D2] bg-white p-6 shadow-sm sm:p-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDF7E4] text-[#1E2A5A]">
                                        <CheckCircle2 className="h-5 w-5 text-[#FF9F43]" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[#1E2A5A]">
                                        5. How We Use Information
                                    </h2>
                                </div>
                                <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#5C6480]">
                                    <p>We use the information we collect to provide and maintain ConvoMate services, including:</p>
                                    <ul className="list-inside list-disc space-y-1.5 pl-2 text-[#232A45]">
                                        <li>Providing 1-on-1 speaking practice sessions and verified teacher bookings.</li>
                                        <li>Facilitating instant peer speaking matchmaking over WebRTC.</li>
                                        <li>Managing user authentication, sessions, and security settings (passkeys, 2FA).</li>
                                        <li>Sending essential transactional notifications (lesson bookings, reminders, and confirmations).</li>
                                        <li>Providing responsive customer support and resolving technical issues.</li>
                                    </ul>
                                </div>
                            </section>

                            {/* Section 6: Data Sharing */}
                            <section id="data-sharing" className="rounded-3xl border border-[#EAE4D2] bg-white p-6 shadow-sm sm:p-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDF7E4] text-[#1E2A5A]">
                                        <Shield className="h-5 w-5 text-[#FF9F43]" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[#1E2A5A]">
                                        6. Information Sharing & Disclosure
                                    </h2>
                                </div>
                                <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#5C6480]">
                                    <p>We only share your information in the following limited situations:</p>
                                    <ul className="list-inside list-disc space-y-1.5 pl-2 text-[#232A45]">
                                        <li><strong>Between Matched Participants:</strong> When you book a lesson, your name and chosen learning details are shared with your assigned teacher or student partner.</li>
                                        <li><strong>Service Providers:</strong> Cloud infrastructure, database, and real-time messaging providers (e.g., PostgreSQL, Redis, Laravel Reverb) acting strictly on our behalf under data protection agreements.</li>
                                        <li><strong>Legal Compliance:</strong> If required by valid legal process or governmental authority.</li>
                                    </ul>
                                </div>
                            </section>

                            {/* Section 7: Retention & Deletion Rights */}
                            <section id="data-retention" className="rounded-3xl border border-[#EAE4D2] bg-white p-6 shadow-sm sm:p-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDF7E4] text-[#1E2A5A]">
                                        <Trash2 className="h-5 w-5 text-[#D32F2F]" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[#1E2A5A]">
                                        7. Data Retention & Your Deletion Rights
                                    </h2>
                                </div>
                                <div className="mt-4 space-y-4 text-sm leading-relaxed text-[#5C6480]">
                                    <p>
                                        We retain personal information only for as long as your account remains active or as needed to provide you with ConvoMate services.
                                    </p>

                                    <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4">
                                        <h3 className="font-bold text-[#D32F2F]">
                                            How to Delete Your Data:
                                        </h3>
                                        <ul className="mt-2 list-inside list-disc space-y-2 text-xs text-[#232A45]">
                                            <li>
                                                <strong>In-App Account Deletion:</strong> You can permanently delete your account and all associated data at any time by visiting <strong>Settings &gt; Profile &gt; Delete Account</strong>. This permanently removes your profile, tokens, certificates, and appointment records.
                                            </li>
                                            <li>
                                                <strong>Revoking Google OAuth Access:</strong> You can revoke ConvoMate’s access to your Google account at any time via the{' '}
                                                <a
                                                    href="https://myaccount.google.com/permissions"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-bold text-[#1E2A5A] underline"
                                                >
                                                    Google Security Permissions Page
                                                </a>.
                                            </li>
                                            <li>
                                                <strong>Support Request:</strong> You may also email us directly at <a href="mailto:support@convomate.uz" className="font-bold text-[#1E2A5A]">support@convomate.uz</a> to request data erasure.
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            {/* Section 8: Security */}
                            <section id="security" className="rounded-3xl border border-[#EAE4D2] bg-white p-6 shadow-sm sm:p-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDF7E4] text-[#1E2A5A]">
                                        <Lock className="h-5 w-5 text-[#2E7D32]" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[#1E2A5A]">
                                        8. Data Security
                                    </h2>
                                </div>
                                <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#5C6480]">
                                    <p>
                                        We take comprehensive technical and organizational measures to safeguard your personal data. All traffic is encrypted using modern TLS (HTTPS). OAuth tokens and authentication secrets are securely hashed or encrypted in our database, with automated session expiration and monitoring.
                                    </p>
                                </div>
                            </section>

                            {/* Section 9: Contact */}
                            <section id="contact" className="rounded-3xl border border-[#EAE4D2] bg-white p-6 shadow-sm sm:p-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDF7E4] text-[#1E2A5A]">
                                        <Mail className="h-5 w-5 text-[#FF9F43]" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[#1E2A5A]">
                                        9. Contact Us
                                    </h2>
                                </div>
                                <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#5C6480]">
                                    <p>
                                        If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                                    </p>
                                    <div className="rounded-2xl border border-[#EAE4D2] bg-[#FDFBF7] p-4 text-xs font-medium text-[#1E2A5A]">
                                        <p><strong>Entity:</strong> ConvoMate</p>
                                        <p className="mt-1"><strong>Email:</strong> <a href="mailto:support@convomate.uz" className="text-blue-600 underline">support@convomate.uz</a></p>
                                        <p className="mt-1"><strong>Jurisdiction:</strong> Republic of Uzbekistan</p>
                                        <p className="mt-1"><strong>Website:</strong> <a href="https://convomate.uz" className="text-blue-600 underline">https://convomate.uz</a></p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </main>

                {/* ── Footer ── */}
                <footer className="mt-16 border-t border-[#EAE4D2] bg-white py-10">
                    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs font-semibold text-[#5C6480] sm:flex-row sm:px-6">
                        <p>© {new Date().getFullYear()} ConvoMate. All rights reserved.</p>
                        <div className="flex gap-6">
                            <Link href="/" className="hover:text-[#1E2A5A]">
                                Home
                            </Link>
                            <Link href="/privacy" className="text-[#1E2A5A] underline">
                                Privacy Policy
                            </Link>
                            <Link href="/terms" className="hover:text-[#1E2A5A]">
                                Terms of Service
                            </Link>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
