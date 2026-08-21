<?php

namespace Tests\Feature\Settings;

use App\Jobs\TranscodeIntroVideoJob;
use App\Models\PupilProfile;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class VideoTranscodingJobTest extends TestCase
{
    use RefreshDatabase;

    public function test_uploading_mov_video_buffers_locally_and_dispatches_transcoding_job(): void
    {
        Queue::fake();
        Storage::fake('local');
        Storage::fake('public');

        $user = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $user->id,
            'intro_video_url' => 'https://storage.googleapis.com/test-bucket/videos/old_video.mp4',
        ]);

        $video = UploadedFile::fake()->create('iphone_intro.mov', 1000, 'video/quicktime');

        $response = $this->actingAs($user)->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'intro_video' => $video,
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(route('profile.edit'));

        Queue::assertPushed(TranscodeIntroVideoJob::class, function ($job) use ($user) {
            return $job->teacherProfileId === $user->fresh()->teacherProfile->id
                && str_starts_with($job->localTmpPath, 'tmp_videos/')
                && $job->oldVideoUrl === 'https://storage.googleapis.com/test-bucket/videos/old_video.mp4';
        });
    }

    public function test_uploading_webm_video_buffers_locally_and_dispatches_transcoding_job(): void
    {
        Queue::fake();
        Storage::fake('local');
        Storage::fake('public');

        $user = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create(['user_id' => $user->id]);

        $video = UploadedFile::fake()->create('intro.webm', 2000, 'video/webm');

        $response = $this->actingAs($user)->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'intro_video' => $video,
        ]);

        $response->assertSessionHasNoErrors();
        Queue::assertPushed(TranscodeIntroVideoJob::class);
    }

    public function test_uploading_mp4_video_buffers_locally_and_dispatches_transcoding_job(): void
    {
        Queue::fake();
        Storage::fake('local');
        Storage::fake('public');

        $user = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create(['user_id' => $user->id]);

        $video = UploadedFile::fake()->create('intro.mp4', 30000, 'video/mp4'); // 30 MB

        $response = $this->actingAs($user)->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'intro_video' => $video,
        ]);

        $response->assertSessionHasNoErrors();
        Queue::assertPushed(TranscodeIntroVideoJob::class);
    }

    public function test_uploading_invalid_file_type_fails_validation(): void
    {
        Storage::fake('local');
        Storage::fake('public');

        $user = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create(['user_id' => $user->id]);

        $invalidFile = UploadedFile::fake()->create('document.pdf', 1000, 'application/pdf');

        $response = $this->actingAs($user)->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'intro_video' => $invalidFile,
        ]);

        $response->assertSessionHasErrors('intro_video');
    }

    public function test_uploading_video_exceeding_100mb_fails_validation(): void
    {
        Storage::fake('local');
        Storage::fake('public');

        $user = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create(['user_id' => $user->id]);

        $largeVideo = UploadedFile::fake()->create('huge_intro.mp4', 105000, 'video/mp4'); // 105 MB

        $response = $this->actingAs($user)->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'intro_video' => $largeVideo,
        ]);

        $response->assertSessionHasErrors('intro_video');
    }

    public function test_updating_profile_without_video_preserves_existing_video(): void
    {
        Storage::fake('public');

        $user = User::factory()->create(['role' => 'teacher']);
        $profile = TeacherProfile::create([
            'user_id' => $user->id,
            'intro_video_url' => 'https://storage.googleapis.com/test-bucket/videos/existing_video.mp4',
            'headline' => 'Initial Headline',
        ]);

        $response = $this->actingAs($user)->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'headline' => 'Updated Headline',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertEquals('https://storage.googleapis.com/test-bucket/videos/existing_video.mp4', $profile->fresh()->intro_video_url);
        $this->assertEquals('Updated Headline', $profile->fresh()->headline);
    }

    public function test_transcode_job_handles_missing_file_gracefully(): void
    {
        Storage::fake('local');
        Storage::fake('public');

        $user = User::factory()->create(['role' => 'teacher']);
        $profile = TeacherProfile::create([
            'user_id' => $user->id,
            'intro_video_url' => 'http://localhost/storage/videos/existing.mp4',
        ]);

        $job = new TranscodeIntroVideoJob($profile->id, 'tmp_videos/missing.mp4', 'public', $profile->intro_video_url);
        $job->handle();

        // Profile remains unchanged without exceptions
        $this->assertEquals('http://localhost/storage/videos/existing.mp4', $profile->fresh()->intro_video_url);
    }

    public function test_transcode_job_handles_deleted_profile_gracefully(): void
    {
        Storage::fake('local');
        Storage::fake('public');

        // Place a mock file in fake local disk
        Storage::disk('local')->put('tmp_videos/sample_upload.mp4', 'fake video data');

        $job = new TranscodeIntroVideoJob((string) Str::uuid(), 'tmp_videos/sample_upload.mp4', 'public', null);
        $job->handle();

        // Job exits safely without throwing exceptions
        $this->assertTrue(true);
    }

    public function test_transcode_job_uploads_to_target_cloud_disk_and_cleans_up_local_temp(): void
    {
        Storage::fake('local');
        Storage::fake('public');

        $oldVideoPath = 'videos/old_to_delete.mp4';
        Storage::disk('public')->put($oldVideoPath, 'old content');
        $oldVideoUrl = Storage::disk('public')->url($oldVideoPath);

        $user = User::factory()->create(['role' => 'teacher']);
        $profile = TeacherProfile::create([
            'user_id' => $user->id,
            'intro_video_url' => $oldVideoUrl,
        ]);

        // Place a mock file in fake local disk
        Storage::disk('local')->put('tmp_videos/sample_upload.mp4', 'fake video stream data');

        $job = new TranscodeIntroVideoJob($profile->id, 'tmp_videos/sample_upload.mp4', 'public', $oldVideoUrl);
        $job->handle();

        // Target cloud disk now contains the uploaded video
        $profile->refresh();
        $this->assertNotNull($profile->intro_video_url);
        $this->assertStringContainsString('videos/', $profile->intro_video_url);

        // Old video is removed from cloud disk
        Storage::disk('public')->assertMissing($oldVideoPath);

        // Local temporary file is deleted from local disk
        $this->assertFalse(Storage::disk('local')->exists('tmp_videos/sample_upload.mp4'));
    }

    public function test_pupil_updating_profile_ignores_intro_video(): void
    {
        Storage::fake('local');
        Storage::fake('public');

        $user = User::factory()->create(['role' => 'pupil']);
        PupilProfile::create([
            'user_id' => $user->id,
            'headline' => 'Pupil headline',
        ]);

        $video = UploadedFile::fake()->create('intro.mp4', 1000, 'video/mp4');

        $response = $this->actingAs($user)->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'headline' => 'Updated Pupil Headline',
            'intro_video' => $video,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertEquals('Updated Pupil Headline', $user->fresh()->pupilProfile->headline);
    }
}
