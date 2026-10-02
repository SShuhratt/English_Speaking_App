<?php

namespace App\Events;

use App\Models\AppointmentMaterial;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AppointmentMaterialShared implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public AppointmentMaterial $material
    ) {
        $this->material->load('sender:id,full_name,avatar');
    }

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('appointment.'.$this->material->appointment_id),
            new Channel('teacher.'.$this->material->appointment->teacher_id),
            new Channel('pupil.'.$this->material->appointment->pupil_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'material.shared';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->material->id,
            'appointment_id' => $this->material->appointment_id,
            'sender_id' => $this->material->sender_id,
            'sender_name' => $this->material->sender?->full_name ?? $this->material->sender?->name ?? 'User',
            'type' => $this->material->type,
            'title' => $this->material->title,
            'url' => $this->material->url,
            'file_size' => $this->material->file_size,
            'formatted_size' => $this->material->formatted_file_size,
            'mime_type' => $this->material->mime_type,
            'telegram_delivery_status' => $this->material->telegram_delivery_status,
            'created_at' => $this->material->created_at?->toISOString() ?? now()->toISOString(),
        ];
    }
}
