<?php

namespace App\Http\Controllers;

use App\Models\SupportMessage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupportController extends Controller
{
    /**
     * Display Convomate Support page for pupil / teacher
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Mark messages as read by user
        SupportMessage::where('user_id', $user->id)
            ->where('is_read_by_user', false)
            ->update(['is_read_by_user' => true]);

        $messages = SupportMessage::where('user_id', $user->id)
            ->with(['admin'])
            ->orderBy('created_at', 'asc')
            ->get();

        return Inertia::render('support', [
            'messages' => $messages,
        ]);
    }

    /**
     * Submit a support ticket / message to Convomate Support
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject' => ['nullable', 'string', 'max:255'],
            'message' => ['required', 'string', 'min:3', 'max:5000'],
        ]);

        SupportMessage::create([
            'user_id' => $request->user()->id,
            'subject' => $validated['subject'] ?? 'Support Inquiry',
            'message' => $validated['message'],
            'is_read_by_admin' => false,
            'is_read_by_user' => true,
            'recipient_type' => 'individual',
        ]);

        return back()->with('success', 'Your message has been sent to Convomate Support. We will get back to you shortly.');
    }
}
