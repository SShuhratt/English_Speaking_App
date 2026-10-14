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
            $table->string('receipt_path')->nullable()->after('payment_status');
            $table->json('receipt_data')->nullable()->after('receipt_path');
        });

        Schema::table('pupil_packages', function (Blueprint $table) {
            $table->string('receipt_path')->nullable()->after('payment_status');
            $table->json('receipt_data')->nullable()->after('receipt_path');
        });

        Schema::create('humo_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('hash', 64)->unique();
            $table->unsignedInteger('amount');
            $table->string('card_last_digits', 10)->nullable();
            $table->string('channel')->nullable();
            $table->string('bank_timestamp')->nullable();
            $table->text('raw_text');
            $table->string('status', 30)->default('unmatched'); // matched, quarantined, unmatched
            $table->string('matched_type', 30)->nullable(); // appointment, package
            $table->string('matched_id', 64)->nullable();
            $table->timestamps();

            $table->index(['status', 'amount']);
            $table->index(['created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('humo_transactions');

        Schema::table('pupil_packages', function (Blueprint $table) {
            $table->dropColumn(['receipt_path', 'receipt_data']);
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn(['receipt_path', 'receipt_data']);
        });
    }
};
