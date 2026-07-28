<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;');
            DB::statement('ALTER TABLE appointments ALTER COLUMN status TYPE VARCHAR(255);');
        }

        Schema::create('support_messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('admin_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('subject')->nullable();
            $table->text('message');
            $table->boolean('is_read_by_admin')->default(false);
            $table->boolean('is_read_by_user')->default(true);
            $table->string('recipient_type')->default('individual'); // individual, all, selected
            $table->timestamps();
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->string('payment_status')->default('verifying'); // verifying, paid, rejected
            $table->text('payment_rejection_reason')->nullable();
        });

        Schema::table('teacher_profiles', function (Blueprint $table) {
            $table->boolean('is_verified')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('teacher_profiles', function (Blueprint $table) {
            $table->dropColumn('is_verified');
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn(['payment_status', 'payment_rejection_reason']);
        });

        Schema::dropIfExists('support_messages');
    }
};
