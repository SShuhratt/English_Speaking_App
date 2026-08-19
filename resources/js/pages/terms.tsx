import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    BookOpen,
    CheckCircle2,
    Clock,
    FileText,
    Globe,
    Lock,
    Mail,
    Scale,
    Shield,
    Users,
} from 'lucide-react';
import React, { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/use-translation';

export default function TermsOfService() {
    const { setLanguage, locale } = useTranslation();
    const [activeSection, setActiveSection] = useState('acceptance');

    const sections = [
        { id: 'acceptance', title: '1. Acceptance of Terms' },
        { id: 'services', title: '2. Description of Services' },
        { id: 'accounts', title: '3. User Accounts & Eligibility' },
        { id: 'bookings', title: '4. Bookings & Cancellations' },
        { id: 'conduct', title: '5. Code of Conduct' },
        { id: 'third-party', title: '6. Third-Party Integrations' },
        { id: 'intellectual-property', title: '7. Intellectual Property' },
        { id: 'disclaimer', title: '8. Disclaimers & Liability' },
        { id: 'termination', title: '9. Termination' },
        { id: 'governing-law', title: '10. Governing Law' },
        { id: 'contact', title: '11. Contact Information' },
    ];

    const currentLangLabel =
        locale === 'uz' ? "O'zbekcha" : locale === 'ru' ? 'Русский' : 'English';

    return (
        <>
            <Head>
                <title>Terms of Service — ConvoMate</title>
                <meta
                    name="description"
                    content="ConvoMate Terms of Service: Understand your rights and responsibilities when using our English speaking and teacher booking platform."
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
                                href="/privacy"
                                className="hidden rounded-full border border-[#EAE4D2] px-3.5 py-1.5 text-xs font-bold text-[#1E2A5A] transition hover:bg-[#F7DE8B]/30 sm:inline-block"
                            >
                                Privacy Policy
                            </Link>
                        </div>
                    </div>
                </header>

                {/* ── Hero Banner ── */}
                <div className="border-b border-[#EAE4D2] bg-white py-12">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#1E2A5A]/10 bg-[#FDF7E4] px-3.5 py-1.5 text-xs font-bold text-[#1E2A5A]">
                            <Scale className="h-3.5 w-3.5 text-[#FF9F43]" />
                            <span>Legal Terms & Conditions</span>
                        </div>
                        <h1 className="mt-4 text-3xl font-black tracking-tight text-[#1E2A5A] sm:text-4xl">
                            ConvoMate Terms of Service
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
                                        <Shield className="h-3.5 w-3.5 text-[#2E7D32]" />
                                        <span>Verified Safe Learning</span>
                                    </div>
                                    <p className="mt-1 text-[11px] text-[#5C6480]">
                                        Fair policies designed to protect teachers and pupils.
                                    </p>
                                </div>
                            </div>
                        </aside>

                        {/* Legal Body */}
                        <div className="space-y-10 lg:col-span-8">
                            {/* Section 1: Acceptance */}
                            <section id="acceptance" className="rounded-3xl border border-[#EAE4D2] bg-white p-6 shadow-sm sm:p-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDF7E4] text-[#1E2A5A]">
                                        <Scale className="h-5 w-5 text-[#FF9F43]" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[#1E2A5A]">
                                        1. Acceptance of Terms
                                    </h2>
                                </div>
                                <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#5C6480]">
                                    <p>
                                        These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "you") and <strong>ConvoMate</strong> ("we", "our", or "us"), governing your access to and use of the ConvoMate platform (convomate.uz) and related services.
                                    </p>
                                    <p>
                                        By registering an account, accessing, or using ConvoMate, you agree to be bound by these Terms and our{' '}
                                        <Link href="/privacy" className="font-bold text-[#1E2A5A] underline">
                                            Privacy Policy
                                        </Link>. If you do not agree to these Terms, you must not use our platform.
                                    </p>
                                </div>
                            </section>

                            {/* Section 2: Services */}
                            <section id="services" className="rounded-3xl border border-[#EAE4D2] bg-white p-6 shadow-sm sm:p-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDF7E4] text-[#1E2A5A]">
                                        <BookOpen className="h-5 w-5 text-[#FF9F43]" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[#1E2A5A]">
                                        2. Description of Services
                                    </h2>
                                </div>
                                <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#5C6480]">
                                    <p>
                                        ConvoMate provides an online educational platform enabling English language learners ("Pupils") to:
                                    </p>
                                    <ul className="list-inside list-disc space-y-1.5 pl-2 text-[#232A45]">
                                        <li>Discover, book, and participate in 1-on-1 speaking lessons with verified English teachers and coaches.</li>
                                        <li>Engage in real-time speaking matchmaking sessions with language practice partners.</li>
                                        <li>Synchronize confirmed lesson schedules and video links with their personal Google Calendar.</li>
                                        <li>Track learning progress, receive lesson feedback, and prepare for exams (such as IELTS and CEFR).</li>
                                    </ul>
                                </div>
                            </section>

                            {/* Section 3: Accounts */}
                            <section id="accounts" className="rounded-3xl border border-[#EAE4D2] bg-white p-6 shadow-sm sm:p-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDF7E4] text-[#1E2A5A]">
                                        <Users className="h-5 w-5 text-[#FF9F43]" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[#1E2A5A]">
                                        3. User Accounts & Eligibility
                                    </h2>
                                </div>
                                <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#5C6480]">
                                    <p>
                                        <strong>Eligibility:</strong> You must be at least 13 years of age to register an account. If you are under 18, you represent that your parent or legal guardian has reviewed and agreed to these Terms on your behalf.
                                    </p>
                                    <p>
                                        <strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your login credentials, passkeys, and authentication details. You must notify us immediately of any unauthorized access to your account.
                                    </p>
                                    <p>
                                        <strong>Teacher Verification:</strong> Users registering as Teachers agree to provide authentic information regarding their credentials, qualifications, test band scores, and certificates. Submitting forged or misleading documents is strictly grounds for immediate account termination.
                                    </p>
                                </div>
                            </section>

                            {/* Section 4: Bookings & Cancellations */}
                            <section id="bookings" className="rounded-3xl border border-[#EAE4D2] bg-white p-6 shadow-sm sm:p-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDF7E4] text-[#1E2A5A]">
                                        <Clock className="h-5 w-5 text-[#FF9F43]" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[#1E2A5A]">
                                        4. Bookings, Attendance & Cancellations
                                    </h2>
                                </div>
                                <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#5C6480]">
                                    <p>
                                        <strong>Lesson Appointments:</strong> When a pupil requests a lesson slot with a teacher, the appointment is confirmed upon teacher approval or platform booking confirmation.
                                    </p>
                                    <p>
                                        <strong>Punctuality & Attendance:</strong> Both pupils and teachers must join scheduled sessions on time via the provided Google Meet or platform video link.
                                    </p>
                                    <p>
                                        <strong>Cancellations & Rescheduling:</strong> Users may cancel or reschedule appointments within the designated cancellation window before the lesson starts. Frequent late cancellations or no-shows may result in booking restrictions.
                                    </p>
                                </div>
                            </section>

                            {/* Section 5: Code of Conduct */}
                            <section id="conduct" className="rounded-3xl border border-[#EAE4D2] bg-white p-6 shadow-sm sm:p-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDF7E4] text-[#1E2A5A]">
                                        <AlertCircle className="h-5 w-5 text-[#D32F2F]" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[#1E2A5A]">
                                        5. Code of Conduct & Prohibited Uses
                                    </h2>
                                </div>
                                <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#5C6480]">
                                    <p>To ensure a safe and respectful learning environment, you agree <strong>NOT</strong> to:</p>
                                    <ul className="list-inside list-disc space-y-1.5 pl-2 text-[#232A45]">
                                        <li>Engage in harassment, hate speech, bullying, defamation, or discriminatory behavior toward any student or teacher.</li>
                                        <li>Record, photograph, or capture video/audio of other users during speaking sessions without explicit mutual written consent.</li>
                                        <li>Transmit sexually explicit, violent, obscene, or unlawful material.</li>
                                        <li>Attempt to exploit, scrape, reverse engineer, or disrupt the platform’s security or infrastructure.</li>
                                        <li>Misrepresent your identity, certifications, IELTS/CEFR scores, or background.</li>
                                    </ul>
                                </div>
                            </section>

                            {/* Section 6: Third-Party Integrations */}
                            <section id="third-party" className="rounded-3xl border border-[#EAE4D2] bg-white p-6 shadow-sm sm:p-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDF7E4] text-[#1E2A5A]">
                                        <CheckCircle2 className="h-5 w-5 text-[#4285F4]" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[#1E2A5A]">
                                        6. Third-Party Services (Google Calendar & Meet)
                                    </h2>
                                </div>
                                <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#5C6480]">
                                    <p>
                                        ConvoMate integrates with Google APIs (Google Sign-In, Google Calendar, and Google Meet) to enhance your scheduling experience.
                                    </p>
                                    <p>
                                        By connecting your Google account, you agree to comply with Google’s Terms of Service and acknowledge that our use of Google user data adheres strictly to the{' '}
                                        <a
                                            href="https://developers.google.com/terms/api-services-user-data-policy"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-bold text-[#1E2A5A] underline"
                                        >
                                            Google API Services User Data Policy
                                        </a>{' '}
                                        and Limited Use requirements.
                                    </p>
                                </div>
                            </section>

                            {/* Section 7: Intellectual Property */}
                            <section id="intellectual-property" className="rounded-3xl border border-[#EAE4D2] bg-white p-6 shadow-sm sm:p-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDF7E4] text-[#1E2A5A]">
                                        <FileText className="h-5 w-5 text-[#FF9F43]" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[#1E2A5A]">
                                        7. Intellectual Property
                                    </h2>
                                </div>
                                <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#5C6480]">
                                    <p>
                                        All platform code, design elements, graphics, logos, user interfaces, and brand assets of ConvoMate are the exclusive intellectual property of ConvoMate and protected by applicable copyright and trademark laws.
                                    </p>
                                </div>
                            </section>

                            {/* Section 8: Disclaimer */}
                            <section id="disclaimer" className="rounded-3xl border border-[#EAE4D2] bg-white p-6 shadow-sm sm:p-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDF7E4] text-[#1E2A5A]">
                                        <Shield className="h-5 w-5 text-[#FF9F43]" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[#1E2A5A]">
                                        8. Disclaimers & Limitation of Liability
                                    </h2>
                                </div>
                                <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#5C6480]">
                                    <p>
                                        ConvoMate is provided on an "AS IS" and "AS AVAILABLE" basis. While we strive for excellence and vet teacher qualifications, we do not guarantee specific language exam results or fluency outcomes, as individual progress depends on learner commitment.
                                    </p>
                                    <p>
                                        To the maximum extent permitted by law, ConvoMate shall not be liable for any indirect, incidental, or consequential damages resulting from your use of the service.
                                    </p>
                                </div>
                            </section>

                            {/* Section 9: Termination */}
                            <section id="termination" className="rounded-3xl border border-[#EAE4D2] bg-white p-6 shadow-sm sm:p-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDF7E4] text-[#1E2A5A]">
                                        <Lock className="h-5 w-5 text-[#FF9F43]" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[#1E2A5A]">
                                        9. Termination
                                    </h2>
                                </div>
                                <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#5C6480]">
                                    <p>
                                        You may terminate your account at any time via <strong>Settings &gt; Profile &gt; Delete Account</strong>.
                                    </p>
                                    <p>
                                        We reserve the right to suspend or terminate accounts that violate our Code of Conduct, submit falsified credentials, or engage in fraudulent activities without prior notice.
                                    </p>
                                </div>
                            </section>

                            {/* Section 10: Governing Law */}
                            <section id="governing-law" className="rounded-3xl border border-[#EAE4D2] bg-white p-6 shadow-sm sm:p-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDF7E4] text-[#1E2A5A]">
                                        <Scale className="h-5 w-5 text-[#1E2A5A]" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[#1E2A5A]">
                                        10. Governing Law & Dispute Resolution
                                    </h2>
                                </div>
                                <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#5C6480]">
                                    <p>
                                        These Terms shall be governed by and construed in accordance with the laws of the <strong>Republic of Uzbekistan</strong>, without regard to its conflict of law principles. Any dispute arising out of or relating to these Terms shall be resolved through good-faith amicable negotiation or before the competent courts of Uzbekistan.
                                    </p>
                                </div>
                            </section>

                            {/* Section 11: Contact */}
                            <section id="contact" className="rounded-3xl border border-[#EAE4D2] bg-white p-6 shadow-sm sm:p-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDF7E4] text-[#1E2A5A]">
                                        <Mail className="h-5 w-5 text-[#FF9F43]" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[#1E2A5A]">
                                        11. Contact Information
                                    </h2>
                                </div>
                                <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#5C6480]">
                                    <p>
                                        For any questions regarding these Terms of Service, please contact us at:
                                    </p>
                                    <div className="rounded-2xl border border-[#EAE4D2] bg-[#FDFBF7] p-4 text-xs font-medium text-[#1E2A5A]">
                                        <p><strong>Entity:</strong> ConvoMate</p>
                                        <p className="mt-1"><strong>Email:</strong> <a href="mailto:support@convomate.uz" className="text-blue-600 underline">support@convomate.uz</a></p>
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
                            <Link href="/privacy" className="hover:text-[#1E2A5A]">
                                Privacy Policy
                            </Link>
                            <Link href="/terms" className="text-[#1E2A5A] underline">
                                Terms of Service
                            </Link>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
