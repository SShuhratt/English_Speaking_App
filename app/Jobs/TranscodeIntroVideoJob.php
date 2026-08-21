<?php

namespace App\Jobs;

use App\Models\TeacherProfile;
use App\Services\FileStorageService;
use App\Services\VideoTranscodingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class TranscodeIntroVideoJob implements ShouldQueue
{
    use Queueable;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 2;

    /**
     * The number of seconds the job can run before timing out.
     */
    public int $timeout = 300;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int|string $teacherProfileId,
        public string $localTmpPath,
        public ?string $targetDisk = null,
        public ?string $oldVideoUrl = null
    ) {
        $this->targetDisk = $targetDisk ?: config('filesystems.default', 'public');
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $profile = TeacherProfile::find($this->teacherProfileId);
        if (! $profile) {
            return;
        }

        $targetDisk = $this->targetDisk ?: config('filesystems.default', 'public');

        if (! Storage::disk('local')->exists($this->localTmpPath)) {
            Log::warning('TranscodeIntroVideoJob: Local temporary video not found: '.$this->localTmpPath);

            return;
        }

        $fullLocalPath = Storage::disk('local')->path($this->localTmpPath);
        $tempOutput = tempnam(sys_get_temp_dir(), 'opt_vid_').'.mp4';
        $uploadedCloudPath = null;

        try {
            $newUrl = null;

            // If FFmpeg is available, transcode to universal H.264 MP4 with web streaming flags
            if (VideoTranscodingService::isFFmpegAvailable()) {
                $success = VideoTranscodingService::transcodeToH264($fullLocalPath, $tempOutput);

                if ($success && file_exists($tempOutput) && filesize($tempOutput) > 0) {
                    $cloudFileName = 'videos/'.Str::random(40).'.mp4';
                    $outputStream = fopen($tempOutput, 'r');
                    Storage::disk($targetDisk)->put($cloudFileName, $outputStream);
                    if (is_resource($outputStream)) {
                        fclose($outputStream);
                    }

                    $uploadedCloudPath = $cloudFileName;
                    $newUrl = Storage::disk($targetDisk)->url($cloudFileName);
                }
            }

            // Fallback: upload raw local video if FFmpeg is unavailable or transcode failed
            if (! $newUrl) {
                $ext = pathinfo($this->localTmpPath, PATHINFO_EXTENSION) ?: 'mp4';
                $cloudFileName = 'videos/'.Str::random(40).'.'.$ext;
                $inputStream = fopen($fullLocalPath, 'r');
                Storage::disk($targetDisk)->put($cloudFileName, $inputStream);
                if (is_resource($inputStream)) {
                    fclose($inputStream);
                }

                $uploadedCloudPath = $cloudFileName;
                $newUrl = Storage::disk($targetDisk)->url($cloudFileName);
            }

            if ($newUrl) {
                // Delete previous video from cloud storage now that the new one is ready
                if ($this->oldVideoUrl) {
                    FileStorageService::deleteFromUrl($this->oldVideoUrl);
                }

                // Update teacher profile with the new cloud URL
                $profile->update([
                    'intro_video_url' => $newUrl,
                ]);
            }
        } catch (Throwable $e) {
            Log::error('TranscodeIntroVideoJob encountered an error while processing video: '.$this->localTmpPath, [
                'error' => $e->getMessage(),
            ]);

            // Clean up cloud file if database update failed
            if ($uploadedCloudPath && Storage::disk($targetDisk)->exists($uploadedCloudPath)) {
                Storage::disk($targetDisk)->delete($uploadedCloudPath);
            }
        } finally {
            // Always clean up local temporary files from VPS disk
            if (Storage::disk('local')->exists($this->localTmpPath)) {
                Storage::disk('local')->delete($this->localTmpPath);
            }
            if (file_exists($tempOutput)) {
                @unlink($tempOutput);
            }
        }
    }
}
