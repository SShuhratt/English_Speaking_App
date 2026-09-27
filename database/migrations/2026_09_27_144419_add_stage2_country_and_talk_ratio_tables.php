<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('pupil_profiles')) {
            Schema::table('pupil_profiles', function (Blueprint $table) {
                if (! Schema::hasColumn('pupil_profiles', 'country_code')) {
                    $table->string('country_code', 10)->nullable()->default('UZ')->after('level');
                }
                if (! Schema::hasColumn('pupil_profiles', 'city')) {
                    $table->string('city', 100)->nullable()->after('country_code');
                }
            });
        }

        if (Schema::hasTable('teacher_profiles')) {
            Schema::table('teacher_profiles', function (Blueprint $table) {
                if (! Schema::hasColumn('teacher_profiles', 'country_code')) {
                    $table->string('country_code', 10)->nullable()->default('UZ')->after('overall_level');
                }
                if (! Schema::hasColumn('teacher_profiles', 'city')) {
                    $table->string('city', 100)->nullable()->after('country_code');
                }
            });
        }

        if (Schema::hasTable('conversation_endorsements')) {
            Schema::table('conversation_endorsements', function (Blueprint $table) {
                if (! Schema::hasColumn('conversation_endorsements', 'talk_time_ratio')) {
                    $table->integer('talk_time_ratio')->nullable()->after('tags');
                }
                if (! Schema::hasColumn('conversation_endorsements', 'balanced_bonus_awarded')) {
                    $table->boolean('balanced_bonus_awarded')->default(false)->after('talk_time_ratio');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('pupil_profiles')) {
            Schema::table('pupil_profiles', function (Blueprint $table) {
                $table->dropColumn(['country_code', 'city']);
            });
        }

        if (Schema::hasTable('teacher_profiles')) {
            Schema::table('teacher_profiles', function (Blueprint $table) {
                $table->dropColumn(['country_code', 'city']);
            });
        }

        if (Schema::hasTable('conversation_endorsements')) {
            Schema::table('conversation_endorsements', function (Blueprint $table) {
                $table->dropColumn(['talk_time_ratio', 'balanced_bonus_awarded']);
            });
        }
    }
};
