<?php

use App\Models\PupilProfile;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        TeacherProfile::whereNotNull('phone_number')
            ->where('phone_number', '!=', '')
            ->chunkById(100, function ($profiles) {
                foreach ($profiles as $profile) {
                    User::where('id', $profile->user_id)
                        ->where(function ($q) {
                            $q->whereNull('phone_number')
                                ->orWhere('phone_number', '');
                        })
                        ->update(['phone_number' => $profile->phone_number]);
                }
            });

        PupilProfile::whereNotNull('phone_number')
            ->where('phone_number', '!=', '')
            ->chunkById(100, function ($profiles) {
                foreach ($profiles as $profile) {
                    User::where('id', $profile->user_id)
                        ->where(function ($q) {
                            $q->whereNull('phone_number')
                                ->orWhere('phone_number', '');
                        })
                        ->update(['phone_number' => $profile->phone_number]);
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Non-destructive data sync
    }
};
