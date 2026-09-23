import { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import '@/types/telegram.d';

export default function TelegramWelcome() {
    const [activeTab, setActiveTab] = useState<'register' | 'link'>('register');
    const [telegramName, setTelegramName] = useState<string>('');
    const [telegramUsername, setTelegramUsername] = useState<string>('');
    const [initData, setInitData] = useState<string>('');

    // Quick Sign-Up state
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [role, setRole] = useState<'pupil' | 'teacher'>('pupil');
    const [level, setLevel] = useState<string>('pre-intermediate');
    const [age, setAge] = useState<string>('20');
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [regProcessing, setRegProcessing] = useState<boolean>(false);
    const [regError, setRegError] = useState<string>('');

    // Link Account state
    const [linkStep, setLinkStep] = useState<'email' | 'code'>('email');
    const [linkEmail, setLinkEmail] = useState<string>('');
    const [linkCode, setLinkCode] = useState<string>('');
    const [linkProcessing, setLinkProcessing] = useState<boolean>(false);
    const [linkError, setLinkError] = useState<string>('');
    const [linkSuccess, setLinkSuccess] = useState<string>('');
    const [isTelegramEnv, setIsTelegramEnv] = useState<boolean>(true);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const webApp = window.Telegram?.WebApp;
        if (webApp && webApp.initData) {
            setInitData(webApp.initData);
            setIsTelegramEnv(true);

            const user = webApp.initDataUnsafe?.user;
            if (user) {
                const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
                setTelegramName(fullName || user.first_name || '');
                setName(fullName || user.first_name || '');
                if (user.username) {
                    setTelegramUsername(user.username);
                }
            }
        } else {
            setIsTelegramEnv(false);
        }
    }, []);

    const handleQuickRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setRegError('');

        if (!initData) {
            setRegError('Please open this page inside Telegram (@EnglishSpeakingBot) for Quick Sign-Up, or use standard Web Sign-Up.');
            return;
        }

        setRegProcessing(true);

        try {
            const res = await fetch('/telegram/quick-register', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    initData,
                    name: name.trim(),
                    email: email.trim(),
                    role,
                    level,
                    age: parseInt(age, 10) || 20,
                    phone_number: phoneNumber.trim(),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setRegError(data.error || 'Failed to complete registration. Please check your information.');
                setRegProcessing(false);
                return;
            }

            if (data.status === 'authenticated') {
                try {
                    sessionStorage.removeItem('convomate_tma_auth_hash');
                } catch {
                    // Ignore storage restrictions
                }
                window.location.href = data.redirect || '/dashboard';
            }
        } catch {
            setRegError('Network error. Please try again.');
            setRegProcessing(false);
        }
    };

    const handleSendLinkCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLinkError('');
        setLinkSuccess('');

        if (!initData) {
            setLinkError('Please open this page inside Telegram (@EnglishSpeakingBot) to link your Telegram account.');
            return;
        }

        setLinkProcessing(true);

        try {
            const res = await fetch('/telegram/send-link-code', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    initData,
                    email: linkEmail.trim(),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setLinkError(data.error || 'Failed to send verification code.');
                setLinkProcessing(false);
                return;
            }

            setLinkSuccess(`Verification code sent to ${data.email}. Check your inbox or spam folder.`);
            setLinkStep('code');
            setLinkProcessing(false);
        } catch {
            setLinkError('Network error. Please try again.');
            setLinkProcessing(false);
        }
    };

    const handleVerifyLinkCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLinkError('');
        setLinkProcessing(true);

        try {
            const res = await fetch('/telegram/verify-link-code', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    initData,
                    email: linkEmail.trim(),
                    code: linkCode.trim(),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setLinkError(data.error || 'Invalid or expired verification code.');
                setLinkProcessing(false);
                return;
            }

            if (data.status === 'authenticated') {
                try {
                    sessionStorage.removeItem('convomate_tma_auth_hash');
                } catch {
                    // Ignore storage restrictions
                }
                window.location.href = data.redirect || '/dashboard';
            }
        } catch {
            setLinkError('Network error. Please try again.');
            setLinkProcessing(false);
        }
    };

    const levels = [
        { id: 'beginner', label: 'Beginner (A1-A2)' },
        { id: 'pre-intermediate', label: 'Intermediate (B1-B2)' },
        { id: 'upper-intermediate', label: 'Upper-Intermediate' },
        { id: 'advanced', label: 'Advanced (C1-C2)' },
        { id: 'ielts_band', label: 'IELTS Preparation' },
    ];

    return (
        <>
            <Head title="Welcome to ConvoMate" />

            <div className="min-h-screen bg-gradient-to-b from-brand-cream/40 via-background to-background text-foreground flex flex-col items-center justify-start p-4 sm:p-6 select-none">
                {/* Header Branding */}
                <div className="w-full max-w-md text-center pt-3 pb-4">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-md border border-brand-brown/10 mb-3">
                        <img src="/images/logo.png" alt="ConvoMate" className="w-9 h-9 object-contain" />
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-foreground font-display">
                        ConvoMate
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {telegramName ? `Welcome, ${telegramName}!` : 'Live 1-on-1 English Speaking Practice'}
                    </p>
                    {telegramUsername && (
                        <span className="inline-block text-[11px] font-medium text-sky-600 dark:text-sky-400 mt-0.5">
                            @{telegramUsername}
                        </span>
                    )}
                </div>

                {/* Main Card */}
                <div className="w-full max-w-md bg-card/90 backdrop-blur-sm border border-border/80 rounded-2xl shadow-lg p-5">
                    {!isTelegramEnv && (
                        <div className="mb-4 rounded-xl border border-sky-500/20 bg-sky-50 dark:bg-sky-950/30 p-3 text-xs text-sky-900 dark:text-sky-200 flex flex-col gap-1">
                            <span className="font-semibold">Visiting outside Telegram?</span>
                            <span>
                                This page is designed for the Telegram Mini App. Open it via{' '}
                                <a href="https://t.me/EnglishSpeakingBot" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-sky-700">
                                    @EnglishSpeakingBot
                                </a>{' '}
                                or continue using our{' '}
                                <a href="/login" className="underline font-bold hover:text-sky-700">
                                    Web Login
                                </a>{' '}
                                or{' '}
                                <a href="/register" className="underline font-bold hover:text-sky-700">
                                    Web Sign-Up
                                </a>.
                            </span>
                        </div>
                    )}

                    {/* Mode Toggle Tabs */}
                    <div className="grid grid-cols-2 p-1 bg-muted/70 rounded-xl mb-5 text-sm font-semibold">
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab('register');
                                setRegError('');
                            }}
                            className={`py-2 text-center rounded-lg transition-all ${
                                activeTab === 'register'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Quick Sign-Up
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab('link');
                                setLinkError('');
                            }}
                            className={`py-2 text-center rounded-lg transition-all ${
                                activeTab === 'link'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Link Account
                        </button>
                    </div>

                    {/* Tab 1: Quick Sign-Up (New User) */}
                    {activeTab === 'register' && (
                        <form onSubmit={handleQuickRegister} className="space-y-4">
                            <div className="text-xs text-muted-foreground bg-brand-cream/50 dark:bg-muted/40 p-3 rounded-xl border border-brand-brown/10">
                                Start practicing in 30 seconds. No password needed — Telegram is your secure sign-in key!
                            </div>

                            {regError && (
                                <div className="p-3 text-xs rounded-xl bg-destructive/10 text-destructive border border-destructive/20 font-medium">
                                    {regError}
                                </div>
                            )}

                            <div>
                                <Label htmlFor="reg-name" className="text-xs font-semibold">
                                    Your Full Name
                                </Label>
                                <Input
                                    id="reg-name"
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Alex Johnson"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="reg-email" className="text-xs font-semibold">
                                    Email Address
                                </Label>
                                <Input
                                    id="reg-email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-semibold block mb-1.5">
                                    I want to join as:
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setRole('pupil')}
                                        className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center ${
                                            role === 'pupil'
                                                ? 'border-brand-brown bg-brand-brown text-white shadow-sm'
                                                : 'border-input bg-background text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        Learner / Pupil
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole('teacher')}
                                        className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center ${
                                            role === 'teacher'
                                                ? 'border-brand-brown bg-brand-brown text-white shadow-sm'
                                                : 'border-input bg-background text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        Speaking Tutor
                                    </button>
                                </div>
                            </div>

                            {role === 'pupil' && (
                                <div>
                                    <Label className="text-xs font-semibold block mb-1.5">
                                        Your Speaking Goal / Level
                                    </Label>
                                    <div className="grid grid-cols-1 gap-1.5">
                                        {levels.map((lvl) => (
                                            <button
                                                key={lvl.id}
                                                type="button"
                                                onClick={() => setLevel(lvl.id)}
                                                className={`py-2 px-3 text-left text-xs font-medium rounded-xl border transition-all flex items-center justify-between ${
                                                    level === lvl.id
                                                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-950 dark:text-sky-200'
                                                        : 'border-input bg-background text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                <span>{lvl.label}</span>
                                                {level === lvl.id && (
                                                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label htmlFor="reg-age" className="text-xs font-semibold">
                                        Age
                                    </Label>
                                    <Input
                                        id="reg-age"
                                        type="number"
                                        min={5}
                                        max={100}
                                        value={age}
                                        onChange={(e) => setAge(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="reg-phone" className="text-xs font-semibold">
                                        Phone (Optional)
                                    </Label>
                                    <Input
                                        id="reg-phone"
                                        type="tel"
                                        placeholder="+998 90 123 45 67"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={regProcessing || !email.trim() || !name.trim()}
                                className="w-full mt-2 py-5 font-bold text-sm bg-brand-brown hover:bg-brand-brown/90 text-white rounded-xl shadow-md transition-all cursor-pointer"
                            >
                                {regProcessing && <Spinner />}
                                Start Practicing
                            </Button>
                        </form>
                    )}

                    {/* Tab 2: Link Existing Account (For Email & Google Users) */}
                    {activeTab === 'link' && (
                        <div className="space-y-4">
                            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-xl border border-border">
                                Already registered on ConvoMate or signed in with Google? Enter your email to verify with a fast 6-digit code.
                            </div>

                            {linkError && (
                                <div className="p-3 text-xs rounded-xl bg-destructive/10 text-destructive border border-destructive/20 font-medium">
                                    {linkError}
                                </div>
                            )}

                            {linkSuccess && (
                                <div className="p-3 text-xs rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-500/20 font-medium">
                                    {linkSuccess}
                                </div>
                            )}

                            {linkStep === 'email' ? (
                                <form onSubmit={handleSendLinkCode} className="space-y-4">
                                    <div>
                                        <Label htmlFor="link-email" className="text-xs font-semibold">
                                            ConvoMate Account Email
                                        </Label>
                                        <Input
                                            id="link-email"
                                            type="email"
                                            required
                                            value={linkEmail}
                                            onChange={(e) => setLinkEmail(e.target.value)}
                                            placeholder="your-email@gmail.com"
                                            className="mt-1"
                                            autoFocus
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={linkProcessing || !linkEmail.trim()}
                                        className="w-full py-5 font-bold text-sm bg-brand-brown hover:bg-brand-brown/90 text-white rounded-xl shadow-md transition-all cursor-pointer"
                                    >
                                        {linkProcessing && <Spinner />}
                                        Send 6-Digit Code
                                    </Button>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyLinkCode} className="space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="link-code" className="text-xs font-semibold">
                                                Enter 6-Digit Verification Code
                                            </Label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setLinkStep('email');
                                                    setLinkCode('');
                                                    setLinkError('');
                                                }}
                                                className="text-[11px] text-sky-600 hover:underline"
                                            >
                                                Change email
                                            </button>
                                        </div>
                                        <Input
                                            id="link-code"
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            required
                                            value={linkCode}
                                            onChange={(e) => setLinkCode(e.target.value.replace(/\D/g, ''))}
                                            placeholder="123456"
                                            className="mt-1 tracking-widest text-center text-xl font-bold font-mono py-5"
                                            autoFocus
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={linkProcessing || linkCode.length < 6}
                                        className="w-full py-5 font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all cursor-pointer"
                                    >
                                        {linkProcessing && <Spinner />}
                                        Verify & Open Dashboard
                                    </Button>

                                    <div className="text-center pt-1">
                                        <button
                                            type="button"
                                            disabled={linkProcessing}
                                            onClick={handleSendLinkCode}
                                            className="text-xs text-muted-foreground hover:text-foreground underline"
                                        >
                                            Didn't receive the code? Send again
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer terms */}
                <div className="text-[11px] text-muted-foreground text-center mt-6">
                    By continuing, you agree to ConvoMate's{' '}
                    <a href="/terms" className="underline hover:text-foreground">Terms of Service</a>
                    {' '}and{' '}
                    <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
                </div>
            </div>
        </>
    );
}

TelegramWelcome.layout = (page: React.ReactNode) => page;

