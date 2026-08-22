<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Inline style to set the HTML background color based on our theme --}}
        <style>
            html {
                background-color: #fbf8fd;
            }
        </style>

        {{-- Preconnect to Google Fonts domains for instant TLS handshake --}}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

        {{-- Direct high-priority font stylesheet loading with display=swap --}}
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Plus+Jakarta+Sans:wght@400..800&family=Schibsted+Grotesk:wght@400..700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">

        <link rel="icon" type="image/png" href="/images/logo.png">
        <link rel="apple-touch-icon" href="/images/logo.png">

        @fonts

        {{-- Inject Pusher/Echo credentials dynamically from the server --}}
        <script>
            window.laravelConfig = {
                pusherKey: '{{ config('broadcasting.connections.pusher.key') }}',
                pusherCluster: '{{ config('broadcasting.connections.pusher.options.cluster') }}',
                pusherHost: '{{ env('VITE_PUSHER_HOST', 'localhost') }}',
                pusherPort: '{{ env('VITE_PUSHER_PORT', '8443') }}',
                pusherScheme: '{{ env('VITE_PUSHER_SCHEME', 'http') }}',
            };
        </script>

        <title>ConvoMate — 1-on-1 English Speaking Practice Platform</title>
        <meta name="description" content="ConvoMate is a live 1-on-1 English speaking practice platform connecting students with IELTS-verified teachers for real-time conversation practice, fluency coaching, and personalized feedback.">
        <meta property="og:title" content="ConvoMate — 1-on-1 English Speaking Practice Platform">
        <meta property="og:description" content="ConvoMate is an interactive English speaking platform where learners book live 1-on-1 sessions with IELTS-verified teachers for real-time conversation practice, fluency coaching, and personalized feedback.">
        <meta property="og:site_name" content="ConvoMate">
        <meta property="og:url" content="https://convomate.uz">
        <meta property="og:type" content="website">

        {{-- JSON-LD Structured Data for Google OAuth & Search Verification --}}
        <script type="application/ld+json">
        {!! json_encode([
            '@context' => 'https://schema.org',
            '@type' => 'WebApplication',
            'name' => 'ConvoMate',
            'alternateName' => 'ConvoMate English Speaking Platform',
            'url' => 'https://convomate.uz',
            'description' => 'ConvoMate is an interactive English speaking practice platform connecting students with IELTS-verified teachers for live 1-on-1 speaking practice, real-time feedback, and fluency coaching.',
            'applicationCategory' => 'EducationalApplication',
            'operatingSystem' => 'All'
        ], JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) !!}
        </script>

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        <x-inertia::head />
    </head>
    <body class="font-sans antialiased">
        <noscript>
            <div style="padding: 2.5rem 1.5rem; font-family: sans-serif; text-align: center; max-width: 750px; margin: 0 auto; color: #1E2A5A;">
                <h1 style="font-size: 2.2rem; font-weight: 800; margin-bottom: 1rem;">ConvoMate — 1-on-1 English Speaking Practice Platform</h1>
                <p style="font-size: 1.15rem; line-height: 1.6; color: #5C6480; margin-bottom: 1rem;">
                    <strong>ConvoMate</strong> is an interactive English speaking practice platform where learners book live 1-on-1 sessions with IELTS-verified teachers for real-time conversation practice, fluency coaching, and personalized feedback.
                </p>
                <p style="font-size: 0.95rem; line-height: 1.6; color: #5C6480; margin-bottom: 1.5rem;">
                    ConvoMate integrates Google Sign-In for fast, secure authentication, and allows teachers to connect Google Calendar to automatically schedule lesson appointments and generate Google Meet video conference links for confirmed student speaking sessions.
                </p>
                <p style="margin-top: 1rem;">
                    <a href="/privacy" style="color: #1E2A5A; margin-right: 1.5rem; text-decoration: underline; font-weight: 600;">Privacy Policy</a>
                    <a href="/terms" style="color: #1E2A5A; text-decoration: underline; font-weight: 600;">Terms of Service</a>
                </p>
            </div>
        </noscript>
        <x-inertia::app />
    </body>
</html>
