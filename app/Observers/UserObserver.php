<?php

namespace App\Observers;

use App\Models\User;
use App\Services\FileStorageService;

class UserObserver
{
    /**
     * Handle the User "deleting" event.
     */
    public function deleting(User $user): void
    {
        FileStorageService::deleteUserFiles($user);
    }
}
