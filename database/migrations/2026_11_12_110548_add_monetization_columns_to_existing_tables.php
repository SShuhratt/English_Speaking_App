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
        Schema::table('appointments', function (Blueprint $table) {
            $table->timestamp('completed_at')->nullable()->after('end_at')->index();
            $table->unsignedInteger('gross_amount')->nullable()->after('price');
            $table->string('gateway_provider', 30)->default('humo_p2p')->after('gross_amount');
            $table->unsignedInteger('gateway_fee_bps')->default(200)->after('gateway_provider');
            $table->unsignedInteger('gateway_fee_amount')->default(0)->after('gateway_fee_bps');
            $table->unsignedInteger('net_cash_amount')->nullable()->after('gateway_fee_amount');
            $table->boolean('is_promotional_zero_cash')->default(false)->after('net_cash_amount');
            $table->foreignUuid('partner_voucher_id')->nullable()->after('discount_voucher_id')->constrained('partner_vouchers')->nullOnDelete();
            $table->timestamp('completion_voided_at')->nullable()->after('completed_at');
            $table->text('completion_void_reason')->nullable()->after('completion_voided_at');
        });

        Schema::table('pupil_packages', function (Blueprint $table) {
            $table->unsignedInteger('gross_amount')->nullable()->after('price_paid');
            $table->string('gateway_provider', 30)->default('humo_p2p')->after('gross_amount');
            $table->unsignedInteger('gateway_fee_bps')->default(200)->after('gateway_provider');
            $table->unsignedInteger('gateway_fee_amount')->default(0)->after('gateway_fee_bps');
            $table->unsignedInteger('net_cash_amount')->nullable()->after('gateway_fee_amount');
        });

        Schema::table('teacher_profiles', function (Blueprint $table) {
            $table->boolean('accepts_institutional_vouchers')->default(false)->after('is_verified');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('teacher_profiles', function (Blueprint $table) {
            $table->dropColumn('accepts_institutional_vouchers');
        });

        Schema::table('pupil_packages', function (Blueprint $table) {
            $table->dropColumn([
                'gross_amount',
                'gateway_provider',
                'gateway_fee_bps',
                'gateway_fee_amount',
                'net_cash_amount',
            ]);
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->dropForeign(['partner_voucher_id']);
            $table->dropColumn([
                'completed_at',
                'gross_amount',
                'gateway_provider',
                'gateway_fee_bps',
                'gateway_fee_amount',
                'net_cash_amount',
                'is_promotional_zero_cash',
                'partner_voucher_id',
                'completion_voided_at',
                'completion_void_reason',
            ]);
        });
    }
};
