<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {

        Schema::create('teacher_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->integer('age');
            $table->string('phone_number');
            $table->json('certificates')->nullable(); // Array of secure asset URLs
            $table->string('overall_level'); // e.g., IELTS 8.5, CEFR C1
            $table->string('speaking_band'); // Explicit speaking sub-score
            $table->decimal('experience_years', 3, 1)->default(0.0);
            $table->string('workplace')->nullable();
            $table->decimal('rating_cache', 3, 1)->default(0.0); // De-normalized rating for fast lookups
            $table->timestamps();
        });

        Schema::create('pupil_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->integer('age');
            $table->string('phone_number');
            $table->enum('level', ['beginner', 'pre-intermediate', 'upper-intermediate', 'advanced', 'ielts_band', 'cefr_band']);
            $table->timestamps();
        });

        Schema::create('conversations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pupil_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('teacher_id')->constrained('users')->onDelete('cascade');
            $table->string('recording_url')->nullable(); // Cloudflare R2 path reference
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();

            $table->index(['pupil_id', 'teacher_id']);
        });

        // 5. FEEDBACKS & COMMENTS TABLE
        Schema::create('feedbacks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('conversation_id')->constrained('conversations')->onDelete('cascade');
            $table->foreignUuid('pupil_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('teacher_id')->constrained('users')->onDelete('cascade');
            $table->integer('rating_score')->unsigned(); // Numeric score out of 10
            $table->text('comment_text');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feedbacks');
        Schema::dropIfExists('conversations');
        Schema::dropIfExists('pupil_profiles');
        Schema::dropIfExists('teacher_profiles');
    }
};
