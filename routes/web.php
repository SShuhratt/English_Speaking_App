<?php

use App\Http\Controllers\BookingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GoogleOAuthController;
use App\Http\Controllers\PupilBookingController;
use App\Http\Controllers\PupilProgressController;
use App\Http\Controllers\PupilSessionController;
use App\Http\Controllers\TeacherAppointmentController;
use App\Http\Controllers\TeacherAvailabilityController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\TeacherFeedbackController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Teacher Routes
    Route::prefix('teacher')->name('teacher.')->group(function () {
        Route::get('/appointments', [TeacherAppointmentController::class, 'index'])->name('appointments.index');
        Route::post('/appointments/{id}/approve', [TeacherAppointmentController::class, 'approve'])->name('appointments.approve');
        Route::post('/appointments/{id}/reject', [TeacherAppointmentController::class, 'reject'])->name('appointments.reject');
        Route::post('/appointments/{id}/start', [TeacherAppointmentController::class, 'start'])->name('appointments.start');

        Route::get('/schedule', [TeacherAppointmentController::class, 'schedule'])->name('schedule');
        Route::get('/availability', [TeacherAvailabilityController::class, 'index'])->name('availability.index');
        Route::post('/availability', [TeacherAvailabilityController::class, 'store'])->name('availability.store');
        Route::delete('/availability/{id}', [TeacherAvailabilityController::class, 'destroy'])->name('availability.destroy');
        Route::get('/sessions', [TeacherAppointmentController::class, 'sessions'])->name('sessions');
        Route::get('/feedback', [TeacherFeedbackController::class, 'index'])->name('feedback');
    });

    // Pupil Routes
    Route::prefix('pupil')->name('pupil.')->group(function () {
        Route::get('/teachers', [TeacherController::class, 'index'])->name('teachers.index');
        Route::get('/booking', [TeacherController::class, 'showBooking'])->name('booking.show');
        Route::get('/bookings', [PupilBookingController::class, 'index'])->name('bookings.index');
        Route::get('/sessions', [PupilSessionController::class, 'index'])->name('sessions.index');
        Route::post('/appointments/{id}/join', [PupilSessionController::class, 'join'])->name('appointments.join');
        Route::get('/progress', [PupilProgressController::class, 'index'])->name('progress.index');
    });
});

Route::middleware('auth')->group(function () {
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings/slots/{teacherId}', [BookingController::class, 'slots']);
    Route::delete('/bookings/{id}', [BookingController::class, 'cancel']);
    Route::post('/feedback', [\App\Http\Controllers\FeedbackController::class, 'store'])->name('feedback.store');
});

Route::get('/auth/google', [GoogleOAuthController::class, 'redirect']);
Route::get('/auth/google/callback', [GoogleOAuthController::class, 'callback']);

require __DIR__.'/settings.php';
