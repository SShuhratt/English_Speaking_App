<?php

namespace Tests\Feature;

use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RebindCertificatesCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_dry_run_previews_matches_without_modifying_database(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('certificates/sample_cert.pdf', 'fake-pdf-content');

        $user = User::factory()->teacher()->create([
            'email' => 'teacher_dry_run@example.com',
            'full_name' => 'Dry Run Teacher',
        ]);

        $profile = TeacherProfile::create([
            'user_id' => $user->id,
            'age' => 28,
            'phone_number' => '+998901234567',
            'certificates' => [
                [
                    'type' => 'ielts',
                    'title' => 'IELTS Academic',
                    'overall' => '7.5',
                    'speaking' => '8.0',
                    'verified' => true,
                    'status' => 'verified',
                    'file_url' => null,
                    'file_name' => null,
                ],
            ],
            'experience_years' => 4,
            'price' => 120000,
            'is_verified' => true,
        ]);

        $this->artisan('certificates:rebind', [
            '--dry-run' => true,
            '--disk' => 'public',
            '--window' => 168,
        ])
            ->expectsOutputToContain('[DRY RUN]')
            ->expectsOutputToContain('sample_cert.pdf')
            ->assertSuccessful();

        $freshProfile = $profile->fresh();
        $this->assertNull($freshProfile->certificates[0]['file_url']);
    }

    public function test_rebind_with_force_updates_unbound_certificates(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('certificates/rebind_target.pdf', 'fake-pdf-content');

        $user = User::factory()->teacher()->create([
            'email' => 'teacher_apply@example.com',
            'full_name' => 'Apply Teacher',
        ]);

        $profile = TeacherProfile::create([
            'user_id' => $user->id,
            'age' => 30,
            'phone_number' => '+998901234568',
            'certificates' => [
                [
                    'type' => 'ielts',
                    'title' => 'IELTS',
                    'overall' => '8.5',
                    'speaking' => '8.5',
                    'verified' => true,
                    'status' => 'verified',
                    'file_url' => null,
                    'file_name' => null,
                ],
            ],
            'experience_years' => 6,
            'price' => 150000,
            'is_verified' => true,
        ]);

        $this->artisan('certificates:rebind', [
            '--force' => true,
            '--disk' => 'public',
            '--window' => 168,
        ])
            ->expectsOutputToContain('Successfully rebound 1 certificate(s)')
            ->assertSuccessful();

        $freshProfile = $profile->fresh();
        $certs = $freshProfile->certificates;

        $this->assertNotEmpty($certs[0]['file_url']);
        $this->assertStringContainsString('rebind_target.pdf', $certs[0]['file_url']);
        $this->assertEquals('rebind_target.pdf', $certs[0]['file_name']);
        // Verify other attributes remain untouched
        $this->assertEquals('8.5', $certs[0]['overall']);
        $this->assertEquals('8.5', $certs[0]['speaking']);
        $this->assertTrue($certs[0]['verified']);
        $this->assertEquals('verified', $certs[0]['status']);
    }

    public function test_rebind_skips_already_bound_files(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('certificates/already_taken.pdf', 'content-1');
        Storage::disk('public')->put('certificates/available_cert.pdf', 'content-2');

        $boundUser = User::factory()->teacher()->create([
            'email' => 'bound_teacher@example.com',
        ]);
        TeacherProfile::create([
            'user_id' => $boundUser->id,
            'age' => 32,
            'phone_number' => '+998901111111',
            'certificates' => [
                [
                    'type' => 'ielts',
                    'title' => 'IELTS',
                    'file_url' => Storage::disk('public')->url('certificates/already_taken.pdf'),
                    'file_name' => 'already_taken.pdf',
                ],
            ],
        ]);

        $unboundUser = User::factory()->teacher()->create([
            'email' => 'unbound_teacher@example.com',
        ]);
        $unboundProfile = TeacherProfile::create([
            'user_id' => $unboundUser->id,
            'age' => 29,
            'phone_number' => '+998902222222',
            'certificates' => [
                [
                    'type' => 'ielts',
                    'title' => 'IELTS',
                    'file_url' => null,
                    'file_name' => null,
                ],
            ],
        ]);

        $this->artisan('certificates:rebind', [
            '--force' => true,
            '--disk' => 'public',
            '--window' => 168,
        ])->assertSuccessful();

        $fresh = $unboundProfile->fresh();
        $this->assertStringContainsString('available_cert.pdf', $fresh->certificates[0]['file_url']);
        $this->assertStringNotContainsString('already_taken.pdf', $fresh->certificates[0]['file_url']);
    }

    public function test_teacher_filter_scopes_to_specific_teacher(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('certificates/cert_a.pdf', 'cert-a');
        Storage::disk('public')->put('certificates/cert_b.pdf', 'cert-b');

        $teacherA = User::factory()->teacher()->create([
            'email' => 'target_teacher@example.com',
            'full_name' => 'Target Teacher',
        ]);
        $profileA = TeacherProfile::create([
            'user_id' => $teacherA->id,
            'age' => 26,
            'phone_number' => '+998903333333',
            'certificates' => [
                ['type' => 'ielts', 'file_url' => null, 'file_name' => null],
            ],
        ]);

        $teacherB = User::factory()->teacher()->create([
            'email' => 'other_teacher@example.com',
            'full_name' => 'Other Teacher',
        ]);
        $profileB = TeacherProfile::create([
            'user_id' => $teacherB->id,
            'age' => 27,
            'phone_number' => '+998904444444',
            'certificates' => [
                ['type' => 'ielts', 'file_url' => null, 'file_name' => null],
            ],
        ]);

        $this->artisan('certificates:rebind', [
            '--teacher' => 'target_teacher@example.com',
            '--force' => true,
            '--disk' => 'public',
            '--window' => 168,
        ])
            ->expectsOutputToContain('Successfully rebound 1 certificate(s)')
            ->assertSuccessful();

        $this->assertNotNull($profileA->fresh()->certificates[0]['file_url']);
        $this->assertNull($profileB->fresh()->certificates[0]['file_url']);
    }

    public function test_explicit_file_option_binds_specified_file(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('certificates/custom_upload.pdf', 'content');

        $teacher = User::factory()->teacher()->create([
            'email' => 'manual_assign@example.com',
        ]);
        $profile = TeacherProfile::create([
            'user_id' => $teacher->id,
            'age' => 31,
            'phone_number' => '+998905555555',
            'certificates' => [
                ['type' => 'ielts', 'file_url' => null, 'file_name' => null],
            ],
        ]);

        $this->artisan('certificates:rebind', [
            '--file' => 'certificates/custom_upload.pdf',
            '--teacher' => 'manual_assign@example.com',
            '--force' => true,
            '--disk' => 'public',
        ])
            ->expectsOutputToContain('Successfully rebound 1 certificate(s)')
            ->assertSuccessful();

        $fresh = $profile->fresh();
        $this->assertStringContainsString('custom_upload.pdf', $fresh->certificates[0]['file_url']);
    }

    public function test_respects_time_window_threshold(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('certificates/old_cert.pdf', 'content');

        $teacher = User::factory()->teacher()->create();
        $profile = TeacherProfile::create([
            'user_id' => $teacher->id,
            'age' => 29,
            'phone_number' => '+998906666666',
            'certificates' => [
                ['type' => 'ielts', 'file_url' => null, 'file_name' => null],
            ],
        ]);

        // Shift profile timestamp to 10 days in the future relative to the fake file
        $futureTime = Carbon::now()->addDays(10);
        TeacherProfile::where('id', $profile->id)->update([
            'created_at' => $futureTime,
            'updated_at' => $futureTime,
        ]);
        User::where('id', $teacher->id)->update([
            'created_at' => $futureTime,
            'updated_at' => $futureTime,
        ]);

        // Run with 24-hour window: should NOT match
        $this->artisan('certificates:rebind', [
            '--window' => 24,
            '--disk' => 'public',
            '--dry-run' => true,
        ])
            ->expectsOutputToContain('No unbound certificates could be matched')
            ->assertSuccessful();

        $this->assertNull($profile->fresh()->certificates[0]['file_url']);

        // Run with 300-hour window: SHOULD match
        $this->artisan('certificates:rebind', [
            '--window' => 300,
            '--disk' => 'public',
            '--force' => true,
        ])
            ->expectsOutputToContain('Successfully rebound 1 certificate(s)')
            ->assertSuccessful();

        $this->assertNotNull($profile->fresh()->certificates[0]['file_url']);
    }

    public function test_multiple_unbound_certificates_receive_distinct_files(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('certificates/file_one.pdf', 'one');
        Storage::disk('public')->put('certificates/file_two.pdf', 'two');

        $teacher = User::factory()->teacher()->create([
            'email' => 'multi_cert@example.com',
        ]);
        $profile = TeacherProfile::create([
            'user_id' => $teacher->id,
            'age' => 35,
            'phone_number' => '+998907777777',
            'certificates' => [
                ['type' => 'ielts', 'title' => 'IELTS', 'file_url' => null, 'file_name' => null],
                ['type' => 'cefr', 'title' => 'CEFR', 'file_url' => null, 'file_name' => null],
            ],
        ]);

        $this->artisan('certificates:rebind', [
            '--force' => true,
            '--disk' => 'public',
            '--window' => 168,
        ])
            ->expectsOutputToContain('Successfully rebound 2 certificate(s)')
            ->assertSuccessful();

        $fresh = $profile->fresh();
        $this->assertNotNull($fresh->certificates[0]['file_url']);
        $this->assertNotNull($fresh->certificates[1]['file_url']);
        $this->assertNotEquals($fresh->certificates[0]['file_url'], $fresh->certificates[1]['file_url']);
    }
}
