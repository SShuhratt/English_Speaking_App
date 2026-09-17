<?php

use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use App\Http\Controllers\Settings\TelegramSettingsController;
use App\Http\Middleware\EnsurePasswordConfirmedForSecurity;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');

    Route::get('settings/telegram/deep-link', [TelegramSettingsController::class, 'deepLink'])->name('settings.telegram.deep-link');
    Route::post('settings/telegram/pairing-code', [TelegramSettingsController::class, 'pairingCode'])->name('settings.telegram.pairing-code');
    Route::post('settings/telegram/unlink', [TelegramSettingsController::class, 'unlink'])->name('settings.telegram.unlink');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/security', [SecurityController::class, 'edit'])
        ->middleware(EnsurePasswordConfirmedForSecurity::class)
        ->name('security.edit');

    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');
});
