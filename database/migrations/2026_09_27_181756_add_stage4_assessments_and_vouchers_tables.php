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
        if (Schema::hasTable('pupil_profiles')) {
            Schema::table('pupil_profiles', function (Blueprint $table) {
                if (! Schema::hasColumn('pupil_profiles', 'spent_xp')) {
                    $table->integer('spent_xp')->default(0)->after('karma_score');
                }
            });
        }

        if (! Schema::hasTable('appointment_assessments')) {
            Schema::create('appointment_assessments', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('appointment_id')->unique()->constrained('appointments')->cascadeOnDelete();
                $table->foreignUuid('teacher_id')->constrained('users')->cascadeOnDelete();
                $table->foreignUuid('pupil_id')->constrained('users')->cascadeOnDelete();
                $table->decimal('fluency_score', 3, 1);
                $table->decimal('lexical_score', 3, 1);
                $table->decimal('grammar_score', 3, 1);
                $table->decimal('pronunciation_score', 3, 1);
                $table->decimal('overall_score', 3, 1);
                $table->text('teacher_notes')->nullable();
                $table->timestamps();

                $table->index(['pupil_id', 'created_at']);
            });
        }

        if (! Schema::hasTable('user_discount_vouchers')) {
            Schema::create('user_discount_vouchers', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('voucher_code', 30)->unique();
                $table->integer('discount_percent');
                $table->integer('xp_spent');
                $table->boolean('is_redeemed')->default(false);
                $table->timestamp('redeemed_at')->nullable();
                $table->foreignUuid('appointment_id')->nullable()->constrained('appointments')->nullOnDelete();
                $table->timestamps();

                $table->index(['user_id', 'is_redeemed']);
            });
        }

        if (Schema::hasTable('appointments')) {
            Schema::table('appointments', function (Blueprint $table) {
                if (! Schema::hasColumn('appointments', 'discount_voucher_id')) {
                    $table->foreignUuid('discount_voucher_id')->nullable()->constrained('user_discount_vouchers')->nullOnDelete();
                }
                if (! Schema::hasColumn('appointments', 'discount_amount')) {
                    $table->integer('discount_amount')->default(0)->after('status');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('appointments')) {
            Schema::table('appointments', function (Blueprint $table) {
                $table->dropForeign(['discount_voucher_id']);
                $table->dropColumn(['discount_voucher_id', 'discount_amount']);
            });
        }

        Schema::dropIfExists('user_discount_vouchers');
        Schema::dropIfExists('appointment_assessments');

        if (Schema::hasTable('pupil_profiles')) {
            Schema::table('pupil_profiles', function (Blueprint $table) {
                $table->dropColumn('spent_xp');
            });
        }
    }
};
