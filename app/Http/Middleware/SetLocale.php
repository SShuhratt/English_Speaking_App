<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->cookie('locale');
        \Log::info("SetLocale Middleware: Cookie locale is: " . var_export($locale, true));

        if (! in_array($locale, ['en', 'uz', 'ru'])) {
            $locale = 'en';
        }

        app()->setLocale($locale);

        return $next($request);
    }
}
