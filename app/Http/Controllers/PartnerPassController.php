<?php

namespace App\Http\Controllers;

use App\Models\PartnerPass;
use App\Services\PartnerPassService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PartnerPassController extends Controller
{
    public function __construct(
        protected PartnerPassService $partnerPassService
    ) {}

    /**
     * Activate a B2B Partner Pass code onto the authenticated student's account.
     */
    public function redeemCode(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'pass_code' => ['required', 'string', 'max:32'],
        ]);

        $pass = $this->partnerPassService->redeemCode(
            pupil: $request->user(),
            code: $validated['pass_code'],
        );

        $partnerName = $pass->partnerOrganization?->name ?? 'Partner Center';
        $message = "Partner Pass activated via {$partnerName}! Valid until {$pass->expires_at?->toDateString()}.";

        if ($request->wantsJson() && ! $request->hasHeader('X-Inertia')) {
            return response()->json([
                'message' => $message,
                'partner_pass' => $pass,
            ]);
        }

        return back()->with('success', $message);
    }

    /**
     * Create a direct B2C Partner Pass purchase order for a student.
     */
    public function purchaseRetail(Request $request): JsonResponse|RedirectResponse
    {
        $pass = $this->partnerPassService->createRetailPurchase($request->user());

        $formattedPrice = number_format($pass->gross_amount, 0, '.', ' ');
        $message = "Partner Pass order created ({$formattedPrice} UZS). Upload your payment receipt for confirmation.";

        if ($request->wantsJson() && ! $request->hasHeader('X-Inertia')) {
            return response()->json([
                'message' => $message,
                'partner_pass' => $pass,
            ], 201);
        }

        return back()->with('success', $message);
    }

    /**
     * Attach a payment receipt or transaction note to a pending B2C Partner Pass order.
     */
    public function uploadReceipt(Request $request, PartnerPass $partnerPass): JsonResponse|RedirectResponse
    {
        if ($partnerPass->user_id !== $request->user()->id || $partnerPass->source !== 'b2c_retail') {
            abort(403);
        }

        $validated = $request->validate([
            'receipt' => ['nullable', 'file', 'mimes:jpeg,jpg,png,pdf,webp', 'max:10240'],
            'receipt_text' => ['nullable', 'string', 'max:1000'],
        ]);

        $path = $partnerPass->receipt_path;
        if ($request->hasFile('receipt')) {
            $path = $request->file('receipt')->store('partner-pass-receipts', 'public');
        }

        $receiptData = is_array($partnerPass->receipt_data) ? $partnerPass->receipt_data : [];
        if (! empty($validated['receipt_text'])) {
            $receiptData['note'] = trim($validated['receipt_text']);
        }
        $receiptData['submitted_at'] = now()->toIso8601String();

        if (! $path && empty($receiptData['note'])) {
            return back()->with('error', 'Please upload a receipt file or paste your transfer reference.');
        }

        $partnerPass->update([
            'receipt_path' => $path,
            'receipt_data' => $receiptData,
            'payment_status' => 'verifying',
        ]);

        if ($request->wantsJson() && ! $request->hasHeader('X-Inertia')) {
            return response()->json([
                'message' => 'Receipt submitted. Admin will verify and activate your Partner Pass shortly.',
                'partner_pass' => $partnerPass->fresh(),
            ]);
        }

        return back()->with('success', 'Receipt submitted. Admin will verify and activate your Partner Pass shortly.');
    }
}
