<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Notifications\TelegramLinkOtpNotification;
use App\Notifications\WelcomeNotification;
use App\Services\Telegram\TelegramWebAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\Response;

class TelegramAuthController extends Controller
{
    public function __construct(
        protected TelegramWebAppService $telegramWebAppService
    ) {}

    /**
     * Dedicated Telegram Mini App entry point.
     */
    public function entry(Request $request): Response|InertiaResponse
    {
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('telegram/welcome');
    }

    /**
     * Consume a one-time cryptographic login token for reliable mobile WebView 302 navigation.
     */
    public function consumeToken(Request $request, string $token): RedirectResponse
    {
        $userId = Cache::pull("telegram_login_token:{$token}");

        if (! $userId) {
            return redirect()->route('telegram.tma')->with('error', 'Login session expired or invalid. Please try again.');
        }

        $user = User::find($userId);

        if (! $user) {
            return redirect()->route('telegram.tma')->with('error', 'User account not found.');
        }

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        return redirect()->route('dashboard');
    }

    /**
     * Generate an ephemeral one-time login URL for seamless mobile WebView authentication.
     */
    protected function createOneTimeLoginUrl(User $user): string
    {
        $token = Str::random(48);
        Cache::put("telegram_login_token:{$token}", $user->id, now()->addSeconds(60));

        return route('telegram.consume-token', ['token' => $token]);
    }

    /**
     * Authenticate or check linking status via Telegram WebApp initData.
     */
    public function auth(Request $request): JsonResponse
    {
        $request->validate([
            'initData' => ['required', 'string'],
        ]);

        $validated = $this->telegramWebAppService->validateInitData($request->input('initData'));

        if (! $validated) {
            return response()->json([
                'error' => 'Invalid or expired Telegram signature.',
            ], 403);
        }

        $telegramUser = $validated['user'] ?? null;
        if (! is_array($telegramUser) || empty($telegramUser['id'])) {
            return response()->json([
                'error' => 'Invalid Telegram user payload.',
            ], 400);
        }

        $telegramId = (string) $telegramUser['id'];
        $telegramUsername = $telegramUser['username'] ?? null;
        $firstName = $telegramUser['first_name'] ?? '';
        $lastName = $telegramUser['last_name'] ?? '';
        $fullName = trim("{$firstName} {$lastName}");

        // Check if a user is already linked with this Telegram ID
        $user = User::where('telegram_chat_id', $telegramId)->first();

        if ($user) {
            // Update username if it changed
            if ($telegramUsername && $user->telegram_username !== $telegramUsername) {
                $user->update(['telegram_username' => $telegramUsername]);
            }

            Auth::login($user, remember: true);
            $request->session()->regenerate();

            return response()->json([
                'status' => 'authenticated',
                'redirect' => $this->createOneTimeLoginUrl($user),
                'user' => [
                    'id' => $user->id,
                    'name' => $user->full_name,
                    'role' => $user->role,
                ],
            ]);
        }

        // If user is currently logged in with web session, link this Telegram account immediately
        if (Auth::check()) {
            /** @var User $currentUser */
            $currentUser = Auth::user();
            $currentUser->update([
                'telegram_chat_id' => $telegramId,
                'telegram_username' => $telegramUsername,
            ]);

            return response()->json([
                'status' => 'linked',
                'redirect' => $this->createOneTimeLoginUrl($currentUser),
                'user' => [
                    'id' => $currentUser->id,
                    'name' => $currentUser->full_name,
                    'role' => $currentUser->role,
                ],
            ]);
        }

        session(['telegram_register' => [
            'telegram_chat_id' => $telegramId,
            'telegram_username' => $telegramUsername,
            'name' => ! empty($fullName) ? $fullName : ($telegramUsername ?? 'Telegram User'),
        ]]);

        return response()->json([
            'status' => 'needs_onboarding',
            'redirect' => route('telegram.tma'),
            'telegram_user' => [
                'id' => $telegramId,
                'name' => ! empty($fullName) ? $fullName : ($telegramUsername ?? 'Telegram User'),
                'username' => $telegramUsername,
            ],
        ]);
    }

