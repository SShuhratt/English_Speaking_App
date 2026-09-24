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
        Schema::create('teacher_packages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('teacher_id')->constrained('users')->onDelete('cascade');
            $table->string('title', 150);
            $table->integer('total_hours');
            $table->integer('total_minutes');
            $table->integer('price');
            $table->integer('discount_percentage')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('pupil_packages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pupil_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('teacher_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('teacher_package_id')->nullable()->constrained('teacher_packages')->nullOnDelete();
            $table->string('package_title', 150);
            $table->integer('total_minutes');
            $table->integer('remaining_minutes');
            $table->integer('price_paid');
            $table->string('payment_status', 30)->default('verifying');
            $table->text('payment_rejection_reason')->nullable();
            $table->string('status', 30)->default('active');
            $table->timestamps();
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->foreignUuid('pupil_package_id')->nullable()->constrained('pupil_packages')->nullOnDelete();
            $table->boolean('is_package_booking')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropForeign(['pupil_package_id']);
            $table->dropColumn(['pupil_package_id', 'is_package_booking']);
        });

        Schema::dropIfExists('pupil_packages');
        Schema::dropIfExists('teacher_packages');
    }
};
