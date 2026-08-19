<?php

namespace Tests\Unit\Services;

use App\Services\VideoTranscodingService;
use Tests\TestCase;

class VideoTranscodingServiceTest extends TestCase
{
    public function test_is_ffmpeg_available_returns_boolean(): void
    {
        $result = VideoTranscodingService::isFFmpegAvailable();
        $this->assertIsBool($result);
    }

    public function test_probe_video_returns_null_for_non_existent_file(): void
    {
        $result = VideoTranscodingService::probeVideo('/path/to/non_existent_video.mp4');
        $this->assertNull($result);
    }

    public function test_transcode_to_h264_returns_false_for_non_existent_file(): void
    {
        $result = VideoTranscodingService::transcodeToH264(
            '/path/to/non_existent_input.mov',
            '/path/to/non_existent_output.mp4'
        );
        $this->assertFalse($result);
    }
}
