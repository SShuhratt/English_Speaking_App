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
        Schema::create('partner_organizations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 150);
            $table->string('legal_name', 255);
            $table->string('legal_type', 20)->default('mchj');
            $table->string('inn_stir', 30)->nullable();
            $table->string('bank_account', 64)->nullable();
            $table->string('bank_mfo', 20)->nullable();
            $table->string('bank_name', 150)->nullable();
            $table->string('contact_phone', 40)->nullable();
            $table->string('contact_email', 150)->nullable();
            $table->foreignUuid('director_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('partner_code', 32)->unique();
            $table->unsignedInteger('commission_rate_bps')->default(500);
            $table->string('contract_number', 80)->nullable();
            $table->date('contract_signed_at')->nullable();
            $table->string('status', 30)->default('active')->index();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('partner_attributions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('partner_organization_id')->constrained('partner_organizations')->cascadeOnDelete();
            $table->foreignUuid('pupil_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('attribution_source', 40)->default('referral_link');
            $table->string('partner_code_used', 32);
            $table->timestamp('attributed_at');
            $table->timestamps();

            $table->index(['partner_organization_id', 'attributed_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_attributions');
        Schema::dropIfExists('partner_organizations');
    }
};
