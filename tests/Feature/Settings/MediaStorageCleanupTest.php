<?php

namespace Tests\Feature\Settings;

use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MediaStorageCleanupTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_can_delete_intro_video_and_cleans_up_storage(): void
    {
        Storage::fake('public');

        $videoPath = 'videos/intro-video-123.mp4';
        Storage::disk('public')->put($videoPath, 'fake-video-content');
        Storage::disk('public')->assertExists($videoPath);

        $videoUrl = Storage::disk('public')->url($videoPath);

        $user = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $user->id,
            'intro_video_url' => $videoUrl,
        ]);

        $response = $this->actingAs($user)->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'delete_intro_video' => 1,
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(route('profile.edit'));

        Storage::disk('public')->assertMissing($videoPath);
        $this->assertNull($user->fresh()->teacherProfile->intro_video_url);
    }

    public function test_uploading_new_intro_video_deletes_old_video_from_storage(): void
    {
        Storage::fake('local');
        Storage::fake('public');

        $oldVideoPath = 'videos/old-intro.mp4';
        Storage::disk('public')->put($oldVideoPath, 'old-video-content');
        $oldVideoUrl = Storage::disk('public')->url($oldVideoPath);

        $user = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $user->id,
            'intro_video_url' => $oldVideoUrl,
        ]);

        $newVideo = UploadedFile::fake()->create('new-intro.mp4', 500, 'video/mp4');

        $response = $this->actingAs($user)->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'intro_video' => $newVideo,
        ]);

        $response->assertSessionHasNoErrors();

        // In sync testing, the background job runs and removes the old video from target storage
        Storage::disk('public')->assertMissing($oldVideoPath);

        $updatedProfile = $user->fresh()->teacherProfile;
        $this->assertNotNull($updatedProfile->intro_video_url);
        $this->assertNotEquals($oldVideoUrl, $updatedProfile->intro_video_url);
    }

    public function test_removing_certificate_deletes_file_from_storage(): void
    {
        Storage::fake('public');

        $certPath = 'certificates/ielts-cert-999.pdf';
        Storage::disk('public')->put($certPath, 'fake-pdf-content');
        $certUrl = Storage::disk('public')->url($certPath);

        $user = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $user->id,
            'certificates' => [
                [
                    'type' => 'ielts',
                    'title' => 'IELTS Certificate',
                    'file_url' => $certUrl,
                    'file_name' => 'ielts-cert-999.pdf',
                    'status' => 'verified',
                ],
            ],
        ]);

        // Submit empty certificates list (removing the existing certificate)
        $response = $this->actingAs($user)->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'certificates' => [],
        ]);

        $response->assertSessionHasNoErrors();
        Storage::disk('public')->assertMissing($certPath);
        $this->assertEmpty($user->fresh()->teacherProfile->certificates);
    }

    public function test_deleting_account_deletes_all_user_media_from_storage(): void
    {
        Storage::fake('public');

        $avatarPath = 'avatars/avatar-user.png';
        $videoPath = 'videos/teacher-intro.mp4';
        $certPath = 'certificates/cert-doc.pdf';

        Storage::disk('public')->put($avatarPath, 'avatar-data');
        Storage::disk('public')->put($videoPath, 'video-data');
        Storage::disk('public')->put($certPath, 'cert-data');

        $user = User::factory()->create([
            'role' => 'teacher',
            'avatar' => Storage::disk('public')->url($avatarPath),
        ]);

        TeacherProfile::create([
            'user_id' => $user->id,
            'intro_video_url' => Storage::disk('public')->url($videoPath),
            'certificates' => [
                [
                    'type' => 'ielts',
                    'title' => 'IELTS',
                    'file_url' => Storage::disk('public')->url($certPath),
                    'file_name' => 'cert-doc.pdf',
                    'status' => 'verified',
                ],
            ],
        ]);

        $response = $this->actingAs($user)->delete(route('profile.destroy'), [
            'password' => 'password',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect('/');

        Storage::disk('public')->assertMissing($avatarPath);
        Storage::disk('public')->assertMissing($videoPath);
        Storage::disk('public')->assertMissing($certPath);
    }

    public function test_failed_video_upload_due_to_php_ini_size_returns_validation_error(): void
    {
        Storage::fake('public');

        $user = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $user->id,
        ]);

        $tempFile = tempnam(sys_get_temp_dir(), 'test_vid_');
        file_put_contents($tempFile, 'fake-data');

        $failedUpload = new UploadedFile(
            $tempFile,
            'too-large-video.mp4',
            'video/mp4',
            UPLOAD_ERR_INI_SIZE,
            true
        );

        $response = $this->actingAs($user)->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'intro_video' => $failedUpload,
        ]);

        $response->assertSessionHasErrors('intro_video');
    }

    public function test_interrupted_video_upload_returns_validation_error(): void
    {
        Storage::fake('public');

        $user = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $user->id,
        ]);

        $tempFile = tempnam(sys_get_temp_dir(), 'test_vid_');
        file_put_contents($tempFile, 'fake-data');

        $failedUpload = new UploadedFile(
            $tempFile,
            'partial-video.mp4',
            'video/mp4',
            UPLOAD_ERR_PARTIAL,
            true
        );

        $response = $this->actingAs($user)->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'intro_video' => $failedUpload,
        ]);

        $response->assertSessionHasErrors('intro_video');
    }
}
