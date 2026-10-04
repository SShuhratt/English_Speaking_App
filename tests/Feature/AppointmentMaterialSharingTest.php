<?php

namespace Tests\Feature;

use App\Events\AppointmentMaterialShared;
use App\Models\Appointment;
use App\Models\AppointmentMaterial;
use App\Models\TeacherProfile;
use App\Models\User;
use App\Services\Telegram\TelegramService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Mockery\MockInterface;
use Tests\TestCase;

class AppointmentMaterialSharingTest extends TestCase
{
    use RefreshDatabase;

    private User $teacher;

    private User $pupil;

    private Appointment $appointment;

    protected function setUp(): void
    {
        parent::setUp();

        $this->teacher = User::factory()->create([
            'role' => 'teacher',
            'telegram_chat_id' => '111111111',
            'full_name' => 'John Teacher',
        ]);

        TeacherProfile::factory()->create([
            'user_id' => $this->teacher->id,
            'is_verified' => true,
        ]);

        $this->pupil = User::factory()->create([
            'role' => 'pupil',
            'telegram_chat_id' => '222222222',
            'full_name' => 'Shuhrat Pupil',
        ]);

        $this->appointment = Appointment::create([
            'teacher_id' => $this->teacher->id,
            'pupil_id' => $this->pupil->id,
            'start_at' => Carbon::now()->addHour(),
            'end_at' => Carbon::now()->addHours(2),
            'status' => 'confirmed',
            'topics' => ['IELTS Speaking Part 2'],
        ]);
    }

