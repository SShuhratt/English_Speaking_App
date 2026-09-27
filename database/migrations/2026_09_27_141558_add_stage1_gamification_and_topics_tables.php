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
        Schema::table('conversations', function (Blueprint $table) {
            $table->string('topic')->nullable()->after('recording_url');
        });

        Schema::table('pupil_profiles', function (Blueprint $table) {
            $table->unsignedInteger('karma_score')->default(100)->after('weekly_goal');
            $table->unsignedInteger('streak_shields')->default(1)->after('karma_score');
        });

        Schema::create('conversation_endorsements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('conversation_id')->nullable();
            $table->foreignUuid('giver_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('receiver_id')->constrained('users')->onDelete('cascade');
            $table->json('tags');
            $table->timestamps();

            $table->index(['receiver_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('conversation_endorsements');

        Schema::table('pupil_profiles', function (Blueprint $table) {
            $table->dropColumn(['karma_score', 'streak_shields']);
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->dropColumn('topic');
        });
    }
};
