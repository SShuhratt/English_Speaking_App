<?php

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminSupportController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\GoogleOAuthController;
use App\Http\Controllers\MatchmakingController;
use App\Http\Controllers\ProfileViewController;
use App\Http\Controllers\PupilBookingController;
use App\Http\Controllers\PupilProgressController;
use App\Http\Controllers\PupilSessionController;
use App\Http\Controllers\SupportController;
use App\Http\Controllers\TeacherAppointmentController;
use App\Http\Controllers\TeacherAvailabilityController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\TeacherFeedbackController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');
Route::inertia('/privacy', 'privacy')->name('privacy');
Route::inertia('/terms', 'terms')->name('terms');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/profile/{id}', [ProfileViewController::class, 'show'])->name('profile.show');

    // Convomate Support Routes for Pupils & Teachers
    Route::get('/support', [SupportController::class, 'index'])->name('support.index');
    Route::post('/support', [SupportController::class, 'store'])->name('support.store');

    // Admin Routes
    Route::prefix('admin')->name('admin.')->middleware('admin')->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
        Route::post('/appointments/{id}/confirm-payment', [AdminDashboardController::class, 'confirmPayment'])->name('appointments.confirm-payment');
        Route::post('/appointments/{id}/reject-payment', [AdminDashboardController::class, 'rejectPayment'])->name('appointments.reject-payment');

        Route::get('/teachers', [AdminUserController::class, 'teachers'])->name('teachers');
        Route::get('/teachers/{id}', [TeacherController::class, 'show'])->name('teachers.show');
        Route::post('/teachers/{id}/verify', [AdminUserController::class, 'verifyTeacher'])->name('teachers.verify');
        Route::post('/teachers/{id}/certificates', [AdminUserController::class, 'updateCertificates'])->name('teachers.certificates.update');
        Route::post('/teachers/{id}/certificates/{index}/verify', [AdminUserController::class, 'verifySingleCertificate'])->name('teachers.certificates.verify-single');
        Route::get('/pupils', [AdminUserController::class, 'pupils'])->name('pupils');
        Route::delete('/users/{id}', [AdminUserController::class, 'destroy'])->name('users.destroy');

        Route::get('/support', [AdminSupportController::class, 'index'])->name('support');
        Route::post('/support/reply', [AdminSupportController::class, 'reply'])->name('support.reply');
        Route::post('/support/broadcast', [AdminSupportController::class, 'broadcast'])->name('support.broadcast');
    });

    // Teacher Routes
    Route::prefix('teacher')->name('teacher.')->middleware('teacher')->group(function () {
        Route::get('/appointments', [TeacherAppointmentController::class, 'index'])->name('appointments.index');
        Route::post('/appointments/{id}/approve', [TeacherAppointmentController::class, 'approve'])->name('appointments.approve');
        Route::post('/appointments/{id}/reject', [TeacherAppointmentController::class, 'reject'])->name('appointments.reject');
        Route::post('/appointments/{id}/start', [TeacherAppointmentController::class, 'start'])->name('appointments.start');

        Route::get('/schedule', [TeacherAppointmentController::class, 'schedule'])->name('schedule');
        Route::get('/availability', [TeacherAvailabilityController::class, 'index'])->name('availability.index');
        Route::post('/availability', [TeacherAvailabilityController::class, 'store'])->name('availability.store');
        Route::put('/availability/{id}', [TeacherAvailabilityController::class, 'update'])->name('availability.update');
        Route::delete('/availability/{id}', [TeacherAvailabilityController::class, 'destroy'])->name('availability.destroy');
        Route::get('/sessions', [TeacherAppointmentController::class, 'sessions'])->name('sessions');
        Route::get('/feedback', [TeacherFeedbackController::class, 'index'])->name('feedback');
        Route::get('/teachers', [TeacherController::class, 'teacherDirectory'])->name('teachers');
        Route::get('/teachers/{id}', [TeacherController::class, 'show'])->name('teachers.show');
    });

    // Pupil Routes
    Route::prefix('pupil')->name('pupil.')->middleware('pupil')->group(function () {
        Route::get('/teachers', [TeacherController::class, 'index'])->name('teachers.index');
        Route::get('/teachers/{id}', [TeacherController::class, 'show'])->name('teachers.show');
        Route::get('/booking', [TeacherController::class, 'showBooking'])->name('booking.show');
        Route::get('/bookings', [PupilBookingController::class, 'index'])->name('bookings.index');
        Route::get('/sessions', [PupilSessionController::class, 'index'])->name('sessions.index');
        Route::post('/appointments/{id}/join', [PupilSessionController::class, 'join'])->name('appointments.join');
        Route::get('/progress', [PupilProgressController::class, 'index'])->name('progress.index');
        Route::post('/progress/goal', [PupilProgressController::class, 'updateGoal'])->name('progress.goal');
    });

    // Speaking & Matchmaking Routes (only for Pupils)
    Route::middleware('pupil')->group(function () {
        Route::get('/speaking', function () {
            return Inertia\Inertia::render('speaking');
        })->name('speaking');

        Route::post('/matchmaking/join', [MatchmakingController::class, 'join'])->name('matchmaking.join');
        Route::post('/matchmaking/leave', [MatchmakingController::class, 'leave'])->name('matchmaking.leave');
        Route::get('/matchmaking/active-session', [MatchmakingController::class, 'activeSession'])->name('matchmaking.active-session');
        Route::post('/matchmaking/heartbeat', [MatchmakingController::class, 'heartbeat'])->name('matchmaking.heartbeat');
        Route::post('/matchmaking/request', [MatchmakingController::class, 'sendRequest'])->name('matchmaking.request');
        Route::post('/matchmaking/accept', [MatchmakingController::class, 'acceptRequest'])->name('matchmaking.accept');
        Route::post('/matchmaking/decline', [MatchmakingController::class, 'declineRequest'])->name('matchmaking.decline');
    });
});

Route::middleware('auth')->group(function () {
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings/slots/{teacherId}', [BookingController::class, 'slots']);
    Route::delete('/bookings/{id}', [BookingController::class, 'cancel']);
    Route::delete('/appointments/{id}', [BookingController::class, 'destroy']);
    Route::post('/feedback', [FeedbackController::class, 'store'])->name('feedback.store');
});

Route::get('/auth/google', [GoogleOAuthController::class, 'redirect']);
Route::get('/auth/google/callback', [GoogleOAuthController::class, 'callback']);

require __DIR__.'/settings.php';
