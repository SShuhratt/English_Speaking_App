<?php

// Prevent configuration cache from bleeding into tests by deleting it before booting the app
$configCache = __DIR__.'/../bootstrap/cache/config.php';
if (file_exists($configCache)) {
    @unlink($configCache);
}

// Force the test database connection and database to avoid Docker OS-level env overrides
putenv('DB_CONNECTION=testing');
putenv('DB_DATABASE=edtech_test');
putenv('APP_ENV=testing');

$_ENV['DB_CONNECTION'] = 'testing';
$_ENV['DB_DATABASE'] = 'edtech_test';
$_ENV['APP_ENV'] = 'testing';

$_SERVER['DB_CONNECTION'] = 'testing';
$_SERVER['DB_DATABASE'] = 'edtech_test';
$_SERVER['APP_ENV'] = 'testing';

require __DIR__.'/../vendor/autoload.php';
