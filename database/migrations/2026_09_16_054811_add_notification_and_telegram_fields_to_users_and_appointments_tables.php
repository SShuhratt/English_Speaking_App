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
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone_number')->nullable()->after('email');
            $table->string('telegram_chat_id')->nullable()->index()->after('gender');
            $table->string('telegram_username')->nullable()->after('telegram_chat_id');
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->timestamp('reminder_5min_sent_at')->nullable()->after('meeting_started');
            $table->timestamp('reminder_started_sent_at')->nullable()->after('reminder_5min_sent_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn(['reminder_5min_sent_at', 'reminder_started_sent_at']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone_number', 'telegram_chat_id', 'telegram_username']);
        });
    }
};
