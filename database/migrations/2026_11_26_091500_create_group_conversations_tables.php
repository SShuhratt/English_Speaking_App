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
        Schema::table('teacher_profiles', function (Blueprint $table) {
            $table->boolean('supports_group_sessions')->default(false)->after('accepts_institutional_vouchers');
            $table->string('preferred_session_format', 20)->default('one_on_one')->after('supports_group_sessions');
        });

        Schema::create('group_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->string('title', 150);
            $table->text('topic')->nullable();
            $table->string('target_level', 40)->default('all');
            $table->dateTime('start_at');
            $table->dateTime('end_at');
            $table->unsignedInteger('duration_minutes')->default(60);
            $table->unsignedSmallInteger('max_seats')->default(5);
            $table->unsignedInteger('price_per_seat');
            $table->string('status', 30)->default('scheduled');
            $table->boolean('meeting_started')->default(false);
            $table->dateTime('started_at')->nullable();
            $table->string('google_event_id')->nullable();
            $table->string('google_meet_link')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->string('cancelled_by', 20)->nullable();
            $table->timestamp('reminder_5min_sent_at')->nullable();
            $table->timestamp('reminder_started_sent_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['teacher_id', 'start_at']);
            $table->index(['status', 'start_at']);
        });

        Schema::create('group_session_enrollments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('group_session_id')->constrained('group_sessions')->cascadeOnDelete();
            $table->foreignUuid('pupil_id')->constrained('users')->cascadeOnDelete();
            $table->string('status', 30)->default('pending_payment');
            $table->string('payment_status', 30)->default('verifying');
            $table->text('payment_rejection_reason')->nullable();
            $table->unsignedInteger('price_paid');
            $table->unsignedInteger('gross_amount')->nullable();
            $table->string('gateway_provider', 40)->nullable();
            $table->unsignedInteger('gateway_fee_bps')->nullable();
            $table->unsignedInteger('gateway_fee_amount')->nullable();
            $table->unsignedInteger('net_cash_amount')->nullable();
            $table->string('receipt_path')->nullable();
            $table->json('receipt_data')->nullable();
            $table->timestamp('reserved_until')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['group_session_id', 'pupil_id']);
            $table->index(['pupil_id', 'status']);
            $table->index(['payment_status', 'reserved_until'], 'gse_payment_reserved_idx');
        });

        Schema::table('partner_commission_entries', function (Blueprint $table) {
            $table->uuid('appointment_id')->nullable()->change();
            $table->foreignUuid('group_session_enrollment_id')
                ->nullable()
                ->after('appointment_id')
                ->unique()
                ->constrained('group_session_enrollments')
                ->cascadeOnDelete();
        });

        Schema::table('feedbacks', function (Blueprint $table) {
            $table->uuid('conversation_id')->nullable()->change();
            $table->foreignUuid('group_session_id')
                ->nullable()
                ->after('conversation_id')
                ->constrained('group_sessions')
                ->cascadeOnDelete();

            $table->unique(['group_session_id', 'author_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('feedbacks', function (Blueprint $table) {
            $table->dropUnique(['group_session_id', 'author_id']);
            $table->dropForeign(['group_session_id']);
            $table->dropColumn('group_session_id');
            $table->uuid('conversation_id')->nullable(false)->change();
        });

        Schema::table('partner_commission_entries', function (Blueprint $table) {
            $table->dropForeign(['group_session_enrollment_id']);
            $table->dropUnique(['group_session_enrollment_id']);
            $table->dropColumn('group_session_enrollment_id');
            $table->uuid('appointment_id')->nullable(false)->change();
        });

        Schema::dropIfExists('group_session_enrollments');
        Schema::dropIfExists('group_sessions');

        Schema::table('teacher_profiles', function (Blueprint $table) {
            $table->dropColumn(['supports_group_sessions', 'preferred_session_format']);
        });
    }
};
