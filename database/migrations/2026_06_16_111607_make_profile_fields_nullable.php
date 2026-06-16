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
        Schema::table('teacher_profiles', function (Blueprint $table) {
            $table->integer('age')->nullable()->change();
            $table->string('phone_number')->nullable()->change();
            $table->string('overall_level')->nullable()->change();
            $table->string('speaking_band')->nullable()->change();
            $table->decimal('experience_years', 3, 1)->nullable()->change();
        });

        Schema::table('pupil_profiles', function (Blueprint $table) {
            $table->integer('age')->nullable()->change();
            $table->string('phone_number')->nullable()->change();
            $table->string('level')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('teacher_profiles', function (Blueprint $table) {
            $table->integer('age')->nullable(false)->change();
            $table->string('phone_number')->nullable(false)->change();
            $table->string('overall_level')->nullable(false)->change();
            $table->string('speaking_band')->nullable(false)->change();
            $table->decimal('experience_years', 3, 1)->nullable(false)->change();
        });

        Schema::table('pupil_profiles', function (Blueprint $table) {
            $table->integer('age')->nullable(false)->change();
            $table->string('phone_number')->nullable(false)->change();
            $table->string('level')->nullable(false)->change();
        });
    }
};
