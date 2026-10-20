<?php

namespace App\Console\Commands;

use App\Models\TeacherProfile;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class RebindCertificatesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'certificates:rebind
        {--dry-run : Preview matches without modifying the database}
        {--force : Apply changes without interactive confirmation}
        {--teacher= : Filter by teacher email, full name, or user/profile UUID}
        {--file= : Explicitly assign a specific storage file path (requires --teacher)}
        {--window=168 : Maximum time difference in hours between file upload timestamp and profile timestamp (default: 7 days)}
        {--disk= : Filesystem disk to use (defaults to default disk)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Rebind orphaned certificate files from storage to teacher profiles';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $disk = $this->option('disk') ?: config('filesystems.default', 'public');
        $isDryRun = (bool) $this->option('dry-run');
        $isForce = (bool) $this->option('force');
        $teacherFilter = $this->option('teacher');
        $specificFile = $this->option('file');
        $windowHours = (int) $this->option('window');
        $windowSeconds = max(1, $windowHours) * 3600;

        if ($specificFile && ! $teacherFilter) {
            $this->error('The [--file] option requires [--teacher] to identify the recipient teacher.');

            return self::FAILURE;
        }

        $diskInstance = Storage::disk($disk);

        if ($specificFile && ! $diskInstance->exists($specificFile)) {
            $this->error("File [{$specificFile}] does not exist on disk [{$disk}].");

            return self::FAILURE;
        }

        $this->info("Scanning storage disk [{$disk}] for certificate files...");

        $availableFiles = [];
        if ($specificFile) {
            $availableFiles[] = [
                'path' => $specificFile,
                'filename' => basename($specificFile),
                'timestamp' => $diskInstance->lastModified($specificFile),
            ];
        } else {
            try {
                $items = $diskInstance->listContents('certificates');
                foreach ($items as $item) {
                    if ($item->isFile()) {
                        $availableFiles[] = [
                            'path' => $item->path(),
                            'filename' => basename($item->path()),
                            'timestamp' => $item->lastModified(),
                        ];
                    }
                }
            } catch (\Throwable $e) {
                $this->error("Failed to read certificates directory on disk [{$disk}]: {$e->getMessage()}");

                return self::FAILURE;
            }

            if (empty($availableFiles)) {
                $this->warn("No files found in directory [certificates/] on disk [{$disk}].");

                return self::SUCCESS;
            }
        }

        $totalStorageFilesCount = count($availableFiles);

        // Map all existing file URLs / paths in database to avoid re-assigning already bound files
        $alreadyBoundFiles = [];
        $allProfiles = TeacherProfile::with('user')->get();
        $profilesWithFilesCount = 0;
        $profilesWithMissingUrlCount = 0;
        $profilesWithEmptyCertsCount = 0;

        foreach ($allProfiles as $prof) {
            $certs = $prof->certificates;
            if (! is_array($certs) || empty($certs)) {
                $profilesWithEmptyCertsCount++;

                continue;
            }

            $hasFile = false;
            $hasMissing = false;
            foreach ($certs as $c) {
                if (! empty($c['file_url']) && $c['file_url'] !== 'null') {
                    $hasFile = true;
                    $parsedPath = parse_url($c['file_url'], PHP_URL_PATH) ?? '';
                    $alreadyBoundFiles[basename($parsedPath)] = true;
                } else {
                    $hasMissing = true;
                }
                if (! empty($c['file_name'])) {
                    $alreadyBoundFiles[$c['file_name']] = true;
                }
            }

            if ($hasFile) {
                $profilesWithFilesCount++;
            }
            if ($hasMissing) {
                $profilesWithMissingUrlCount++;
            }
        }

        if (! $specificFile) {
            $availableFiles = array_values(array_filter($availableFiles, function ($f) use ($alreadyBoundFiles) {
                return ! isset($alreadyBoundFiles[$f['filename']]);
            }));
        }

        $totalProfilesCount = $allProfiles->count();
        $this->info("Database Teachers: {$totalProfilesCount} total ({$profilesWithFilesCount} already have files, {$profilesWithMissingUrlCount} missing file URLs, {$profilesWithEmptyCertsCount} uninitialized).");
        $this->line("Storage: {$totalStorageFilesCount} files in certificates/ (".count($alreadyBoundFiles).' bound, '.count($availableFiles).' unassigned).');

        // Query candidate teacher profiles
        $query = TeacherProfile::with('user');
        if ($teacherFilter) {
            $query->where(function ($q) use ($teacherFilter) {
                if (Str::isUuid($teacherFilter)) {
                    $q->where('id', $teacherFilter)
                        ->orWhere('user_id', $teacherFilter);
                } else {
                    $q->whereHas('user', function ($uq) use ($teacherFilter) {
                        $uq->where('email', $teacherFilter)
                            ->orWhere('full_name', 'like', "%{$teacherFilter}%");
                    });
                }
            });
        }

        $profiles = $query->get()->sortBy(fn ($p) => $p->created_at?->timestamp ?? 0);

        if ($profiles->isEmpty()) {
            $this->warn('No teacher profiles found matching the search criteria.');

            return self::SUCCESS;
        }

        $matches = [];
        $profileUpdates = [];

        foreach ($profiles as $profile) {
            $certs = $profile->certificates;

            $hadNoCerts = false;
            if (! is_array($certs) || empty($certs)) {
                $hadNoCerts = true;
                $certs = [[
                    'type' => 'ielts',
                    'title' => 'Certificate',
                    'overall' => $profile->overall_level ?: null,
                    'speaking' => $profile->speaking_band ?: null,
                    'verified' => (bool) $profile->is_verified,
                    'status' => $profile->is_verified ? 'verified' : 'pending',
                    'file_url' => null,
                    'file_name' => null,
                ]];
            }

            $updatedCerts = $certs;
            $profileChanged = false;

            foreach ($updatedCerts as $index => $cert) {
                if (! empty($cert['file_url']) && $cert['file_url'] !== 'null') {
                    continue;
                }

                if (empty($availableFiles)) {
                    break;
                }

                if ($specificFile) {
                    $bestIndex = 0;
                    $bestDelta = 0;
                    $matched = $availableFiles[0];
                } else {
                    $profileCreatedAt = $profile->created_at?->timestamp ?? $profile->user?->created_at?->timestamp;
                    $profileUpdatedAt = $profile->updated_at?->timestamp;

                    $bestIndex = null;
                    $bestDelta = PHP_INT_MAX;

                    foreach ($availableFiles as $fIndex => $file) {
                        $fileTs = $file['timestamp'] ?? null;
                        if (! $fileTs) {
                            continue;
                        }

                        $deltaCreated = $profileCreatedAt ? abs($fileTs - $profileCreatedAt) : PHP_INT_MAX;
                        $deltaUpdated = $profileUpdatedAt ? abs($fileTs - $profileUpdatedAt) : PHP_INT_MAX;
                        $delta = min($deltaCreated, $deltaUpdated);

                        if ($delta <= $windowSeconds && $delta < $bestDelta) {
                            $bestDelta = $delta;
                            $bestIndex = $fIndex;
                        }
                    }

                    if ($bestIndex === null) {
                        continue;
                    }

                    $matched = $availableFiles[$bestIndex];
                }

                $matchedUrl = $diskInstance->url($matched['path']);
                $matchedName = $matched['filename'];

                $updatedCerts[$index]['file_url'] = $matchedUrl;
                if (empty($updatedCerts[$index]['file_name'])) {
                    $updatedCerts[$index]['file_name'] = $matchedName;
                }

                $profileChanged = true;

                $refTimestamp = $profile->created_at?->timestamp ?? $profile->updated_at?->timestamp;

                $matches[] = [
                    'teacher' => $profile->user?->full_name ?? 'N/A',
                    'email' => $profile->user?->email ?? 'N/A',
                    'title' => $cert['title'] ?? ($cert['type'] ? strtoupper($cert['type']) : 'Certificate'),
                    'file' => $matched['path'],
                    'file_time' => isset($matched['timestamp']) ? date('Y-m-d H:i:s', $matched['timestamp']) : 'N/A',
                    'profile_time' => $refTimestamp ? date('Y-m-d H:i:s', $refTimestamp) : 'N/A',
                    'delta' => $this->formatDelta($bestDelta),
                ];

                array_splice($availableFiles, $bestIndex, 1);
            }

            if ($profileChanged) {
                $profileUpdates[$profile->id] = [
                    'profile' => $profile,
                    'certificates' => $updatedCerts,
                ];
            }
        }

        if (empty($matches)) {
            $this->info("No unbound certificates could be matched within the {$windowHours}h window.");
            $this->line('Tip: Try widening the search window with [--window=168] or assign directly with [--file=path/to/cert.pdf --teacher=email].');

            return self::SUCCESS;
        }

        $tableRows = [];
        foreach ($matches as $m) {
            $tableRows[] = [
                $m['teacher'],
                $m['email'],
                $m['title'],
                $m['file'],
                $m['file_time'],
                $m['profile_time'],
                $m['delta'],
                $isDryRun ? 'Preview (Dry Run)' : 'Ready to Rebind',
            ];
        }

        $this->table(
            ['Teacher', 'Email', 'Cert Title', 'File', 'File Uploaded', 'Profile Date', 'Delta', 'Status'],
            $tableRows
        );

        $matchedCount = count($matches);
        $profileCount = count($profileUpdates);

        if ($isDryRun) {
            $this->info("[DRY RUN] Matched {$matchedCount} certificate(s) across {$profileCount} teacher profile(s).");
            $this->line('No changes were made to the database. Run without --dry-run to apply.');

            return self::SUCCESS;
        }

        if (! $isForce) {
            if (! $this->confirm("Apply {$matchedCount} certificate rebind(s) to the database?", true)) {
                $this->warn('Rebind aborted by user.');

                return self::SUCCESS;
            }
        }

        DB::transaction(function () use ($profileUpdates) {
            foreach ($profileUpdates as $update) {
                $update['profile']->update([
                    'certificates' => $update['certificates'],
                ]);
            }
        });

        $this->info("Successfully rebound {$matchedCount} certificate(s) across {$profileCount} teacher profile(s)!");

        return self::SUCCESS;
    }

    /**
     * Format delta in human-readable notation.
     */
    private function formatDelta(int $seconds): string
    {
        if ($seconds < 60) {
            return "{$seconds}s";
        }

        $minutes = (int) round($seconds / 60);
        if ($minutes < 60) {
            return "{$minutes}m";
        }

        $hours = (int) floor($minutes / 60);
        $remMinutes = $minutes % 60;
        if ($hours < 24) {
            return "{$hours}h {$remMinutes}m";
        }

        $days = (int) floor($hours / 24);
        $remHours = $hours % 24;

        return "{$days}d {$remHours}h";
    }
}
