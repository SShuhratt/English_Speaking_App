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
        Schema::create('off_platform_reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('appointment_id')->constrained('appointments')->onDelete('cascade');
            $table->foreignUuid('pupil_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('teacher_id')->constrained('users')->onDelete('cascade');
            $table->string('reported_contact', 150);
            $table->text('description');
            $table->string('status', 30)->default('pending')->index();
            $table->text('admin_notes')->nullable();
            $table->foreignUuid('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('rewarded_voucher_id')->nullable()->constrained('user_discount_vouchers')->nullOnDelete();
            $table->timestamps();

            $table->unique('appointment_id');
            $table->index(['pupil_id', 'teacher_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('off_platform_reports');
    }
};
