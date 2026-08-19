<?php

namespace Tests\Feature\Settings;

use App\Jobs\TranscodeIntroVideoJob;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class VideoTranscodingJobTest extends TestCase
{
    use RefreshDatabase;

    public function test_uploading_intro_video_dispatches_transcoding_job(): void
    {
        Queue::fake();
        Storage::fake('public');

        $user = User::factory()->create(['role' => 'teacher']);
        TeacherProfile::create([
            'user_id' => $user->id,
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
                && str_starts_with($job->rawStoragePath, 'videos/');
        });
    }

    public function test_transcode_job_handles_missing_file_gracefully(): void
    {
        Storage::fake('public');

        $user = User::factory()->create(['role' => 'teacher']);
        $profile = TeacherProfile::create([
            'user_id' => $user->id,
            'intro_video_url' => 'http://localhost/storage/videos/missing.mp4',
        ]);

        $job = new TranscodeIntroVideoJob($profile->id, 'videos/missing.mp4', 'public');
        $job->handle();

        // Profile remains unchanged without exceptions
        $this->assertEquals('http://localhost/storage/videos/missing.mp4', $profile->fresh()->intro_video_url);
    }
}
