<?php

namespace App\Http\Middleware;

use App\Models\Appointment;
use App\Models\SupportMessage;
use App\Services\StreakService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $userShared = null;

        if ($user) {
            if ($user->role === 'teacher') {
                $user->load('teacherProfile');
            } elseif ($user->role === 'pupil') {
                $user->load('pupilProfile');
            }
            $userArray = $user->toArray();
            if ($user->role !== 'admin') {
                $userArray['streak_count'] = StreakService::calculateForUser($user);
            }
            $userShared = $userArray;
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'locale' => app()->getLocale(),
            'auth' => [
                'user' => $userShared,
                'pending_requests_count' => ($user && $user->role === 'teacher')
                    ? Appointment::where('teacher_id', $user->id)->where('status', 'pending')->count()
                    : 0,
                'pending_verifications_count' => ($user && $user->role === 'admin')
                    ? Appointment::where('status', 'accepted')->count()
                    : 0,
                'unread_support_count' => $user
                    ? ($user->role === 'admin'
                        ? SupportMessage::where('is_read_by_admin', false)->count()
                        : SupportMessage::where('user_id', $user->id)->where('is_read_by_user', false)->count())
                    : 0,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'google_register' => $request->session()->get('google_register'),
        ];
    }
}
