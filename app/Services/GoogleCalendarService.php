<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Arr;

class GoogleCalendarService
{
    public function __construct(
        protected GoogleOAuthService $oauth
    ) {}

    /**
     * CREATE EVENT + GOOGLE MEET
     */
    public function createEvent(User $teacher, array $data): array
    {
        $token = $this->oauth->getValidAccessToken($teacher);

        $response = Http::withToken($token)->post(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            $this->buildEventPayload($data)
        );

        if (!$response->successful()) {
            throw new \Exception('Google event creation failed: ' . $response->body());
        }

        return $this->formatResponse($response->json());
    }

    /**
     * UPDATE EVENT
     */
    public function updateEvent(User $teacher, string $eventId, array $data): array
    {
        $token = $this->oauth->getValidAccessToken($teacher);

        $response = Http::withToken($token)->put(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events/{$eventId}",
            $this->buildEventPayload($data)
        );

        if (!$response->successful()) {
            throw new \Exception('Google event update failed: ' . $response->body());
        }

        return $this->formatResponse($response->json());
    }

    /**
     * DELETE EVENT
     */
    public function deleteEvent(User $teacher, string $eventId): void
    {
        $token = $this->oauth->getValidAccessToken($teacher);

        $response = Http::withToken($token)->delete(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events/{$eventId}"
        );

        if (!$response->successful()) {
            throw new \Exception('Google event delete failed');
        }
    }

    /**
     * BUILD EVENT PAYLOAD (IMPORTANT)
     */
    protected function buildEventPayload(array $data): array
    {
        return [
            'summary' => $data['title'] ?? 'Meeting',
            'description' => $data['description'] ?? null,
            'start' => [
                'dateTime' => $data['start'],
                'timeZone' => 'Asia/Tashkent',
            ],
            'end' => [
                'dateTime' => $data['end'],
                'timeZone' => 'Asia/Tashkent',
            ],
            'attendees' => collect($data['attendees'] ?? [])->map(function ($a) {
                return ['email' => $a['email']];
            })->toArray(),

            'conferenceData' => [
                'createRequest' => [
                    'requestId' => uniqid(),
                    'conferenceSolutionKey' => [
                        'type' => 'hangoutsMeet'
                    ],
                ],
            ],
        ];
    }

    /**
     * FORMAT RESPONSE CLEANLY
     */
    protected function formatResponse(array $event): array
    {
        return [
            'event_id' => $event['id'] ?? null,
            'meet_link' => $event['hangoutLink'] ?? null,
            'html_link' => $event['htmlLink'] ?? null,
            'raw' => $event,
        ];
    }
}