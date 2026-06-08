<?php

use App\Http\Controllers\BookingController;
use App\Http\Controllers\GoogleOAuthController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    // Teacher Routes
    Route::prefix('teacher')->name('teacher.')->group(function () {
        Route::get('/appointments', [\App\Http\Controllers\TeacherAppointmentController::class, 'index'])->name('appointments.index');
        Route::post('/appointments/{id}/approve', [\App\Http\Controllers\TeacherAppointmentController::class, 'approve'])->name('appointments.approve');
        Route::post('/appointments/{id}/reject', [\App\Http\Controllers\TeacherAppointmentController::class, 'reject'])->name('appointments.reject');
    });

    // Pupil Routes
    Route::prefix('pupil')->name('pupil.')->group(function () {
        Route::get('/teachers', [\App\Http\Controllers\TeacherController::class, 'index'])->name('teachers.index');
        Route::get('/booking', [\App\Http\Controllers\TeacherController::class, 'showBooking'])->name('booking.show');
    });
});

Route::middleware('auth')->group(function () {
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings/slots/{teacherId}', [BookingController::class, 'slots']);
    Route::delete('/bookings/{id}', [BookingController::class, 'cancel']);
});

Route::get('/auth/google', [GoogleOAuthController::class, 'redirect']);
Route::get('/auth/google/callback', [GoogleOAuthController::class, 'callback']);

require __DIR__.'/settings.php';
