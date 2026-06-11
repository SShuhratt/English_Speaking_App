<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DiagnosticTest extends TestCase
{
    public function test_reporting_database_connection()
    {
        $connection = DB::getDefaultConnection();
        $database = DB::connection()->getDatabaseName();
        $host = DB::connection()->getConfig('host');

        echo "\n[DIAGNOSTIC] Connection: $connection";
        echo "\n[DIAGNOSTIC] Database: $database";
        echo "\n[DIAGNOSTIC] Host: $host\n";

        $this->assertEquals('edtech_test', $database, "TEST IS USING WRONG DATABASE: $database");
    }
}
