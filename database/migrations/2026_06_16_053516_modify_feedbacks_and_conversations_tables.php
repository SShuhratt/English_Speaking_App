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
        Schema::table('conversations', function (Blueprint $table) {
            $table->foreignUuid('appointment_id')->nullable()->constrained('appointments')->onDelete('cascade');
        });

        Schema::table('feedbacks', function (Blueprint $table) {
            $table->integer('rating_score')->unsigned()->nullable()->change();
            $table->foreignUuid('author_id')->nullable()->constrained('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('feedbacks', function (Blueprint $table) {
            $table->dropForeign(['author_id']);
            $table->dropColumn('author_id');
            $table->integer('rating_score')->unsigned()->nullable(false)->change();
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->dropForeign(['appointment_id']);
            $table->dropColumn('appointment_id');
        });
    }
};
