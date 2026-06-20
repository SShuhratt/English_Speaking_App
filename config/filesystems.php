<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => rtrim(env('APP_URL', 'http://localhost'), '/').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

        'gcs' => [
            'driver' => 'gcs',
            'project_id' => env('GOOGLE_CLOUD_PROJECT_ID', env('GCP_PROJECT_ID')),
            'key_file_path' => (function() {
                $key = env('GOOGLE_CLOUD_KEY_FILE', env('GCP_KEY_FILE'));
                if (is_string($key) && !str_starts_with(trim($key), '{') && !str_contains($key, '"') && !str_contains($key, ':')) {
                    $key = trim($key);
                    return str_starts_with($key, '/') ? $key : base_path($key);
                }
                return null;
            })(),
            'key_file' => (function() {
                $key = env('GOOGLE_CLOUD_KEY_FILE', env('GCP_KEY_FILE'));
                if (is_string($key)) {
                    $trimmed = trim($key);
                    if (str_starts_with($trimmed, '{')) {
                        return json_decode($trimmed, true);
                    }
                    if (base64_encode(base64_decode($trimmed, true)) === $trimmed) {
                        $decoded = base64_decode($trimmed);
                        if (str_starts_with(trim($decoded), '{')) {
                            return json_decode($decoded, true);
                        }
                    }
                }
                return is_array($key) ? $key : null;
            })(),
            'bucket' => env('GOOGLE_CLOUD_STORAGE_BUCKET', env('GCP_STORAGE_BUCKET')),
            'path_prefix' => env('GOOGLE_CLOUD_STORAGE_PATH_PREFIX', env('GCP_PATH_PREFIX', '')),
            'storage_api_uri' => env('GOOGLE_CLOUD_STORAGE_API_URI', env('GCP_STORAGE_API_URI')),
            'visibility' => 'public',
            'throw' => true,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
