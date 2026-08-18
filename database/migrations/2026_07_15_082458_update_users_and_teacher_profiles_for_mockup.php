<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar')->nullable();
        });

        Schema::table('teacher_profiles', function (Blueprint $table) {
            $table->string('headline', 90)->nullable();
            $table->text('bio')->nullable();
            $table->string('intro_video_url')->nullable();
            $table->integer('price')->default(0);
        });

        // Safe type change for experience_years (handles both SQLite and Postgres)
        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE teacher_profiles ALTER COLUMN experience_years TYPE VARCHAR(255) USING experience_years::text');
        } else {
            Schema::table('teacher_profiles', function (Blueprint $table) {
                $table->string('experience_years')->nullable()->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE teacher_profiles ALTER COLUMN experience_years TYPE NUMERIC(3, 1) USING NULLIF(experience_years, \'\')::numeric(3, 1)');
        } else {
            Schema::table('teacher_profiles', function (Blueprint $table) {
                $table->decimal('experience_years', 3, 1)->default(0.0)->change();
            });
        }

        Schema::table('teacher_profiles', function (Blueprint $table) {
            $table->dropColumn(['headline', 'bio', 'intro_video_url', 'price']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('avatar');
        });
    }
};