    /**
     * Send a 6-digit verification code to the existing account email for linking.
     */
    public function sendLinkCode(Request $request): JsonResponse
    {
        $request->validate([
            'initData' => ['required', 'string'],
            'email' => ['required', 'email'],
        ]);

        $validated = $this->telegramWebAppService->validateInitData($request->input('initData'));

        if (! $validated || empty($validated['user']['id'])) {
            return response()->json([
                'error' => 'Invalid or expired Telegram signature.',
            ], 403);
        }

        $email = strtolower(trim((string) $request->input('email')));
        $user = User::where('email', $email)->first();

        if (! $user) {
            return response()->json([
                'error' => 'No ConvoMate account found with this email. You can start with Quick Sign-Up instead!',
            ], 404);
        }

        $telegramId = (string) $validated['user']['id'];
        $telegramUsername = $validated['user']['username'] ?? null;

        // Generate secure 6-digit OTP code
        $code = (string) random_int(100000, 999999);

        Cache::put("telegram_otp:{$user->id}", [
            'code' => $code,
            'telegram_id' => $telegramId,
            'telegram_username' => $telegramUsername,
        ], now()->addMinutes(10));

        try {
            $user->notifyNow(new TelegramLinkOtpNotification($code));
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'error' => 'Unable to send verification email at the moment. Please try again shortly.',
            ], 500);
        }

        return response()->json([
            'status' => 'code_sent',
            'message' => 'Verification code sent to your email.',
            'email' => $user->email,
        ]);
    }

    /**
     * Verify the 6-digit code and link the Telegram account.
     */
    public function verifyLinkCode(Request $request): JsonResponse
    {
        $request->validate([
            'initData' => ['required', 'string'],
            'email' => ['required', 'email'],
            'code' => ['required', 'string', 'min:6', 'max:6'],
        ]);

        $validated = $this->telegramWebAppService->validateInitData($request->input('initData'));

        if (! $validated || empty($validated['user']['id'])) {
            return response()->json([
                'error' => 'Invalid or expired Telegram signature.',
            ], 403);
        }

        $email = strtolower(trim((string) $request->input('email')));
        $user = User::where('email', $email)->first();

        if (! $user) {
            return response()->json([
                'error' => 'Account not found.',
            ], 404);
        }

        $cachedOtp = Cache::get("telegram_otp:{$user->id}");

        if (! $cachedOtp || ! isset($cachedOtp['code'])) {
            return response()->json([
                'error' => 'Verification code has expired. Please request a new code.',
            ], 422);
        }

        $submittedCode = trim((string) $request->input('code'));
        if (! hash_equals((string) $cachedOtp['code'], $submittedCode)) {
            return response()->json([
                'error' => 'Incorrect verification code. Please check your email and try again.',
            ], 422);
        }

        $telegramId = (string) $validated['user']['id'];
        $telegramUsername = $validated['user']['username'] ?? null;

        $user->update([
            'telegram_chat_id' => $telegramId,
            'telegram_username' => $telegramUsername,
        ]);

        Cache::forget("telegram_otp:{$user->id}");

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        return response()->json([
            'status' => 'authenticated',
            'redirect' => $this->createOneTimeLoginUrl($user),
            'user' => [
                'id' => $user->id,
                'name' => $user->full_name,
                'role' => $user->role,
            ],
        ]);
    }

    /**
     * Quick registration tailored for Telegram Mini App users (< 30 seconds).
     */
    public function quickRegister(Request $request): JsonResponse
    {
        $request->validate([
            'initData' => ['required', 'string'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'role' => ['nullable', 'string', 'in:pupil,teacher'],
            'level' => ['nullable', 'string', 'in:beginner,pre-intermediate,upper-intermediate,advanced,ielts_band,cefr_band'],
            'age' => ['nullable', 'integer', 'min:5', 'max:120'],
            'phone_number' => ['nullable', 'string', 'max:30'],
        ]);

        $validated = $this->telegramWebAppService->validateInitData($request->input('initData'));

        if (! $validated || empty($validated['user']['id'])) {
            return response()->json([
                'error' => 'Invalid or expired Telegram signature.',
            ], 403);
        }

        $email = strtolower(trim((string) $request->input('email')));

        if (User::where('email', $email)->exists()) {
            return response()->json([
                'error' => 'An account with this email already exists. Click "Link Account" to connect your Telegram account with a verification code.',
            ], 422);
        }

        $telegramId = (string) $validated['user']['id'];
        $telegramUsername = $validated['user']['username'] ?? null;
        $role = $request->input('role') ?: 'pupil';
        $name = trim((string) $request->input('name'));
        $age = $request->input('age') ? (int) $request->input('age') : 20;
        $phoneNumber = $request->input('phone_number') ?: '';
        $level = $request->input('level') ?: 'pre-intermediate';

        $user = DB::transaction(function () use ($name, $email, $role, $telegramId, $telegramUsername, $age, $phoneNumber, $level) {
            $randomPassword = Str::random(24).'aA1!@#$';

            $user = User::create([
                'full_name' => $name,
                'email' => $email,
                'password' => Hash::make($randomPassword),
                'role' => $role,
                'gender' => 'prefer_not_to_say',
                'has_password' => false,
                'telegram_chat_id' => $telegramId,
                'telegram_username' => $telegramUsername,
                'phone_number' => $phoneNumber,
            ]);

            $user->email_verified_at = now();
            $user->save();

            if ($role === 'teacher') {
                $user->teacherProfile()->create([
                    'age' => $age,
                    'phone_number' => $phoneNumber,
                    'overall_level' => 'CEFR B2',
                    'speaking_band' => 7.0,
                    'price' => 0,
                    'experience_years' => 0.0,
                    'rating_cache' => 0.0,
                ]);
            } else {
                $user->pupilProfile()->create([
                    'age' => $age,
                    'phone_number' => $phoneNumber,
                    'level' => $level,
                ]);
            }

            return $user;
        });

        $user->notify(new WelcomeNotification($role));

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        return response()->json([
            'status' => 'authenticated',
            'redirect' => $this->createOneTimeLoginUrl($user),
            'user' => [
                'id' => $user->id,
                'name' => $user->full_name,
                'role' => $user->role,
            ],
        ]);
    }
}
