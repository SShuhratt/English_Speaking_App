<?php

namespace App\Http\Middleware;

use App\Services\PartnerAttributionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CapturePartnerAttribution
{
    public function __construct(
        protected PartnerAttributionService $partnerAttributionService
    ) {}

    /**
     * Handle an incoming request and capture active partner referral codes in session.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethod('GET') && ($request->has('partner') || $request->has('ref'))) {
            $this->partnerAttributionService->captureFromRequest($request);
        }

        return $next($request);
    }
}
