<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class GoogleCalendarService
{
    public function __construct(
        protected GoogleOAuthService $oauth
    ) {}

    /**
     * Send HTTP request with automatic token refresh retry on 401 Unauthorized or 403 Forbidden.
     */
    protected function executeRequest(User $teacher, callable $callback, string $errorMessage): Response
    {
        $token = $this->oauth->getValidAccessToken($teacher);
        $response = $callback($token);

        // If Google responds with 401 Unauthorized or 403 Forbidden (e.g. token expired or insufficient permissions),
        // force-refresh the access token using the long-lived refresh token and retry the operation once.
        if (in_array($response->status(), [401, 403])) {
            $token = $this->oauth->getValidAccessToken($teacher, forceRefresh: true);
            $response = $callback($token);
        }

        if (! $response->successful()) {
            throw new \Exception($errorMessage.': '.$response->body());
        }

        return $response;
    }

    /**
     * CREATE EVENT + GOOGLE MEET
     */
    public function createEvent(User $teacher, array $data): array
    {
        $response = $this->executeRequest($teacher, function (string $token) use ($data) {
            return Http::withToken($token)->post(
                'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
                $this->buildEventPayload($data)
            );
        }, 'Google event creation failed');

        return $this->formatResponse($response->json() ?? []);
    }

    /**
     * UPDATE EVENT
     */
    public function updateEvent(User $teacher, string $eventId, array $data): array
    {
        $response = $this->executeRequest($teacher, function (string $token) use ($eventId, $data) {
            return Http::withToken($token)->put(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events/{$eventId}?conferenceDataVersion=1",
                $this->buildEventPayload($data)
            );
        }, 'Google event update failed');

        return $this->formatResponse($response->json() ?? []);
    }

    /**
     * DELETE EVENT
     */
    public function deleteEvent(User $teacher, string $eventId): void
    {
        $this->executeRequest($teacher, function (string $token) use ($eventId) {
            return Http::withToken($token)->delete(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events/{$eventId}"
            );
        }, 'Google event delete failed');
    }

    /**
     * BUILD EVENT PAYLOAD (IMPORTANT)
     */
    protected function buildEventPayload(array $data): array
    {
        $payload = [
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
                $item = ['email' => $a['email']];
                if (isset($a['responseStatus'])) {
                    $item['responseStatus'] = $a['responseStatus'];
                }

                return $item;
            })->toArray(),

            'conferenceData' => [
                'createRequest' => [
                    'requestId' => uniqid(),
                    'conferenceSolutionKey' => [
                        'type' => 'hangoutsMeet',
                    ],
                ],
            ],
        ];

        if (isset($data['organizer_email'])) {
            $payload['organizer'] = [
                'email' => $data['organizer_email'],
            ];
        }

        return $payload;
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
