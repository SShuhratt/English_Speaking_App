<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use RuntimeException;
use Tests\TestCase;

class RegistrationPerformanceAndSafetyTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_registration_rejects_svg_certificate_uploads(): void
    {
        $disk = config('filesystems.default', 'public');
        Storage::fake($disk);

        $response = $this->post(route('register.store'), [
            'name' => 'Svg Teacher',
            'email' => 'svg_teacher@example.com',
            'password' => 'Password1',
            'password_confirmation' => 'Password1',
            'role' => 'teacher',
            'age' => 28,
            'phone_number' => '+998901234567',
            'certificates' => [
                [
                    'type' => 'ielts',
                    'language' => 'english',
                    'overall' => '8.0',
                    'speaking' => '8.0',
                    'file' => UploadedFile::fake()->create('malicious.svg', 10, 'image/svg+xml'),
                ],
            ],
        ]);

        $response->assertSessionHasErrors(['certificates.0.file']);
        $this->assertGuest();
        $this->assertSame([], Storage::disk($disk)->allFiles('certificates'));
    }

    public function test_pupil_registration_rejects_svg_certificate_uploads(): void
    {
        $disk = config('filesystems.default', 'public');
        Storage::fake($disk);

        $response = $this->post(route('register.store'), [
            'name' => 'Svg Pupil',
            'email' => 'svg_pupil@example.com',
            'password' => 'Password1',
            'password_confirmation' => 'Password1',
            'role' => 'pupil',
            'age' => 18,
            'phone_number' => '+998901234567',
            'level' => 'beginner',
            'ielts_certificates' => [
                UploadedFile::fake()->create('malicious.svg', 10, 'image/svg+xml'),
            ],
        ]);

        $response->assertSessionHasErrors(['ielts_certificates.0']);
        $this->assertGuest();
        $this->assertSame([], Storage::disk($disk)->allFiles('certificates'));
    }

    public function test_registration_cleans_up_uploaded_certificates_when_transaction_fails(): void
    {
        $disk = config('filesystems.default', 'public');
        Storage::fake($disk);

        User::creating(function (): void {
            throw new RuntimeException('Simulated DB transaction failure');
        });

        try {
            $response = $this->post(route('register.store'), [
                'name' => 'Rollback Teacher',
                'email' => 'rollback_teacher@example.com',
                'password' => 'Password1',
                'password_confirmation' => 'Password1',
                'role' => 'teacher',
                'age' => 28,
                'phone_number' => '+998901234567',
                'certificates' => [
                    [
                        'type' => 'ielts',
                        'language' => 'english',
                        'overall' => '8.0',
                        'speaking' => '8.0',
                        'file' => UploadedFile::fake()->create('cert.pdf', 100, 'application/pdf'),
                    ],
                ],
            ]);

            $response->assertStatus(500);
        } finally {
            Event::forget('eloquent.creating: '.User::class);
        }

        $this->assertDatabaseMissing('users', ['email' => 'rollback_teacher@example.com']);
        $this->assertSame([], Storage::disk($disk)->allFiles('certificates'));
    }

    public function test_inertia_middleware_caches_payment_qr_svg_by_card_and_url(): void
    {
        Cache::flush();
        Config::set('services.humo.card_number', '9860000011112222');

        $bookingUrl = url('/pupil/bookings');
        $cacheKey1 = 'payment_qr_svg:'.md5('9860000011112222|'.$bookingUrl);

        $this->assertFalse(Cache::has($cacheKey1));

        $this->get(route('login'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('payment.qr_svg', fn (?string $svg) => is_string($svg) && str_contains($svg, '<svg'))
            );

        $this->assertTrue(Cache::has($cacheKey1));

        Config::set('services.humo.card_number', '9860000033334444');
        $cacheKey2 = 'payment_qr_svg:'.md5('9860000033334444|'.$bookingUrl);

        $this->get(route('login'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('payment.qr_svg', fn (?string $svg) => is_string($svg) && str_contains($svg, '<svg'))
            );

        $this->assertTrue(Cache::has($cacheKey2));
    }
}

