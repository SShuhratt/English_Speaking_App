<?php

namespace App\Http\Controllers;

use App\Models\SupportMessage;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminSupportController extends Controller
{
    /**
     * Display support tickets and messages for Admin
     */
    public function index(Request $request)
    {
        $selectedUserId = $request->query('user_id');

        // Get list of users who sent support messages with unread counts
        $conversations = SupportMessage::select('user_id')
            ->selectRaw('COUNT(CASE WHEN is_read_by_admin = false THEN 1 END) as unread_count')
            ->selectRaw('MAX(created_at) as last_message_at')
            ->groupBy('user_id')
            ->orderByDesc('last_message_at')
            ->get();

        $userIds = $conversations->pluck('user_id');
        $usersMap = User::whereIn('id', $userIds)
            ->with(['teacherProfile', 'pupilProfile'])
            ->get()
            ->keyBy('id');

        $userList = $conversations->map(function ($item) use ($usersMap) {
            $user = $usersMap->get($item->user_id);

            return [
                'user' => $user,
                'unread_count' => (int) $item->unread_count,
                'last_message_at' => $item->last_message_at,
            ];
        })->filter(fn ($item) => $item['user'] !== null)->values();

        $activeMessages = [];
        $activeUser = null;

        if ($selectedUserId) {
            $activeUser = User::with(['teacherProfile', 'pupilProfile'])->find($selectedUserId);

            if ($activeUser) {
                // Mark incoming messages from this user as read by admin
                SupportMessage::where('user_id', $selectedUserId)
                    ->where('is_read_by_admin', false)
                    ->update(['is_read_by_admin' => true]);

                $activeMessages = SupportMessage::where('user_id', $selectedUserId)
                    ->with(['user', 'admin'])
                    ->orderBy('created_at', 'asc')
                    ->get();
            }
        }

        $allUsers = User::whereIn('role', ['teacher', 'pupil'])
            ->select('id', 'full_name', 'email', 'role')
            ->orderBy('full_name')
            ->get();

        return Inertia::render('admin/support', [
            'userList' => $userList,
            'activeUser' => $activeUser,
            'activeMessages' => $activeMessages,
            'allUsers' => $allUsers,
        ]);
    }

    /**
     * Admin reply to specific user
     */
    public function reply(Request $request)
    {
        $validated = $request->validate([
            'user_id' => ['required', 'uuid', 'exists:users,id'],
            'subject' => ['nullable', 'string', 'max:255'],
            'message' => ['required', 'string', 'min:1'],
        ]);

        SupportMessage::create([
            'user_id' => $validated['user_id'],
            'admin_id' => $request->user()->id,
            'subject' => $validated['subject'] ?? 'Convomate Support Reply',
            'message' => $validated['message'],
            'is_read_by_admin' => true,
            'is_read_by_user' => false,
            'recipient_type' => 'individual',
        ]);

        return back()->with('success', 'Reply sent successfully.');
    }

    /**
     * Admin broadcast message to all or selected users
     */
    public function broadcast(Request $request)
    {
        $validated = $request->validate([
            'recipient_type' => ['required', 'in:all,teachers,pupils,selected'],
            'user_ids' => ['nullable', 'array'],
            'user_ids.*' => ['uuid', 'exists:users,id'],
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'min:1'],
        ]);

        $query = User::query();

        if ($validated['recipient_type'] === 'teachers') {
            $query->where('role', 'teacher');
        } elseif ($validated['recipient_type'] === 'pupils') {
            $query->where('role', 'pupil');
        } elseif ($validated['recipient_type'] === 'selected' && ! empty($validated['user_ids'])) {
            $query->whereIn('id', $validated['user_ids']);
        } else {
            $query->whereIn('role', ['teacher', 'pupil']);
        }

        $targetUsers = $query->get();

        foreach ($targetUsers as $user) {
            SupportMessage::create([
                'user_id' => $user->id,
                'admin_id' => $request->user()->id,
                'subject' => $validated['subject'],
                'message' => $validated['message'],
                'is_read_by_admin' => true,
                'is_read_by_user' => false,
                'recipient_type' => $validated['recipient_type'],
            ]);
        }

        return back()->with('success', 'Broadcast message sent to '.$targetUsers->count().' users.');
    }
}
