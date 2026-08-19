<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class FileStorageService
{
    /**
     * Safely delete a file from storage given its URL or relative path.
     */
    public static function deleteFromUrl(?string $url): bool
    {
        if (empty($url) || ! is_string($url)) {
            return false;
        }

        $relativePath = self::extractStoragePath($url);
        if (! $relativePath) {
            return false;
        }

        $disk = config('filesystems.default', env('FILESYSTEM_DISK', 'public'));

        try {
            if (Storage::disk($disk)->exists($relativePath)) {
                return Storage::disk($disk)->delete($relativePath);
            }

            // Fallback check on 'public' disk if default was different
            if ($disk !== 'public' && Storage::disk('public')->exists($relativePath)) {
                return Storage::disk('public')->delete($relativePath);
            }
        } catch (Throwable $e) {
            Log::warning('Failed to delete file from storage: '.$relativePath, [
                'url' => $url,
                'disk' => $disk,
                'error' => $e->getMessage(),
            ]);
        }

        return false;
    }

    /**
     * Delete all uploaded storage files associated with a user.
     */
    public static function deleteUserFiles(User $user): void
    {
        try {
            // Delete avatar
            if ($user->avatar) {
                self::deleteFromUrl($user->avatar);
            }

            // Delete teacher files
            if ($user->relationLoaded('teacherProfile') ? $user->teacherProfile : $user->teacherProfile()->first()) {
                $profile = $user->relationLoaded('teacherProfile') ? $user->teacherProfile : $user->teacherProfile()->first();

                if ($profile->intro_video_url) {
                    self::deleteFromUrl($profile->intro_video_url);
                }

                $certs = $profile->certificates ?? [];
                if (is_string($certs)) {
                    $certs = json_decode($certs, true) ?? [];
                }
                if (is_array($certs)) {
                    foreach ($certs as $cert) {
                        if (is_array($cert) && ! empty($cert['file_url'])) {
                            self::deleteFromUrl($cert['file_url']);
                        }
                    }
                }
            }

            // Delete pupil files
            if ($user->relationLoaded('pupilProfile') ? $user->pupilProfile : $user->pupilProfile()->first()) {
                $profile = $user->relationLoaded('pupilProfile') ? $user->pupilProfile : $user->pupilProfile()->first();

                $certs = $profile->certificates ?? [];
                if (is_string($certs)) {
                    $certs = json_decode($certs, true) ?? [];
                }
                if (is_array($certs)) {
                    foreach ($certs as $cert) {
                        if (is_array($cert) && ! empty($cert['file_url'])) {
                            self::deleteFromUrl($cert['file_url']);
                        }
                    }
                }
            }
        } catch (Throwable $e) {
            Log::warning('Error cleaning up user files for user ID: '.$user->id, [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Extract the relative storage path (e.g. 'videos/xxx.mp4', 'certificates/xxx.pdf', 'avatars/xxx.png') from a URL.
     */
    public static function extractStoragePath(string $url): ?string
    {
        $parsedPath = parse_url($url, PHP_URL_PATH);
        if (! $parsedPath) {
            $parsedPath = $url;
        }

        // Check for recognized upload directories
        $directories = ['videos', 'certificates', 'avatars'];

        foreach ($directories as $dir) {
            $pattern = '#(?:/|^)('.preg_quote($dir, '#').'/[^?\#]+)#';
            if (preg_match($pattern, $parsedPath, $matches)) {
                return ltrim($matches[1], '/');
            }
        }

        return null;
    }
}
