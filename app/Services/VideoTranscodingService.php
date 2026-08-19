<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Throwable;

class VideoTranscodingService
{
    /**
     * Check if FFmpeg and FFprobe binaries are available in the system.
     */
    public static function isFFmpegAvailable(): bool
    {
        try {
            $result = Process::run(['ffmpeg', '-version']);

            return $result->successful();
        } catch (Throwable) {
            return false;
        }
    }

    /**
     * Probe video stream details (video codec, audio codec, resolution) using ffprobe.
     *
     * @return array{video_codec: ?string, audio_codec: ?string, width: ?int, height: ?int}|null
     */
    public static function probeVideo(string $filePath): ?array
    {
        try {
            $process = Process::run([
                'ffprobe',
                '-v', 'quiet',
                '-print_format', 'json',
                '-show_streams',
                $filePath,
            ]);

            if (! $process->successful()) {
                return null;
            }

            $data = json_decode($process->output(), true);
            if (! is_array($data) || empty($data['streams'])) {
                return null;
            }

            $videoCodec = null;
            $audioCodec = null;
            $width = null;
            $height = null;

            foreach ($data['streams'] as $stream) {
                if (($stream['codec_type'] ?? '') === 'video' && ! $videoCodec) {
                    $videoCodec = strtolower($stream['codec_name'] ?? '');
                    $width = isset($stream['width']) ? (int) $stream['width'] : null;
                    $height = isset($stream['height']) ? (int) $stream['height'] : null;
                } elseif (($stream['codec_type'] ?? '') === 'audio' && ! $audioCodec) {
                    $audioCodec = strtolower($stream['codec_name'] ?? '');
                }
            }

            return [
                'video_codec' => $videoCodec,
                'audio_codec' => $audioCodec,
                'width' => $width,
                'height' => $height,
            ];
        } catch (Throwable $e) {
            Log::warning('FFprobe failed to probe video: '.$filePath, [
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Transcode or optimize video to universal H.264 MP4 with web streaming flags.
     *
     * Strict VPS safeguards applied:
     * - Threads capped to 1 core (-threads 1)
     * - Fast encoding preset (-preset veryfast)
     * - Web streaming faststart (-movflags +faststart)
     * - Auto-downscales 4K videos to 1080p
     * - Passthrough copy when already H.264 + AAC
     */
    public static function transcodeToH264(string $inputPath, string $outputPath, int $timeoutSeconds = 180): bool
    {
        if (! file_exists($inputPath)) {
            return false;
        }

        $probe = self::probeVideo($inputPath);
        $videoCodec = $probe['video_codec'] ?? null;
        $audioCodec = $probe['audio_codec'] ?? null;

        // If already standard H.264 and AAC, run zero-CPU fast container repack
        if (in_array($videoCodec, ['h264', 'avc1'], true) && in_array($audioCodec, ['aac', 'mp3', null], true)) {
            $copyCommand = [
                'ffmpeg',
                '-y',
                '-i', $inputPath,
                '-c', 'copy',
                '-movflags', '+faststart',
                $outputPath,
            ];

            try {
                $process = Process::timeout($timeoutSeconds)->run($copyCommand);
                if ($process->successful() && file_exists($outputPath) && filesize($outputPath) > 0) {
                    return true;
                }
            } catch (Throwable $e) {
                Log::info('Fast copy failed, falling back to full H.264 encode: '.$e->getMessage());
            }
        }

        // Full H.264 conversion with single-thread and lightweight preset
        $encodeCommand = [
            'ffmpeg',
            '-y',
            '-threads', '1',
            '-i', $inputPath,
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-crf', '23',
            '-pix_fmt', 'yuv420p',
            '-vf', "scale='min(1920,iw)':-2",
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            $outputPath,
        ];

        try {
            $process = Process::timeout($timeoutSeconds)->run($encodeCommand);

            if ($process->successful() && file_exists($outputPath) && filesize($outputPath) > 0) {
                return true;
            }

            Log::warning('FFmpeg transcoding command failed', [
                'input' => $inputPath,
                'output' => $outputPath,
                'exit_code' => $process->exitCode(),
                'error' => $process->errorOutput(),
            ]);

            return false;
        } catch (Throwable $e) {
            Log::error('FFmpeg transcoding exception occurred', [
                'input' => $inputPath,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
