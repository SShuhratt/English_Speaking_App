<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pupil_packages', function (Blueprint $table) {
            $table->uuid('discount_voucher_id')->nullable()->after('price_paid');
            $table->integer('discount_amount')->nullable()->after('discount_voucher_id');

            $table->foreign('discount_voucher_id')
                ->references('id')
                ->on('user_discount_vouchers')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('pupil_packages', function (Blueprint $table) {
            $table->dropForeign(['discount_voucher_id']);
            $table->dropColumn(['discount_voucher_id', 'discount_amount']);
        });
    }
};
