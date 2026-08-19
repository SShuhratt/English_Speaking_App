<?php

namespace App\Jobs;

use App\Models\TeacherProfile;
use App\Services\VideoTranscodingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
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
    public int $timeout = 240;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int|string $teacherProfileId,
        public string $rawStoragePath,
        public ?string $disk = null
    ) {
        $this->disk = $disk ?: config('filesystems.default', 'public');
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

        $disk = $this->disk ?: config('filesystems.default', 'public');

        if (! Storage::disk($disk)->exists($this->rawStoragePath)) {
            Log::warning('TranscodeIntroVideoJob: Raw video file not found in storage: '.$this->rawStoragePath);

            return;
        }

        // If FFmpeg is not installed on the system, gracefully keep the raw video
        if (! VideoTranscodingService::isFFmpegAvailable()) {
            Log::info('FFmpeg binary not available on system, keeping raw video: '.$this->rawStoragePath);

            return;
        }

        $tempInput = tempnam(sys_get_temp_dir(), 'in_vid_');
        $tempOutput = tempnam(sys_get_temp_dir(), 'out_vid_').'.mp4';

        try {
            // Stream raw video from storage to local temp file
            $inputStream = Storage::disk($disk)->readStream($this->rawStoragePath);
            if ($inputStream) {
                file_put_contents($tempInput, stream_get_contents($inputStream));
                if (is_resource($inputStream)) {
                    fclose($inputStream);
                }
            } else {
                $content = Storage::disk($disk)->get($this->rawStoragePath);
                file_put_contents($tempInput, $content);
            }

            $success = VideoTranscodingService::transcodeToH264($tempInput, $tempOutput);

            if ($success && file_exists($tempOutput) && filesize($tempOutput) > 0) {
                $optimizedPath = 'videos/'.pathinfo($this->rawStoragePath, PATHINFO_FILENAME).'-h264.mp4';

                // Save optimized MP4 to storage
                $outputStream = fopen($tempOutput, 'r');
                Storage::disk($disk)->put($optimizedPath, $outputStream);
                if (is_resource($outputStream)) {
                    fclose($outputStream);
                }

                $newUrl = Storage::disk($disk)->url($optimizedPath);

                // If optimized file path is different, remove the raw temporary file
                if ($optimizedPath !== $this->rawStoragePath) {
                    Storage::disk($disk)->delete($this->rawStoragePath);
                }

                // Check if the teacher profile is still pointing to the raw video before updating
                $currentUrl = $profile->fresh()?->intro_video_url;
                $rawUrl = Storage::disk($disk)->url($this->rawStoragePath);

                if (! $currentUrl || $currentUrl === $rawUrl || str_contains($currentUrl, pathinfo($this->rawStoragePath, PATHINFO_FILENAME))) {
                    $profile->update([
                        'intro_video_url' => $newUrl,
                    ]);
                }
            }
        } catch (Throwable $e) {
            Log::warning('TranscodeIntroVideoJob failed to transcode video: '.$this->rawStoragePath, [
                'error' => $e->getMessage(),
            ]);
        } finally {
            if (file_exists($tempInput)) {
                @unlink($tempInput);
            }
            if (file_exists($tempOutput)) {
                @unlink($tempOutput);
            }
        }
    }
}
