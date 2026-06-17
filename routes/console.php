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
