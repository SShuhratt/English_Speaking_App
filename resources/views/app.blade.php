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

        {{-- Preconnect to Google Fonts domains for faster TLS handshake --}}
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

        {{-- Preload critical font stylesheet --}}
        <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Plus+Jakarta+Sans:wght@400..800&family=Schibsted+Grotesk:wght@400..700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap">

        {{-- Asynchronous non-render-blocking font loading with instant font-display: swap --}}
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Plus+Jakarta+Sans:wght@400..800&family=Schibsted+Grotesk:wght@400..700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
        <noscript>
            <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Plus+Jakarta+Sans:wght@400..800&family=Schibsted+Grotesk:wght@400..700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
        </noscript>

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

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        <x-inertia::head>
            <title>{{ config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
