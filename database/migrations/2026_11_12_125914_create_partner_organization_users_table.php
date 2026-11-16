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
        Schema::create('partner_organization_users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('partner_organization_id')->constrained('partner_organizations')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('staff_role', 30)->default('manager');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['partner_organization_id', 'user_id'], 'partner_org_users_org_user_unique');
            $table->index(['user_id', 'is_active'], 'partner_org_users_user_active_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_organization_users');
    }
};
