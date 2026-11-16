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
        Schema::create('partner_payouts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('partner_organization_id')->constrained('partner_organizations')->cascadeOnDelete();
            $table->unsignedSmallInteger('period_year');
            $table->unsignedTinyInteger('period_month');
            $table->date('period_start');
            $table->date('period_end');
            $table->unsignedInteger('total_lessons_count')->default(0);
            $table->unsignedBigInteger('total_net_cash_gmv')->default(0);
            $table->unsignedBigInteger('total_commission_amount')->default(0);
            $table->string('didox_document_id', 120)->nullable();
            $table->string('payment_reference', 120)->nullable();
            $table->string('status', 30)->default('draft')->index();
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['partner_organization_id', 'period_year', 'period_month']);
        });

        Schema::create('partner_commission_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('partner_organization_id')->constrained('partner_organizations')->cascadeOnDelete();
            $table->foreignUuid('pupil_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('appointment_id')->unique()->constrained('appointments')->cascadeOnDelete();
            $table->foreignUuid('pupil_package_id')->nullable()->constrained('pupil_packages')->nullOnDelete();
            $table->foreignUuid('payout_id')->nullable()->constrained('partner_payouts')->nullOnDelete();
            $table->string('entry_source', 30)->default('direct_lesson');
            $table->boolean('meeting_started')->default(false);
            $table->unsignedInteger('gross_lesson_value');
            $table->unsignedInteger('gateway_fee_bps');
            $table->unsignedInteger('gateway_fee_amount');
            $table->unsignedInteger('net_cash_basis');
            $table->unsignedInteger('teacher_rate_bps');
            $table->unsignedInteger('teacher_amount');
            $table->unsignedInteger('platform_rate_bps');
            $table->unsignedInteger('platform_amount');
            $table->unsignedInteger('partner_rate_bps');
            $table->unsignedInteger('partner_amount');
            $table->string('status', 30)->default('accrued')->index();
            $table->timestamp('accrued_at')->index();
            $table->timestamp('voided_at')->nullable();
            $table->text('void_reason')->nullable();
            $table->timestamps();

            $table->index(['partner_organization_id', 'status', 'accrued_at'], 'pce_org_status_accrued_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_commission_entries');
        Schema::dropIfExists('partner_payouts');
    }
};
