<?php

namespace App\Console\Commands;

use App\Services\Telegram\TelegramService;
use Illuminate\Console\Command;

class SetTelegramMenuButtonCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'telegram:set-menu-button {--url= : Custom WebApp URL to open} {--text=Practice Speaking : Button text}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Configure the persistent Telegram Bot chat menu button to open ConvoMate Mini App';

    /**
     * Execute the console command.
     */
    public function handle(TelegramService $telegramService): int
    {
        $url = $this->option('url') ?: rtrim((string) config('app.url'), '/').'/tma';
        $text = (string) $this->option('text');

        $this->info("Setting Telegram chat menu button to: {$url} ('{$text}')");

        $success = $telegramService->setMenuButton($url, $text);

        if ($success) {
            $this->info('Successfully configured Telegram chat menu button!');

            return Command::SUCCESS;
        }

        $this->error('Failed to configure Telegram chat menu button. Check your TELEGRAM_BOT_TOKEN.');

        return Command::FAILURE;
    }
}
