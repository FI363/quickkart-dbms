<#
.SYNOPSIS
    QuickKart MySQL Terminal Runner for PowerShell
.DESCRIPTION
    Runs an inline SQL query, runs a .sql script file, or enters interactive mode.
.EXAMPLE
    .\mysql-cli.ps1 "SELECT * FROM roles;"
    .\mysql-cli.ps1
    .\mysql-cli.ps1 database\09_test_queries.sql
#>

param(
    [Parameter(Position=0, ValueFromRemainingArguments=$true)]
    [string[]]$QueryArgs
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not $QueryArgs -or $QueryArgs.Count -eq 0) {
    # If no arguments, check if native mysql.exe is present to open native MySQL console,
    # otherwise launch node interactive shell
    $nativeMySQL = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    if (Test-Path $nativeMySQL) {
        Write-Host "Opening native MySQL Client Console for quickkart_db..." -ForegroundColor Green
        & $nativeMySQL -u root -p"MyNewPassword123!" quickkart_db
    } else {
        node "$ScriptDir\query.js" --repl
    }
} else {
    $argString = $QueryArgs -join " "
    node "$ScriptDir\query.js" $argString
}

