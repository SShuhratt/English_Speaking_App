<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('teacher_availabilities')
            ->where('slot_duration', '!=', 30)
            ->orWhereNull('slot_duration')
            ->update(['slot_duration' => 30]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op
    }
};
