<?php

namespace App\Providers;

use App\Models\User;
use App\Observers\UserObserver;
use Carbon\CarbonImmutable;
use Illuminate\Console\Events\CommandFinished;
use Illuminate\Console\Events\CommandStarting;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        User::observe(UserObserver::class);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        $isWayfinderCommand = $this->app->runningInConsole()
            && collect($_SERVER['argv'] ?? [])->contains(fn ($arg): bool => is_string($arg) && str_contains($arg, 'wayfinder:generate'));

        if (! $isWayfinderCommand && ($appUrl = config('app.url'))) {
            URL::forceRootUrl(rtrim($appUrl, '/'));
            if (str_starts_with($appUrl, 'https://')) {
                URL::forceScheme('https');
            }
        } elseif (! $isWayfinderCommand && app()->isProduction()) {
            if (! app()->runningInConsole() && ! in_array(request()->getHost(), ['localhost', '127.0.0.1'])) {
                URL::forceScheme('https');
            }
        }

        if ($this->app->runningInConsole()) {
            Event::listen(CommandStarting::class, function (CommandStarting $event): void {
                if ($event->command === 'wayfinder:generate') {
                    URL::forceRootUrl(null);
                    URL::forceScheme(null);
                }
            });

            Event::listen(CommandFinished::class, function (CommandFinished $event): void {
                if ($event->command === 'wayfinder:generate' && ($appUrl = config('app.url'))) {
                    URL::forceRootUrl(rtrim($appUrl, '/'));
                    if (str_starts_with($appUrl, 'https://')) {
                        URL::forceScheme('https');
                    }
                }
            });
        }

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): Password => Password::min(6)
            ->mixedCase()
            ->letters()
            ->numbers(),
        );
    }
}
