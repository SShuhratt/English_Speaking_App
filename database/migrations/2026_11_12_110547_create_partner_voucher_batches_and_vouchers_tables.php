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
        Schema::create('partner_voucher_batches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('partner_organization_id')->constrained('partner_organizations')->cascadeOnDelete();
            $table->string('title', 150);
            $table->string('bundle_type', 30)->default('mock_speaking');
            $table->unsignedInteger('lesson_duration_minutes')->default(30);
            $table->unsignedInteger('max_lesson_price_uzs');
            $table->unsignedInteger('unit_face_value_uzs');
            $table->unsignedInteger('wholesale_discount_percent')->default(15);
            $table->unsignedInteger('unit_wholesale_price_uzs');
            $table->unsignedInteger('quantity');
            $table->unsignedInteger('total_paid_upfront_uzs');
            $table->string('payment_status', 30)->default('pending')->index();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('valid_until')->index();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['partner_organization_id', 'payment_status']);
        });

        Schema::create('partner_vouchers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('batch_id')->constrained('partner_voucher_batches')->cascadeOnDelete();
            $table->foreignUuid('partner_organization_id')->constrained('partner_organizations')->cascadeOnDelete();
            $table->string('code', 32)->unique();
            $table->foreignUuid('claimed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('claimed_at')->nullable();
            $table->foreignUuid('redeemed_appointment_id')->nullable()->constrained('appointments')->nullOnDelete();
            $table->timestamp('redeemed_at')->nullable();
            $table->string('status', 30)->default('available')->index();
            $table->timestamps();

            $table->index(['batch_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_vouchers');
        Schema::dropIfExists('partner_voucher_batches');
    }
};
