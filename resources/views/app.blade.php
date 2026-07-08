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

        {{-- Plus Jakarta Sans — ConvoMate brand typeface --}}
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">

        {{-- Material Symbols Outlined for UI Icons --}}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

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
