<?php

// Prevent configuration cache from bleeding into tests by deleting it before booting the app
$configCache = __DIR__ . '/../bootstrap/cache/config.php';
if (file_exists($configCache)) {
    @unlink($configCache);
}

require __DIR__ . '/../vendor/autoload.php';
