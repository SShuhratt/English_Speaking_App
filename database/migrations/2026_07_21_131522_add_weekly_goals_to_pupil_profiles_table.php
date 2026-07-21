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
            $table->json('weekly_goals')->nullable()->after('weekly_goal');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pupil_profiles', function (Blueprint $table) {
            $table->dropColumn('weekly_goals');
        });
    }
};
