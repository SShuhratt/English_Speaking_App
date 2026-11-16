<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Gateway Fee & Revenue Split Basis Points (100 bps = 1%)
    |--------------------------------------------------------------------------
    | All revenue shares (Teacher 80%, Platform 15%, Partner Learning Center 5%)
    | are calculated strictly on Net Cash after deducting the payment gateway
    | acquiring fee (default 2% = 200 bps).
    */
    'gateway_fee_bps' => (int) env('CONVOMATE_GATEWAY_FEE_BPS', 200),

    'gateway_providers' => [
        'humo_p2p' => (int) env('CONVOMATE_GATEWAY_FEE_BPS', 200),
        'click' => (int) env('CONVOMATE_CLICK_FEE_BPS', 200),
        'payme' => (int) env('CONVOMATE_PAYME_FEE_BPS', 200),
        'uzum' => (int) env('CONVOMATE_UZUM_FEE_BPS', 200),
        'free_voucher' => 0,
        'wholesale_bundle' => 0,
    ],

    'shares' => [
        'teacher_bps' => (int) env('CONVOMATE_TEACHER_SHARE_BPS', 8000),
        'platform_bps' => (int) env('CONVOMATE_PLATFORM_SHARE_BPS', 1500),
        'partner_bps' => (int) env('CONVOMATE_PARTNER_SHARE_BPS', 500),
    ],

    /*
    |--------------------------------------------------------------------------
    | Attribution & Payout Thresholds
    |--------------------------------------------------------------------------
    */
    'attribution_window_hours' => (int) env('CONVOMATE_PARTNER_ATTRIBUTION_HOURS', 24),
    'minimum_payout_uzs' => (int) env('CONVOMATE_PARTNER_MIN_PAYOUT_UZS', 100000),
    'exclude_trial_lessons' => true,

    /*
    |--------------------------------------------------------------------------
    | Track B2 Wholesale Bulk Vouchers
    |--------------------------------------------------------------------------
    */
    'voucher_validity_min_days' => 30,
    'voucher_validity_max_days' => 90,
    'voucher_default_validity_days' => 60,
    'voucher_min_wholesale_discount_percent' => 10,
    'voucher_max_wholesale_discount_percent' => 15,

    /*
    |--------------------------------------------------------------------------
    | Track B1 Partner Pass & Daily P2P Quotas (Defaults; Overridable via Admin)
    |--------------------------------------------------------------------------
    */
    'partner_pass' => [
        'b2c_price_uzs' => (int) env('CONVOMATE_PARTNER_PASS_B2C_PRICE_UZS', 30000),
        'b2b_default_price_uzs' => (int) env('CONVOMATE_PARTNER_PASS_B2B_PRICE_UZS', 25000),
        'b2b_min_price_uzs' => (int) env('CONVOMATE_PARTNER_PASS_B2B_MIN_PRICE_UZS', 20000),
        'default_days' => (int) env('CONVOMATE_PARTNER_PASS_DEFAULT_DAYS', 30),
    ],

    'p2p_quota' => [
        'free_daily_minutes' => (int) env('CONVOMATE_P2P_FREE_DAILY_MINUTES', 60),
        'attributed_daily_minutes' => (int) env('CONVOMATE_P2P_ATTRIBUTED_DAILY_MINUTES', 120),
    ],

    /*
    |--------------------------------------------------------------------------
    | Phase 3 Readiness: WritingMentor External Bridge
    |--------------------------------------------------------------------------
    */
    'writing_mentor' => [
        'enabled' => (bool) env('WRITING_MENTOR_ENABLED', false),
        'base_url' => env('WRITING_MENTOR_URL'),
        'sso_secret' => env('WRITING_MENTOR_SSO_SECRET'),
        'webhook_secret' => env('WRITING_MENTOR_WEBHOOK_SECRET'),
        'webhook_tolerance_seconds' => (int) env('WRITING_MENTOR_WEBHOOK_TOLERANCE', 300),
    ],
];
