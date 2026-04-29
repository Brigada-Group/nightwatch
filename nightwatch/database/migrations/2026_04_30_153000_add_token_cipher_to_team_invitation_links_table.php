<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('team_invitation_links', function (Blueprint $table) {
            $table->text('token_cipher')->nullable()->after('token_hash');
        });
    }

    public function down(): void
    {
        Schema::table('team_invitation_links', function (Blueprint $table) {
            $table->dropColumn('token_cipher');
        });
    }
};
