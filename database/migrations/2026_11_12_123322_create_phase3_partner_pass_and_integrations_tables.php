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
        Schema::create('platform_settings', function (Blueprint $table) {
            $table->string('key', 100)->primary();
            $table->text('value')->nullable();
            $table->string('type', 20)->default('string');
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('partner_pass_batches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('partner_organization_id')->constrained('partner_organizations')->cascadeOnDelete();
            $table->string('title', 150);
            $table->unsignedInteger('duration_days')->default(30);
            $table->unsignedInteger('unit_retail_price_uzs')->default(30000);
            $table->unsignedInteger('unit_wholesale_price_uzs')->default(25000);
            $table->unsignedInteger('quantity');
            $table->unsignedBigInteger('total_paid_upfront_uzs');
            $table->string('payment_status', 30)->default('pending')->index();
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['partner_organization_id', 'payment_status'], 'ppb_org_payment_idx');
        });

        Schema::create('partner_passes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('batch_id')->nullable()->constrained('partner_pass_batches')->nullOnDelete();
            $table->foreignUuid('partner_organization_id')->nullable()->constrained('partner_organizations')->nullOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('activation_code', 32)->nullable()->unique();
            $table->string('source', 30)->default('b2c_retail')->index();
            $table->unsignedInteger('duration_days')->default(30);
            $table->unsignedInteger('gross_amount')->default(0);
            $table->string('gateway_provider', 30)->default('humo_p2p');
            $table->unsignedInteger('gateway_fee_bps')->default(200);
            $table->unsignedInteger('gateway_fee_amount')->default(0);
            $table->unsignedInteger('net_cash_amount')->default(0);
            $table->string('payment_status', 30)->default('verifying')->index();
            $table->string('receipt_path')->nullable();
            $table->jsonb('receipt_data')->nullable();
            $table->string('status', 30)->default('pending_payment')->index();
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();

            $table->index(['user_id', 'status', 'expires_at'], 'pp_user_status_exp_idx');
        });

        Schema::create('external_entitlements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('provider', 50)->default('writing_mentor');
            $table->string('external_user_id', 120)->nullable();
            $table->string('plan_code', 80)->default('standard');
            $table->string('status', 30)->default('active')->index();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'provider'], 'ee_user_provider_unique');
        });

        Schema::create('integration_webhook_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('provider', 50);
            $table->string('event_id', 120);
            $table->string('event_type', 80);
            $table->jsonb('payload');
            $table->timestamp('processed_at');
            $table->timestamps();

            $table->unique(['provider', 'event_id'], 'iwe_provider_event_unique');
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->unsignedInteger('original_price')->nullable()->after('price');
            $table->unsignedInteger('platform_subsidy_amount')->default(0)->after('discount_amount');
        });

        Schema::table('partner_commission_entries', function (Blueprint $table) {
            $table->uuid('teacher_id')->nullable()->change();
            $table->uuid('appointment_id')->nullable()->change();
            $table->foreignUuid('partner_pass_id')->nullable()->unique()->after('pupil_package_id')->constrained('partner_passes')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('partner_commission_entries', function (Blueprint $table) {
            $table->dropForeign(['partner_pass_id']);
            $table->dropColumn('partner_pass_id');
            $table->uuid('appointment_id')->nullable(false)->change();
            $table->uuid('teacher_id')->nullable(false)->change();
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn(['original_price', 'platform_subsidy_amount']);
        });

        Schema::dropIfExists('integration_webhook_events');
        Schema::dropIfExists('external_entitlements');
        Schema::dropIfExists('partner_passes');
        Schema::dropIfExists('partner_pass_batches');
        Schema::dropIfExists('platform_settings');
    }
};
