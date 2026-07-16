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
        Schema::table('pupil_profiles', function (Blueprint $table) {
            $table->string('headline', 90)->nullable();
            $table->text('bio')->nullable();
            $table->decimal('target_overall_band', 3, 1)->nullable();
            $table->decimal('target_speaking_band', 3, 1)->nullable();
            $table->json('labels')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pupil_profiles', function (Blueprint $table) {
            $table->dropColumn(['headline', 'bio', 'target_overall_band', 'target_speaking_band', 'labels']);
        });
    }
};
