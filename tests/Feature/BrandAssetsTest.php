<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BrandAssetsTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_brand_favicon_and_logo_assets_exist_and_legacy_assets_are_preserved(): void
    {
        $newFiles = [
            public_path('favicon.ico'),
            public_path('favicon-nz.ico'),
            public_path('favicon-nz.png'),
            public_path('images/logo-nz.png'),
            public_path('apple-touch-icon-nz.png'),
            resource_path('images/logo-nz.png'),
            resource_path('images/logo-nz-rays.png'),
        ];

        foreach ($newFiles as $path) {
            $this->assertFileExists($path);
            $this->assertGreaterThan(0, filesize($path));
        }

        $legacyFiles = [
            public_path('favicon-legacy.ico'),
            public_path('favicon.svg'),
            public_path('favicon.png'),
            public_path('images/logo.png'),
            resource_path('images/logo.png'),
        ];

        foreach ($legacyFiles as $path) {
            $this->assertFileExists($path);
            $this->assertGreaterThan(0, filesize($path));
        }
    }

    public function test_root_html_renders_new_cache_busted_favicon_links(): void
    {
        $response = $this->get('/');

        $response->assertOk();
        $response->assertSee('/favicon-nz.ico?v=6', false);
        $response->assertSee('/favicon-nz.png?v=6', false);
        $response->assertSee('/images/logo-nz.png?v=6', false);
        $response->assertSee('/apple-touch-icon-nz.png?v=6', false);
        $response->assertDontSee('/favicon.svg?v=3', false);
    }
}
