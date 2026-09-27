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
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (! Schema::hasColumn('users', 'referral_code')) {
                    $table->string('referral_code', 20)->nullable()->unique()->after('role');
                }
                if (! Schema::hasColumn('users', 'referred_by_id')) {
                    $table->foreignUuid('referred_by_id')->nullable()->after('referral_code')->constrained('users')->nullOnDelete();
                }
            });
        }

        if (! Schema::hasTable('referral_records')) {
            Schema::create('referral_records', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('referrer_id')->constrained('users')->cascadeOnDelete();
                $table->foreignUuid('referred_user_id')->unique()->constrained('users')->cascadeOnDelete();
                $table->boolean('reward_granted')->default(false);
                $table->timestamp('reward_granted_at')->nullable();
                $table->foreignUuid('first_conversation_id')->nullable()->constrained('conversations')->nullOnDelete();
                $table->timestamps();

                $table->index(['referrer_id', 'reward_granted']);
            });
        }

        if (Schema::hasTable('pupil_profiles')) {
            Schema::table('pupil_profiles', function (Blueprint $table) {
                if (! Schema::hasColumn('pupil_profiles', 'last_acknowledged_level')) {
                    $table->integer('last_acknowledged_level')->default(1)->after('streak_shields');
                }
            });
        }

        if (Schema::hasTable('conversation_endorsements')) {
            Schema::table('conversation_endorsements', function (Blueprint $table) {
                if (! Schema::hasColumn('conversation_endorsements', 'is_challenge_session')) {
                    $table->boolean('is_challenge_session')->default(false)->after('balanced_bonus_awarded');
                }
                if (! Schema::hasColumn('conversation_endorsements', 'challenge_bonus_awarded')) {
                    $table->boolean('challenge_bonus_awarded')->default(false)->after('is_challenge_session');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('conversation_endorsements')) {
            Schema::table('conversation_endorsements', function (Blueprint $table) {
                $table->dropColumn(['is_challenge_session', 'challenge_bonus_awarded']);
            });
        }

        if (Schema::hasTable('pupil_profiles')) {
            Schema::table('pupil_profiles', function (Blueprint $table) {
                $table->dropColumn('last_acknowledged_level');
            });
        }

        Schema::dropIfExists('referral_records');

        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropForeign(['referred_by_id']);
                $table->dropColumn(['referral_code', 'referred_by_id']);
            });
        }
    }
};
