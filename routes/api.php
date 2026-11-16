<?php

use App\Http\Controllers\HumoWebhookController;
use App\Http\Controllers\TelegramWebhookController;
use App\Http\Controllers\WritingMentorController;
use Illuminate\Support\Facades\Route;

Route::post('/telegram/webhook', TelegramWebhookController::class)->name('telegram.webhook');
Route::post('/webhooks/humo-payment', HumoWebhookController::class)->name('webhooks.humo-payment');
Route::post('/integrations/writing-mentor/webhook', [WritingMentorController::class, 'webhook'])
    ->name('integrations.writing-mentor.webhook');
