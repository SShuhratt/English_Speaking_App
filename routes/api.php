<?php

use App\Http\Controllers\HumoWebhookController;
use App\Http\Controllers\TelegramWebhookController;
use Illuminate\Support\Facades\Route;

Route::post('/telegram/webhook', TelegramWebhookController::class)->name('telegram.webhook');
Route::post('/webhooks/humo-payment', HumoWebhookController::class)->name('webhooks.humo-payment');
