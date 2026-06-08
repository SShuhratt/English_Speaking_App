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
        Schema::create('teacher_availabilities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('teacher_id')->constrained('users')->onDelete('cascade');
            $table->enum('type', ['recurring', 'custom'])->default('recurring');
            
            // Recurring fields
            $table->string('day_of_week')->nullable(); // Monday, Tuesday, etc.
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();

            // Custom fields
            $table->dateTime('start_at')->nullable();
            $table->dateTime('end_at')->nullable();

            $table->integer('slot_duration')->default(30);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('appointments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('teacher_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('pupil_id')->constrained('users')->onDelete('cascade');
            $table->dateTime('start_at');
            $table->dateTime('end_at');
            $table->enum('status', ['pending', 'confirmed', 'rejected', 'cancelled'])->default('pending');
            $table->text('notes')->nullable();
            
            // Integration fields
            $table->string('google_event_id')->nullable();
            $table->string('google_meet_link')->nullable();
            $table->string('provider')->default('google');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
        Schema::dropIfExists('teacher_availabilities');
    }
};
