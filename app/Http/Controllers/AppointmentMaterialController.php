<?php

namespace App\Http\Controllers;

use App\Events\AppointmentMaterialShared;
use App\Models\Appointment;
use App\Models\AppointmentMaterial;
use App\Services\Telegram\TelegramService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AppointmentMaterialController extends Controller
{
    public function __construct(
        protected TelegramService $telegramService
    ) {}

    /**
     * List materials and metadata for an appointment.
     */
    public function index(Request $request, Appointment $appointment): JsonResponse
    {
        $userId = (string) $request->user()->id;
        if ($userId !== (string) $appointment->teacher_id && $userId !== (string) $appointment->pupil_id) {
            abort(403, 'You are not authorized to view materials for this session.');
        }

        $appointment->load(['teacher:id,full_name,avatar,telegram_chat_id', 'pupil:id,full_name,avatar,telegram_chat_id']);

        $materials = $appointment->materials()
            ->with('sender:id,full_name,avatar')
            ->get()
            ->map(function (AppointmentMaterial $material) {
                return [
                    'id' => $material->id,
                    'appointment_id' => $material->appointment_id,
                    'sender_id' => $material->sender_id,
                    'sender_name' => $material->sender?->full_name ?? $material->sender?->name ?? 'User',
                    'sender_avatar' => $material->sender?->avatar,
                    'type' => $material->type,
                    'title' => $material->title,
                    'url' => $material->url,
                    'file_size' => $material->file_size,
                    'formatted_size' => $material->formatted_file_size,
                    'mime_type' => $material->mime_type,
                    'telegram_delivery_status' => $material->telegram_delivery_status,
                    'created_at' => $material->created_at?->toISOString() ?? now()->toISOString(),
                ];
            });

        $isTeacher = $userId === (string) $appointment->teacher_id;
        $partner = $isTeacher ? $appointment->pupil : $appointment->teacher;

        return response()->json([
            'materials' => $materials,
            'session' => [
                'id' => $appointment->id,
                'status' => $appointment->status,
                'start_at' => $appointment->start_at,
                'end_at' => $appointment->end_at,
                'google_meet_link' => ($isTeacher || $appointment->meeting_started) ? $appointment->google_meet_link : null,
            ],
            'partner' => [
                'id' => $partner->id,
                'name' => $partner->full_name ?? $partner->name,
                'avatar' => $partner->avatar,
                'role' => $isTeacher ? 'student' : 'teacher',
                'telegram_connected' => ! empty($partner->telegram_chat_id),
            ],
            'user' => [
                'telegram_connected' => ! empty($request->user()->telegram_chat_id),
            ],
            'bot_username' => config('services.telegram.bot_username', 'EnglishSpeakingBot'),
        ]);
    }

    /**
     * Share a new material (document, image, or link) during an appointment.
     */
    public function store(Request $request, Appointment $appointment): JsonResponse
    {
        $user = $request->user();
        $userId = (string) $user->id;

        if ($userId !== (string) $appointment->teacher_id && $userId !== (string) $appointment->pupil_id) {
            abort(403, 'You are not authorized to share materials in this session.');
        }

        $type = $request->input('type');

        if ($type === 'link') {
            $request->validate([
                'url' => ['required', 'string', 'url', 'max:2048'],
                'title' => ['nullable', 'string', 'max:255'],
            ]);

            $url = $request->input('url');
            $scheme = parse_url($url, PHP_URL_SCHEME);
            if (! in_array(strtolower((string) $scheme), ['http', 'https'], true)) {
                throw ValidationException::withMessages([
                    'url' => ['Only secure web links (http or https) are allowed.'],
                ]);
            }

            $title = $request->input('title') ?: $url;
            $materialType = 'link';
            $fileSize = null;
            $mimeType = null;
            $filePath = null;
        } else {
            $request->validate([
                'file' => [
                    'required',
                    'file',
                    'max:25600', // 25 MB
                    'mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png,webp',
                ],
            ]);

            $file = $request->file('file');
            $mimeType = (string) $file->getMimeType();

            // Explicit rejection of video types
            if (str_starts_with($mimeType, 'video/')) {
                throw ValidationException::withMessages([
                    'file' => ['Video uploads are not allowed. Please share documents, images, or links.'],
                ]);
            }

            $materialType = str_starts_with($mimeType, 'image/') ? 'image' : 'document';
            $title = $file->getClientOriginalName();
            $fileSize = $file->getSize();
            $url = null;
            $filePath = $file->getRealPath();
        }

        $appointment->load(['teacher:id,full_name,telegram_chat_id', 'pupil:id,full_name,telegram_chat_id']);

        $teacherChatId = $appointment->teacher?->telegram_chat_id;
        $pupilChatId = $appointment->pupil?->telegram_chat_id;

        $shortId = substr(str_replace('-', '', (string) $appointment->id), 0, 8);
        $tag = 'Lesson_'.$shortId;

        $startDateFormatted = Carbon::parse($appointment->start_at)
            ->setTimezone('Asia/Tashkent')
            ->format('M d, Y · H:i');

        $teacherName = $appointment->teacher?->full_name ?? $appointment->teacher?->name ?? 'Teacher';
        $pupilName = $appointment->pupil?->full_name ?? $appointment->pupil?->name ?? 'Student';
        $senderName = $user->full_name ?? $user->name ?? 'User';

        $caption = "📚 <b>ConvoMate Lesson Material</b>\n\n".
            "🗓 <b>Date:</b> {$startDateFormatted} (Tashkent)\n".
            "👨‍🏫 <b>Teacher:</b> {$teacherName}\n".
            "🧑‍🎓 <b>Student:</b> {$pupilName}\n".
            "👤 <b>Shared by:</b> {$senderName}\n".
            "🏷 <b>Tag:</b> #{$tag}\n\n";

        if ($materialType === 'link') {
            $caption .= "🔗 <b>Resource Link:</b>\n<a href=\"{$url}\">".htmlspecialchars($title, ENT_QUOTES, 'UTF-8').'</a>';
        } else {
            $caption .= '📎 <b>Attachment:</b> '.htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
        }

        $deliverySuccessCount = 0;
        $targetChatIds = array_values(array_filter([$teacherChatId, $pupilChatId]));

        try {
            foreach ($targetChatIds as $chatId) {
                if ($materialType === 'link') {
                    $sent = $this->telegramService->sendMessage($chatId, $caption);
                } elseif ($materialType === 'image') {
                    $sent = $this->telegramService->sendPhoto($chatId, $filePath, $title, $caption);
                } else {
                    $sent = $this->telegramService->sendDocument($chatId, $filePath, $title, $caption);
                }

                if ($sent) {
                    $deliverySuccessCount++;
                }
            }
        } catch (\Throwable $e) {
            Log::error('Error dispatching material to Telegram: '.$e->getMessage());
        }

        // Determine delivery status
        if (count($targetChatIds) === 2 && $deliverySuccessCount === 2) {
            $status = 'delivered_both';
        } elseif ($deliverySuccessCount > 0) {
            $status = 'delivered_partial';
        } elseif (empty($teacherChatId) && empty($pupilChatId)) {
            $status = 'pending_telegram_link';
        } else {
            $status = 'failed';
        }

        $material = $appointment->materials()->create([
            'sender_id' => $user->id,
            'type' => $materialType,
            'title' => $title,
            'url' => $url,
            'file_size' => $fileSize,
            'mime_type' => $mimeType,
            'telegram_delivery_status' => $status,
        ]);

        $material->load('sender:id,full_name,avatar');

        // Broadcast to partner in real time
        try {
            broadcast(new AppointmentMaterialShared($material))->toOthers();
        } catch (\Throwable $e) {
            Log::warning('Broadcasting material shared event failed: '.$e->getMessage());
        }

        $formattedMaterial = [
            'id' => $material->id,
            'appointment_id' => $material->appointment_id,
            'sender_id' => $material->sender_id,
            'sender_name' => $material->sender?->full_name ?? $material->sender?->name ?? 'User',
            'sender_avatar' => $material->sender?->avatar,
            'type' => $material->type,
            'title' => $material->title,
            'url' => $material->url,
            'file_size' => $material->file_size,
            'formatted_size' => $material->formatted_file_size,
            'mime_type' => $material->mime_type,
            'telegram_delivery_status' => $material->telegram_delivery_status,
            'created_at' => $material->created_at?->toISOString() ?? now()->toISOString(),
        ];

        return response()->json([
            'message' => 'Material shared successfully',
            'material' => $formattedMaterial,
            'delivery_status' => $status,
        ], 201);
    }
}
