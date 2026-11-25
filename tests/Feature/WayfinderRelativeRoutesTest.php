<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use Tests\TestCase;

class WayfinderRelativeRoutesTest extends TestCase
{
    public function test_wayfinder_cli_generates_relative_urls_even_when_app_url_is_forced(): void
    {
        $tempDir = sys_get_temp_dir().'/wf_rel_test_'.uniqid();
        File::makeDirectory($tempDir, 0755, true);

        try {
            $result = Process::env(['APP_URL' => 'http://localhost:8080'])
                ->run([
                    PHP_BINARY,
                    base_path('artisan'),
                    'wayfinder:generate',
                    '--with-form',
                    '--path='.$tempDir,
                ]);

            $this->assertTrue($result->successful(), $result->errorOutput());

            $registerRouteFile = $tempDir.'/routes/register/index.ts';
            $this->assertFileExists($registerRouteFile);

            $contents = File::get($registerRouteFile);
            $this->assertStringContainsString("url: '/register'", $contents);
            $this->assertStringNotContainsString('http://localhost:8080', $contents);
        } finally {
            File::deleteDirectory($tempDir);
        }
    }

    public function test_compiled_vite_assets_do_not_contain_localhost_8080_routes(): void
    {
        $files = File::glob(public_path('build/assets/*.js'));
        $this->assertNotEmpty($files);

        foreach ($files as $file) {
            $contents = File::get($file);
            $this->assertStringNotContainsString(
                'http://localhost:8080',
                $contents,
                "Hardcoded http://localhost:8080 found in built asset: {$file}"
            );
        }
    }
}