    public function test_teacher_can_share_document_during_appointment(): void
    {
        $this->mock(TelegramService::class, function (MockInterface $mock) {
            $mock->shouldReceive('sendDocument')
                ->twice() // once for teacher, once for pupil
                ->andReturn(true);
        });

        Event::fake([AppointmentMaterialShared::class]);

        $file = UploadedFile::fake()->create('Grammar_Guide.pdf', 2048, 'application/pdf');

        $response = $this->actingAs($this->teacher)
            ->postJson("/appointments/{$this->appointment->id}/materials", [
                'file' => $file,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('material.title', 'Grammar_Guide.pdf')
            ->assertJsonPath('material.type', 'document')
            ->assertJsonPath('delivery_status', 'delivered_both');

        $this->assertDatabaseHas('appointment_materials', [
            'appointment_id' => $this->appointment->id,
            'sender_id' => $this->teacher->id,
            'type' => 'document',
            'title' => 'Grammar_Guide.pdf',
            'telegram_delivery_status' => 'delivered_both',
        ]);

        Event::assertDispatched(AppointmentMaterialShared::class);
    }

    public function test_pupil_can_share_image_during_appointment(): void
    {
        $this->mock(TelegramService::class, function (MockInterface $mock) {
            $mock->shouldReceive('sendPhoto')
                ->twice()
                ->andReturn(true);
        });

        Event::fake([AppointmentMaterialShared::class]);

        $file = UploadedFile::fake()->create('speaking_chart.png', 500, 'image/png');

        $response = $this->actingAs($this->pupil)
            ->postJson("/appointments/{$this->appointment->id}/materials", [
                'file' => $file,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('material.type', 'image')
            ->assertJsonPath('material.title', 'speaking_chart.png');

        $this->assertDatabaseHas('appointment_materials', [
            'appointment_id' => $this->appointment->id,
            'sender_id' => $this->pupil->id,
            'type' => 'image',
        ]);
    }

    public function test_can_share_safe_web_link(): void
    {
        $this->mock(TelegramService::class, function (MockInterface $mock) {
            $mock->shouldReceive('sendMessage')
                ->twice()
                ->andReturn(true);
        });

        $response = $this->actingAs($this->teacher)
            ->postJson("/appointments/{$this->appointment->id}/materials", [
                'type' => 'link',
                'url' => 'https://dictionary.cambridge.org/topics',
                'title' => 'Cambridge Vocabulary Bank',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('material.type', 'link')
            ->assertJsonPath('material.title', 'Cambridge Vocabulary Bank')
            ->assertJsonPath('material.url', 'https://dictionary.cambridge.org/topics');

        $this->assertDatabaseHas('appointment_materials', [
            'appointment_id' => $this->appointment->id,
            'type' => 'link',
            'url' => 'https://dictionary.cambridge.org/topics',
        ]);
    }

    public function test_video_upload_is_strictly_rejected(): void
    {
        $video = UploadedFile::fake()->create('lecture.mp4', 5000, 'video/mp4');

        $response = $this->actingAs($this->teacher)
            ->postJson("/appointments/{$this->appointment->id}/materials", [
                'file' => $video,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_oversized_file_is_rejected(): void
    {
        // 26MB exceeds 25MB limit (25600 KB)
        $largeFile = UploadedFile::fake()->create('huge_book.pdf', 27000, 'application/pdf');

        $response = $this->actingAs($this->teacher)
            ->postJson("/appointments/{$this->appointment->id}/materials", [
                'file' => $largeFile,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_unauthorized_user_cannot_share_or_view_materials(): void
    {
        $stranger = User::factory()->create(['role' => 'pupil']);

        $file = UploadedFile::fake()->create('notes.pdf', 500, 'application/pdf');

        // Forbidden on store
        $this->actingAs($stranger)
            ->postJson("/appointments/{$this->appointment->id}/materials", [
                'file' => $file,
            ])
            ->assertStatus(403);

        // Forbidden on index
        $this->actingAs($stranger)
            ->getJson("/appointments/{$this->appointment->id}/materials")
            ->assertStatus(403);
    }

    public function test_handles_unlinked_telegram_gracefully(): void
    {
        // Create teacher and pupil without telegram_chat_id
        $teacherNoTg = User::factory()->create(['role' => 'teacher']);
        $pupilNoTg = User::factory()->create(['role' => 'pupil']);

        $apt = Appointment::create([
            'teacher_id' => $teacherNoTg->id,
            'pupil_id' => $pupilNoTg->id,
            'start_at' => Carbon::now()->addHour(),
            'end_at' => Carbon::now()->addHours(2),
            'status' => 'confirmed',
            'topics' => ['Grammar'],
        ]);

        $file = UploadedFile::fake()->create('CheatSheet.pdf', 1000, 'application/pdf');

        $response = $this->actingAs($teacherNoTg)
            ->postJson("/appointments/{$apt->id}/materials", [
                'file' => $file,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('delivery_status', 'pending_telegram_link');

        $this->assertDatabaseHas('appointment_materials', [
            'appointment_id' => $apt->id,
            'telegram_delivery_status' => 'pending_telegram_link',
        ]);
    }

    public function test_can_list_appointment_materials(): void
    {
        AppointmentMaterial::create([
            'appointment_id' => $this->appointment->id,
            'sender_id' => $this->teacher->id,
            'type' => 'document',
            'title' => 'IELTS_Part_2_Flashcards.pdf',
            'file_size' => 1500000,
            'mime_type' => 'application/pdf',
            'telegram_delivery_status' => 'delivered_both',
        ]);

        $response = $this->actingAs($this->pupil)
            ->getJson("/appointments/{$this->appointment->id}/materials");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'materials')
            ->assertJsonPath('materials.0.title', 'IELTS_Part_2_Flashcards.pdf')
            ->assertJsonPath('partner.role', 'teacher')
            ->assertJsonPath('partner.telegram_connected', true);
    }

    public function test_materials_endpoint_hides_google_meet_link_from_pupil_until_meeting_started(): void
    {
        $this->appointment->update([
            'google_meet_link' => 'https://meet.google.com/xyz-uvwx-rst',
            'meeting_started' => false,
        ]);

        // Pupil should receive null google_meet_link if meeting_started is false
        $pupilResponse = $this->actingAs($this->pupil)
            ->getJson("/appointments/{$this->appointment->id}/materials");

        $pupilResponse->assertStatus(200)
            ->assertJsonPath('session.google_meet_link', null);

        // Teacher can see the google_meet_link
        $teacherResponse = $this->actingAs($this->teacher)
            ->getJson("/appointments/{$this->appointment->id}/materials");

        $teacherResponse->assertStatus(200)
            ->assertJsonPath('session.google_meet_link', 'https://meet.google.com/xyz-uvwx-rst');

        // Once meeting is started, pupil can see the google_meet_link
        $this->appointment->update(['meeting_started' => true]);

        $pupilResponseStarted = $this->actingAs($this->pupil)
            ->getJson("/appointments/{$this->appointment->id}/materials");

        $pupilResponseStarted->assertStatus(200)
            ->assertJsonPath('session.google_meet_link', 'https://meet.google.com/xyz-uvwx-rst');
    }
}
