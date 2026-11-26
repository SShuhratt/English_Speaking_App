<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use App\Models\TeacherAvailability;
use Illuminate\Support\Facades\Schedule;

Schedule::call(function () {
    TeacherAvailability::where('type', 'custom')
        ->where('end_at', '<', now())
        ->delete();
})->daily();

Schedule::command('appointments:send-reminders')->everyMinute();
Schedule::command('appointments:complete-past')->everyFiveMinutes();
Schedule::command('bookings:expire-unpaid')->everyFiveMinutes();
Schedule::command('group-sessions:auto-cancel-unstarted')->everyMinute();
Schedule::command('group-sessions:send-reminders')->everyMinute();
Schedule::command('group-sessions:expire-unpaid')->everyFiveMinutes();
Schedule::command('group-sessions:complete-past')->everyFiveMinutes();
Schedule::command('partners:expire-vouchers')->daily();
Schedule::command('partner-passes:expire')->daily();
