<?php

namespace App\Observers;

use App\Models\User;
use App\Services\FileStorageService;
use App\Services\GoogleOAuthService;
use Illuminate\Support\Facades\Log;

class UserObserver
{
    /**
     * Handle the User "deleting" event.
     */
    public function deleting(User $user): void
    {
        FileStorageService::deleteUserFiles($user);

        if ($user->google_connected || $user->google_refresh_token || $user->google_access_token) {
            try {
                app(GoogleOAuthService::class)->revokeUserAccess($user);
            } catch (\Throwable $e) {
                Log::warning("Failed to revoke Google access on user {$user->id} deletion: ".$e->getMessage());
            }
        }
    }
}
