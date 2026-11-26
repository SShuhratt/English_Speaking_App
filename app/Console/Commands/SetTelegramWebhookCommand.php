<?php

namespace App\Console\Commands;

use App\Services\Telegram\TelegramService;
use Illuminate\Console\Command;

class SetTelegramWebhookCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'telegram:set-webhook {--url= : Custom webhook URL} {--drop : Drop pending webhook updates}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Configure the Telegram Bot webhook URL to point to this ConvoMate deployment';

    /**
     * Execute the console command.
     */
    public function handle(TelegramService $telegramService): int
    {
        $url = $this->option('url') ?: rtrim((string) config('app.url'), '/').'/api/telegram/webhook';
        $drop = (bool) $this->option('drop');

        $this->info("Setting Telegram webhook to: {$url}");

        if ($telegramService->setWebhook($url, $drop)) {
            $this->info('Successfully configured Telegram webhook!');

            return Command::SUCCESS;
        }

        $this->error('Failed to configure Telegram webhook. Check your TELEGRAM_BOT_TOKEN.');

        return Command::FAILURE;
    }
}
