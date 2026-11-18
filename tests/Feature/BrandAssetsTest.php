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
            public_path('favicon-nz-48.png'),
            public_path('favicon-nz-96.png'),
            public_path('favicon-nz.png'),
            public_path('favicon.png'),
            public_path('images/logo-nz.png'),
            public_path('images/logo.png'),
            public_path('logo.png'),
            public_path('apple-touch-icon-nz.png'),
            public_path('apple-touch-icon.png'),
            resource_path('images/logo-nz.png'),
            resource_path('images/logo-nz-rays.png'),
        ];

        foreach ($newFiles as $path) {
            $this->assertFileExists($path);
            $this->assertGreaterThan(0, filesize($path));
        }

        $this->assertFileDoesNotExist(public_path('favicon.svg'));

        $legacyFiles = [
            public_path('legacy-brand/favicon.ico'),
            public_path('legacy-brand/favicon.svg'),
            public_path('legacy-brand/favicon.png'),
            public_path('legacy-brand/apple-touch-icon.png'),
            public_path('legacy-brand/images-logo.png'),
            public_path('legacy-brand/logo.png'),
            resource_path('images/logo.png'),
        ];

        foreach ($legacyFiles as $path) {
            $this->assertFileExists($path);
            $this->assertGreaterThan(0, filesize($path));
        }
    }

    public function test_root_html_renders_valid_json_ld_and_google_search_favicon_links(): void
    {
        $response = $this->get('/');

        $response->assertOk();
        $response->assertSee('/favicon-nz-48.png?v=7', false);
        $response->assertSee('/favicon-nz-96.png?v=7', false);
        $response->assertSee('/images/logo-nz.png?v=7', false);
        $response->assertSee('/favicon-nz.ico?v=7', false);
        $response->assertSee('/apple-touch-icon-nz.png?v=7', false);
        $response->assertSee('https://convomate.uz/images/logo-nz.png?v=7', false);
        $response->assertDontSee('/favicon.svg', false);

        $html = $response->getContent();
        $this->assertSame(
            1,
            preg_match('/<script type="application\/ld\+json">\s*(\{.*?\})\s*<\/script>/s', $html, $matches),
        );

        $decoded = json_decode($matches[1], true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame('https://schema.org', $decoded['@context'] ?? null);
        $this->assertSame('WebApplication', $decoded['@type'] ?? null);
        $this->assertSame('https://convomate.uz/images/logo-nz.png?v=7', $decoded['publisher']['logo'] ?? null);
    }
}
