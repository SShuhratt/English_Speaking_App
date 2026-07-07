<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Fortify\Features;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $defaultConnection = config('database.default');
        $defaultDatabase = config("database.connections.{$defaultConnection}.database");
        $pgsqlDatabase = config('database.connections.pgsql.database');

        if ($defaultDatabase === 'edtech' || ($defaultConnection === 'pgsql' && $pgsqlDatabase === 'edtech')) {
            throw new \RuntimeException("SAFETY DANGER: Tests are attempting to run on the main database ('edtech')!");
        }
    }

    protected function skipUnlessFortifyHas(string $feature, ?string $message = null): void
    {
        if (! Features::enabled($feature)) {
            $this->markTestSkipped($message ?? "Fortify feature [{$feature}] is not enabled.");
        }
    }
}
